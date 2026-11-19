-- FivehunCig peer-support community.
--
-- Security model (see docs/COMMUNITY.md):
-- * All tables live in the `private` schema, which the API does not expose. RLS is enabled and
--   forced with no policies, and client roles get no table privileges: there is no way to read
--   or write a row directly.
-- * The app calls only the `public.community_*` / `public.mod_*` functions below. Each one is
--   SECURITY DEFINER with an empty search_path, identifies the caller with auth.uid() (never with
--   an id sent by the client), and validates every input.
-- * Authors of anonymous posts are never returned. Results never include user ids, except to
--   moderators in the moderation queue.

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------- tables

create table private.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 24),
  role text not null default 'member' check (role in ('member', 'moderator')),
  restricted_until timestamptz,
  banned boolean not null default false,
  warnings integer not null default 0,
  notify_support boolean not null default true,
  notify_replies boolean not null default true,
  created_at timestamptz not null default now()
);

create table private.posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references private.profiles (id) on delete cascade,
  room text not null check (room in ('starting', 'cravings', 'smoke_free', 'challenge')),
  type text not null check (type in ('general', 'craving', 'difficult_day', 'milestone', 'motivation', 'daily_prompt', 'challenge')),
  body text not null check (char_length(body) between 1 and 1000),
  lang text not null check (lang in ('en', 'fr', 'ar')),
  is_anonymous boolean not null default false,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  edited_at timestamptz,
  created_at timestamptz not null default now()
);
create index posts_feed_idx on private.posts (status, created_at desc, id desc);
create index posts_room_idx on private.posts (room, created_at desc, id desc);
create index posts_author_idx on private.posts (author_id, created_at desc);

create table private.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references private.posts (id) on delete cascade,
  parent_id bigint references private.comments (id) on delete cascade,
  author_id uuid not null references private.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  is_anonymous boolean not null default false,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);
create index comments_post_idx on private.comments (post_id, created_at);
create index comments_parent_idx on private.comments (parent_id);
create index comments_author_idx on private.comments (author_id, created_at desc);

create table private.reactions (
  post_id bigint not null references private.posts (id) on delete cascade,
  user_id uuid not null references private.profiles (id) on delete cascade,
  kind text not null check (kind in ('with_you', 'you_got_this', 'ride_wave', 'congrats', 'not_alone')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);
create index reactions_user_idx on private.reactions (user_id);

create table private.saves (
  user_id uuid not null references private.profiles (id) on delete cascade,
  post_id bigint not null references private.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index saves_post_idx on private.saves (post_id);

create table private.blocks (
  blocker_id uuid not null references private.profiles (id) on delete cascade,
  blocked_id uuid not null references private.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on private.blocks (blocked_id);

create table private.reports (
  id bigint generated always as identity primary key,
  -- null for reports raised by the system (e.g. a self-harm concern detected on posting)
  reporter_id uuid references private.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id bigint not null,
  reason text not null check (reason in ('harassment', 'spam', 'hate', 'dangerous_advice', 'sexual', 'self_harm', 'misinformation', 'other')),
  note text check (char_length(note) <= 300),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references private.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index reports_once_idx on private.reports (reporter_id, target_type, target_id) where reporter_id is not null;
create index reports_open_idx on private.reports (status, created_at);
create index reports_target_idx on private.reports (target_type, target_id);
create index reports_resolved_by_idx on private.reports (resolved_by);

create table private.notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references private.profiles (id) on delete cascade,
  -- who caused it; never returned to the recipient
  actor_id uuid references private.profiles (id) on delete cascade,
  kind text not null check (kind in ('support', 'reply', 'celebrate', 'warning')),
  post_id bigint references private.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_recipient_idx on private.notifications (recipient_id, created_at desc);
create index notifications_actor_idx on private.notifications (actor_id);
create index notifications_post_idx on private.notifications (post_id);
-- One "support"/"celebrate" notification per person per post, however often they toggle reactions.
create unique index notifications_once_idx on private.notifications (recipient_id, kind, post_id, actor_id) where kind in ('support', 'celebrate');

create table private.moderation_actions (
  id bigint generated always as identity primary key,
  moderator_id uuid references private.profiles (id) on delete set null,
  action text not null check (action in ('hide', 'remove', 'restore', 'dismiss', 'resolve', 'warn', 'restrict', 'ban', 'unban')),
  target_type text check (target_type in ('post', 'comment', 'user', 'report')),
  target_id text,
  reason text check (char_length(reason) <= 300),
  created_at timestamptz not null default now()
);
create index moderation_actions_moderator_idx on private.moderation_actions (moderator_id);

do $$
declare t text;
begin
  foreach t in array array['profiles', 'posts', 'comments', 'reactions', 'saves', 'blocks', 'reports', 'notifications', 'moderation_actions'] loop
    execute format('alter table private.%I enable row level security', t);
    execute format('alter table private.%I force row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- private helpers

-- The caller's id. Every public function starts here.
create function private.require_user() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  return uid;
end $$;

create function private.require_profile() returns private.profiles
language plpgsql stable security definer set search_path = '' as $$
declare p private.profiles;
begin
  select * into p from private.profiles where id = private.require_user();
  if not found then raise exception 'no_profile' using errcode = 'P0002'; end if;
  return p;
end $$;

create function private.require_profile_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select (private.require_profile()).id;
$$;

create function private.require_can_post() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare p private.profiles := private.require_profile();
begin
  if p.banned then raise exception 'banned' using errcode = '42501'; end if;
  if p.restricted_until is not null and p.restricted_until > now() then
    raise exception 'restricted' using errcode = '42501';
  end if;
  return p.id;
end $$;

create function private.require_moderator() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare p private.profiles := private.require_profile();
begin
  if p.role <> 'moderator' then raise exception 'forbidden' using errcode = '42501'; end if;
  return p.id;
end $$;

-- Plain text only: trims, removes control characters, collapses runs of blank lines. Links are
-- refused (spam and unsafe "advice" usually come with one). Note: in Postgres regex, \y is the
-- word boundary ( would mean backspace).
create function private.clean_text(raw text, max_len integer) returns text
language plpgsql immutable set search_path = '' as $$
declare t text;
begin
  t := regexp_replace(coalesce(raw, ''), '[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]', '', 'g');
  t := regexp_replace(t, '\n{3,}', E'\n\n', 'g');
  t := btrim(t);
  if char_length(t) = 0 then raise exception 'empty' using errcode = '22023'; end if;
  if char_length(t) > max_len then raise exception 'too_long' using errcode = '22001'; end if;
  if t ~* '(https?://|www\.|[a-z0-9-]+\.(com|net|org|io|ly|me|xyz|info|biz|link|click)\y)' then
    raise exception 'links_not_allowed' using errcode = '22023';
  end if;
  return t;
end $$;

-- Fixed-window rate limit on the caller's own rows.
create function private.check_rate(uid uuid, what text) returns void
language plpgsql stable security definer set search_path = '' as $$
declare recent integer; daily integer;
begin
  if what = 'post' then
    select count(*) filter (where created_at > now() - interval '10 minutes'), count(*)
      into recent, daily from private.posts where author_id = uid and created_at > now() - interval '1 day';
    if recent >= 5 or daily >= 20 then raise exception 'rate_limited' using errcode = '53400'; end if;
  elsif what = 'comment' then
    select count(*) filter (where created_at > now() - interval '10 minutes'), count(*)
      into recent, daily from private.comments where author_id = uid and created_at > now() - interval '1 day';
    if recent >= 15 or daily >= 100 then raise exception 'rate_limited' using errcode = '53400'; end if;
  elsif what = 'report' then
    select count(*) into daily from private.reports where reporter_id = uid and created_at > now() - interval '1 day';
    if daily >= 20 then raise exception 'rate_limited' using errcode = '53400'; end if;
  end if;
end $$;

create function private.display_name(author uuid, anonymous boolean) returns text
language sql stable security definer set search_path = '' as $$
  select case when anonymous then null else (select nickname from private.profiles where id = author) end;
$$;

-- Is there a block between the caller and this author, in either direction?
create function private.blocked_between(viewer uuid, author uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from private.blocks
    where (blocker_id = viewer and blocked_id = author) or (blocker_id = author and blocked_id = viewer)
  );
$$;

-- ---------------------------------------------------------------- profile

create function public.community_me()
returns table (nickname text, role text, restricted_until timestamptz, banned boolean, notify_support boolean, notify_replies boolean)
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := private.require_user();
begin
  return query select p.nickname, p.role, p.restricted_until, p.banned, p.notify_support, p.notify_replies
    from private.profiles p where p.id = uid;
end $$;

create function public.community_set_profile(p_nickname text, p_notify_support boolean default true, p_notify_replies boolean default true)
returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_user(); nick text;
begin
  nick := btrim(coalesce(p_nickname, ''));
  if nick !~ '^[[:alnum:] _.-]{2,24}$' then raise exception 'invalid_nickname' using errcode = '22023'; end if;
  -- Nobody may pose as staff or as "anonymous".
  if lower(nick) ~ '(admin|moderat|support team|fivehuncig|anonym)' then
    raise exception 'reserved_nickname' using errcode = '22023';
  end if;
  insert into private.profiles (id, nickname, notify_support, notify_replies)
  values (uid, nick, coalesce(p_notify_support, true), coalesce(p_notify_replies, true))
  on conflict (id) do update
    set nickname = excluded.nickname, notify_support = excluded.notify_support, notify_replies = excluded.notify_replies;
end $$;

-- Leaves the community: deletes the profile and, by cascade, every post, reply, reaction,
-- save, block and notification of this member.
create function public.community_delete_my_data() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from private.profiles where id = private.require_user();
end $$;

-- ---------------------------------------------------------------- reading

create function public.community_feed(
  p_room text default null,
  p_lang text default null,
  p_saved_only boolean default false,
  p_mine_only boolean default false,
  p_before_created timestamptz default null,
  p_before_id bigint default null,
  p_limit integer default 20,
  -- One post by id, under exactly the same visibility and block rules as the feed.
  p_id bigint default null
)
returns table (
  id bigint, room text, type text, body text, lang text, created_at timestamptz, edited boolean,
  author_name text, is_anonymous boolean, is_mine boolean, reactions jsonb, my_reactions text[],
  comment_count integer, saved boolean
)
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := private.require_user();
begin
  return query
  select
    po.id, po.room, po.type, po.body, po.lang, po.created_at, po.edited_at is not null,
    private.display_name(po.author_id, po.is_anonymous), po.is_anonymous, po.author_id = uid,
    coalesce((select jsonb_object_agg(r.kind, r.n) from (
      select re.kind, count(*) as n from private.reactions re where re.post_id = po.id group by re.kind) r), '{}'::jsonb),
    coalesce((select array_agg(re.kind) from private.reactions re where re.post_id = po.id and re.user_id = uid), '{}'),
    (select count(*)::integer from private.comments c where c.post_id = po.id and c.status = 'visible'),
    exists (select 1 from private.saves s where s.post_id = po.id and s.user_id = uid)
  from private.posts po
  where po.status = 'visible'
    and (p_room is null or po.room = p_room)
    and (p_lang is null or po.lang = p_lang)
    and (not p_saved_only or exists (select 1 from private.saves s where s.post_id = po.id and s.user_id = uid))
    and (not p_mine_only or po.author_id = uid)
    and (p_id is null or po.id = p_id)
    and not private.blocked_between(uid, po.author_id)
    and (p_before_created is null or (po.created_at, po.id) < (p_before_created, coalesce(p_before_id, 9223372036854775807)))
  order by po.created_at desc, po.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
end $$;

create function public.community_comments(p_post bigint)
returns table (id bigint, parent_id bigint, body text, created_at timestamptz, author_name text, is_anonymous boolean, is_mine boolean, by_post_author boolean)
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := private.require_user(); post_author uuid;
begin
  select po.author_id into post_author from private.posts po where po.id = p_post and po.status = 'visible';
  if not found or private.blocked_between(uid, post_author) then return; end if;
  return query
  select c.id, c.parent_id, c.body, c.created_at, private.display_name(c.author_id, c.is_anonymous), c.is_anonymous,
         c.author_id = uid, c.author_id = post_author
  from private.comments c
  where c.post_id = p_post and c.status = 'visible' and not private.blocked_between(uid, c.author_id)
  order by c.created_at, c.id
  limit 200;
end $$;

-- ---------------------------------------------------------------- writing

create function public.community_create_post(
  p_room text, p_type text, p_body text, p_lang text, p_anonymous boolean default false, p_concern boolean default false
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_can_post(); clean text; new_id bigint;
begin
  clean := private.clean_text(p_body, 1000);
  perform private.check_rate(uid, 'post');
  if exists (select 1 from private.posts where author_id = uid and body = clean and created_at > now() - interval '1 day') then
    raise exception 'duplicate' using errcode = '23505';
  end if;
  insert into private.posts (author_id, room, type, body, lang, is_anonymous)
  values (uid, p_room, p_type, clean, p_lang, coalesce(p_anonymous, false))
  returning private.posts.id into new_id;
  -- Crisis words detected in the app: a moderator looks at it soon. The post stays visible.
  if coalesce(p_concern, false) then
    insert into private.reports (reporter_id, target_type, target_id, reason) values (null, 'post', new_id, 'self_harm');
  end if;
  return new_id;
end $$;

create function public.community_edit_post(p_post bigint, p_body text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_can_post(); clean text;
begin
  clean := private.clean_text(p_body, 1000);
  update private.posts set body = clean, edited_at = now()
   where id = p_post and author_id = uid and status = 'visible';
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
end $$;

create function public.community_delete_post(p_post bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from private.posts where id = p_post and author_id = private.require_user();
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
end $$;

create function public.community_add_comment(
  p_post bigint, p_body text, p_parent bigint default null, p_anonymous boolean default false, p_concern boolean default false
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_can_post(); clean text; post_author uuid; new_id bigint; wants boolean;
begin
  clean := private.clean_text(p_body, 500);
  select author_id into post_author from private.posts where id = p_post and status = 'visible';
  if not found or private.blocked_between(uid, post_author) then raise exception 'not_found' using errcode = 'P0002'; end if;
  -- Replies go at most two levels deep: post → reply → reply.
  if p_parent is not null and not exists (
    select 1 from private.comments where id = p_parent and post_id = p_post and parent_id is null and status = 'visible'
  ) then
    raise exception 'invalid_parent' using errcode = '22023';
  end if;
  perform private.check_rate(uid, 'comment');
  insert into private.comments (post_id, parent_id, author_id, body, is_anonymous)
  values (p_post, p_parent, uid, clean, coalesce(p_anonymous, false))
  returning private.comments.id into new_id;
  if coalesce(p_concern, false) then
    insert into private.reports (reporter_id, target_type, target_id, reason) values (null, 'comment', new_id, 'self_harm');
  end if;
  if post_author <> uid then
    select notify_replies into wants from private.profiles where id = post_author;
    if wants then
      insert into private.notifications (recipient_id, actor_id, kind, post_id) values (post_author, uid, 'reply', p_post);
    end if;
  end if;
  return new_id;
end $$;

create function public.community_delete_comment(p_comment bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from private.comments where id = p_comment and author_id = private.require_user();
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
end $$;

create function public.community_react(p_post bigint, p_kind text, p_on boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_can_post(); post_author uuid; post_type text; wants boolean;
begin
  select author_id, type into post_author, post_type from private.posts where id = p_post and status = 'visible';
  if not found or private.blocked_between(uid, post_author) then raise exception 'not_found' using errcode = 'P0002'; end if;
  if not coalesce(p_on, false) then
    delete from private.reactions where post_id = p_post and user_id = uid and kind = p_kind;
    return;
  end if;
  insert into private.reactions (post_id, user_id, kind) values (p_post, uid, p_kind) on conflict do nothing;
  if post_author <> uid then
    select notify_support into wants from private.profiles where id = post_author;
    if wants then
      insert into private.notifications (recipient_id, actor_id, kind, post_id)
      values (post_author, uid, case when p_kind = 'congrats' and post_type = 'milestone' then 'celebrate' else 'support' end, p_post)
      on conflict do nothing;
    end if;
  end if;
end $$;

create function public.community_save(p_post bigint, p_on boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_profile_id();
begin
  if coalesce(p_on, false) then
    if not exists (select 1 from private.posts where id = p_post and status = 'visible') then
      raise exception 'not_found' using errcode = 'P0002';
    end if;
    insert into private.saves (user_id, post_id) values (uid, p_post) on conflict do nothing;
  else
    delete from private.saves where user_id = uid and post_id = p_post;
  end if;
end $$;

-- Three different members reporting the same content hides it until a moderator decides.
-- Hidden is not deleted; moderators can restore it.
create function public.community_report(p_target_type text, p_target bigint, p_reason text, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_profile_id(); reporters integer;
begin
  if p_target_type = 'post' then
    perform 1 from private.posts where id = p_target and status = 'visible';
  elsif p_target_type = 'comment' then
    perform 1 from private.comments where id = p_target and status = 'visible';
  else
    raise exception 'invalid_target' using errcode = '22023';
  end if;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  perform private.check_rate(uid, 'report');
  insert into private.reports (reporter_id, target_type, target_id, reason, note)
  values (uid, p_target_type, p_target, p_reason, nullif(btrim(coalesce(p_note, '')), ''))
  on conflict do nothing;
  select count(distinct reporter_id) into reporters from private.reports
   where target_type = p_target_type and target_id = p_target and status = 'open' and reporter_id is not null;
  if reporters >= 3 then
    if p_target_type = 'post' then update private.posts set status = 'hidden' where id = p_target and status = 'visible';
    else update private.comments set status = 'hidden' where id = p_target and status = 'visible'; end if;
  end if;
end $$;

-- Blocks the author of a post or reply. The author is looked up here, so blocking works for
-- anonymous posts without ever revealing who wrote them.
create function public.community_block_author(p_target_type text, p_target bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_profile_id(); author uuid;
begin
  if p_target_type = 'post' then select author_id into author from private.posts where id = p_target;
  elsif p_target_type = 'comment' then select author_id into author from private.comments where id = p_target;
  else raise exception 'invalid_target' using errcode = '22023'; end if;
  if author is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if author = uid then raise exception 'cannot_block_self' using errcode = '22023'; end if;
  insert into private.blocks (blocker_id, blocked_id) values (uid, author) on conflict do nothing;
end $$;

create function public.community_blocked_count() returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from private.blocks where blocker_id = private.require_user();
$$;

create function public.community_unblock_all() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from private.blocks where blocker_id = private.require_user();
end $$;

-- ---------------------------------------------------------------- notifications (in-app)

create function public.community_notifications(p_limit integer default 30)
returns table (id bigint, kind text, post_id bigint, created_at timestamptz, read boolean)
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := private.require_user();
begin
  return query select n.id, n.kind, n.post_id, n.created_at, n.read_at is not null
    from private.notifications n
    where n.recipient_id = uid
    order by n.created_at desc
    limit least(greatest(coalesce(p_limit, 30), 1), 100);
end $$;

create function public.community_mark_read() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update private.notifications set read_at = now() where recipient_id = private.require_user() and read_at is null;
end $$;

-- ---------------------------------------------------------------- moderation

create function public.mod_reports(p_limit integer default 50)
returns table (
  report_id bigint, target_type text, target_id bigint, reason text, note text, created_at timestamptz,
  reports_on_target integer, content text, content_status text, author_id uuid, author_nickname text, author_warnings integer
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_moderator();
  return query
  select r.id, r.target_type, r.target_id, r.reason, r.note, r.created_at,
    (select count(*)::integer from private.reports r2 where r2.target_type = r.target_type and r2.target_id = r.target_id and r2.status = 'open'),
    coalesce(po.body, co.body), coalesce(po.status, co.status), au.id, au.nickname, au.warnings
  from private.reports r
  left join private.posts po on r.target_type = 'post' and po.id = r.target_id
  left join private.comments co on r.target_type = 'comment' and co.id = r.target_id
  left join private.profiles au on au.id = coalesce(po.author_id, co.author_id)
  where r.status = 'open'
  order by (r.reason = 'self_harm') desc, r.created_at
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
end $$;

-- hide / remove / restore a post or reply, and close its open reports.
create function public.mod_set_status(p_target_type text, p_target bigint, p_status text, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare moderator uuid := private.require_moderator();
begin
  if p_status not in ('visible', 'hidden', 'removed') then raise exception 'invalid_status' using errcode = '22023'; end if;
  if p_target_type = 'post' then update private.posts set status = p_status where id = p_target;
  elsif p_target_type = 'comment' then update private.comments set status = p_status where id = p_target;
  else raise exception 'invalid_target' using errcode = '22023'; end if;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  update private.reports set status = 'resolved', resolved_by = moderator, resolved_at = now()
   where target_type = p_target_type and target_id = p_target and status = 'open';
  insert into private.moderation_actions (moderator_id, action, target_type, target_id, reason)
  values (moderator, case p_status when 'visible' then 'restore' when 'hidden' then 'hide' else 'remove' end, p_target_type, p_target::text, p_reason);
end $$;

create function public.mod_dismiss_report(p_report bigint, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare moderator uuid := private.require_moderator();
begin
  update private.reports set status = 'dismissed', resolved_by = moderator, resolved_at = now() where id = p_report and status = 'open';
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  insert into private.moderation_actions (moderator_id, action, target_type, target_id, reason) values (moderator, 'dismiss', 'report', p_report::text, p_reason);
end $$;

-- warn: a private notice; restrict: no posting for N days (1..30); ban: no posting at all.
create function public.mod_act_on_user(p_user uuid, p_action text, p_days integer default null, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare moderator uuid := private.require_moderator();
begin
  if p_user = moderator then raise exception 'cannot_act_on_self' using errcode = '22023'; end if;
  if p_action = 'warn' then
    update private.profiles set warnings = warnings + 1 where id = p_user;
    insert into private.notifications (recipient_id, kind) values (p_user, 'warning');
  elsif p_action = 'restrict' then
    if p_days is null or p_days not between 1 and 30 then raise exception 'invalid_days' using errcode = '22023'; end if;
    update private.profiles set restricted_until = now() + make_interval(days => p_days) where id = p_user;
  elsif p_action = 'ban' then
    update private.profiles set banned = true where id = p_user;
  elsif p_action = 'unban' then
    update private.profiles set banned = false, restricted_until = null where id = p_user;
  else
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  insert into private.moderation_actions (moderator_id, action, target_type, target_id, reason) values (moderator, p_action, 'user', p_user::text, p_reason);
end $$;

-- ---------------------------------------------------------------- privileges

-- Helpers are internal; nobody calls them directly.
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

-- Public functions: signed-in members only (Supabase anonymous sign-ins use the `authenticated`
-- role). The unauthenticated `anon` role can call nothing.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like 'community\_%' or p.proname like 'mod\_%')
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
