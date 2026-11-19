// Runs the real community migration in PGlite (Postgres compiled to WebAssembly) and checks the
// security rules as different callers. Run with: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, beforeEach, describe, test } from 'node:test';

const migration = readFileSync(new URL('../migrations/20261003000000_community.sql', import.meta.url), 'utf8');

// Minimal stand-in for what Supabase provides: roles, auth.users and auth.uid() from the JWT.
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
`;

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const C = '00000000-0000-0000-0000-00000000000c';
const D = '00000000-0000-0000-0000-00000000000d';
const MOD = '00000000-0000-0000-0000-0000000000ff';

let db;

/** Runs a query as a signed-in member (uid), or as the unauthenticated anon role (uid = null). */
async function as(uid, sql, params = []) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
  try {
    return (await db.query(sql, params)).rows;
  } finally {
    await db.exec('reset role');
  }
}

async function rejects(promise, pattern) {
  await assert.rejects(promise, (e) => {
    assert.match(e.message, pattern);
    return true;
  });
}

const post = (uid, body, extra = {}) =>
  as(uid, `select public.community_create_post($1, $2, $3, $4, $5, $6) as id`, [
    extra.room ?? 'cravings',
    extra.type ?? 'craving',
    body,
    extra.lang ?? 'en',
    extra.anonymous ?? false,
    extra.concern ?? false,
  ]).then((r) => r[0].id);

const feed = (uid, args = '') => as(uid, `select * from public.community_feed(${args})`);

before(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  await db.exec(migration);
  for (const id of [A, B, C, D, MOD]) await db.query('insert into auth.users (id) values ($1)', [id]);
  for (const [id, nick] of [[A, 'Sam'], [B, 'Quitter42'], [C, 'Lina'], [D, 'Omar'], [MOD, 'Helper']]) {
    await as(id, `select public.community_set_profile($1)`, [nick]);
  }
  await db.query(`update private.profiles set role = 'moderator' where id = $1`, [MOD]);
});

// Each test starts with fresh rate-limit and duplicate windows: earlier rows are aged by two days.
// (The limits themselves are tested in 'duplicates and flooding are refused'.)
beforeEach(async () => {
  if (!db) return;
  await db.exec(`reset role;
    update private.posts set created_at = created_at - interval '2 days';
    update private.comments set created_at = created_at - interval '2 days';`);
});

describe('access boundary', () => {
  test('the unauthenticated role can call nothing', async () => {
    await rejects(as(null, `select * from public.community_feed()`), /permission denied/);
    await rejects(as(null, `select public.community_create_post('cravings','craving','hi','en')`), /permission denied/);
  });

  test('members cannot read or write tables directly', async () => {
    await rejects(as(A, 'select * from private.posts'), /permission denied/);
    await rejects(as(A, `update private.profiles set role = 'moderator'`), /permission denied/);
    await rejects(as(A, 'select private.require_moderator()'), /permission denied/);
  });

  test('posting needs a community profile', async () => {
    await db.query('insert into auth.users (id) values ($1)', ['00000000-0000-0000-0000-000000000099']);
    await rejects(post('00000000-0000-0000-0000-000000000099', 'hello'), /no_profile/);
  });

  test('nicknames are validated and staff names are reserved', async () => {
    await rejects(as(A, `select public.community_set_profile('a')`), /invalid_nickname/);
    await rejects(as(A, `select public.community_set_profile('<script>')`), /invalid_nickname/);
    await rejects(as(A, `select public.community_set_profile('Admin Team')`), /reserved_nickname/);
    await rejects(as(A, `select public.community_set_profile('Anonymous')`), /reserved_nickname/);
  });
});

describe('posts', () => {
  test('anonymous posts never reveal their author, and the feed has no user ids', async () => {
    const id = await post(A, 'Day 7 smoke-free!', { type: 'milestone', room: 'smoke_free', anonymous: true });
    const row = (await feed(B)).find((r) => r.id === id);
    assert.equal(row.author_name, null);
    assert.equal(row.is_mine, false);
    assert.ok(!Object.keys(row).some((k) => k.includes('author_id') || k === 'user_id'));
    assert.equal((await feed(A)).find((r) => r.id === id).is_mine, true);
  });

  test('another member cannot edit or delete my post by changing the id', async () => {
    const id = await post(A, 'Mine to change');
    await rejects(as(B, `select public.community_edit_post($1, 'hacked')`, [id]), /not_found/);
    await rejects(as(B, `select public.community_delete_post($1)`, [id]), /not_found/);
    await as(A, `select public.community_edit_post($1, 'Changed by me')`, [id]);
    const row = (await feed(B)).find((r) => r.id === id);
    assert.equal(row.body, 'Changed by me');
    assert.equal(row.edited, true);
    await as(A, `select public.community_delete_post($1)`, [id]);
    assert.equal((await feed(B)).some((r) => r.id === id), false);
  });

  test('text is cleaned; links, empty and overlong posts are refused', async () => {
    const id = await post(C, '  Hard day\u0007 today  ');
    assert.equal((await feed(C)).find((r) => r.id === id).body, 'Hard day today');
    await rejects(post(C, 'buy now at https://spam.example'), /links_not_allowed/);
    await rejects(post(C, 'visit cheap-pills.com'), /links_not_allowed/);
    await rejects(post(C, '   '), /empty/);
    await rejects(post(C, 'x'.repeat(1001)), /too_long/);
  });

  test('invalid room or type is refused by the database', async () => {
    await rejects(post(C, 'hi', { room: 'everyone' }), /check constraint/);
    await rejects(post(C, 'hi', { type: 'ad' }), /check constraint/);
  });

  test('duplicates and flooding are refused', async () => {
    await post(D, 'same text');
    await rejects(post(D, 'same text'), /duplicate/);
    for (let i = 0; i < 4; i++) await post(D, `post ${i}`);
    await rejects(post(D, 'one too many'), /rate_limited/);
  });

  test('a single post is read through the same rules as the feed', async () => {
    const id = await post(B, 'single post check', { type: 'general', room: 'starting' });
    assert.equal((await feed(A, `p_id => ${id}`)).length, 1);
    await as(A, `select public.community_block_author('post', $1)`, [id]);
    assert.equal((await feed(A, `p_id => ${id}`)).length, 0);
    await as(A, 'select public.community_unblock_all()');
    await as(MOD, `select public.mod_set_status('post', $1, 'hidden')`, [id]);
    assert.equal((await feed(A, `p_id => ${id}`)).length, 0);
  });

  test('feed pages by (created_at, id) and filters by room and language', async () => {
    const page1 = await feed(B, 'p_limit => 3');
    assert.equal(page1.length, 3);
    const last = page1[2];
    const page2 = await as(B, `select * from public.community_feed(p_limit => 3, p_before_created => $1, p_before_id => $2)`, [last.created_at, last.id]);
    assert.ok(page2.every((r) => !page1.some((p) => p.id === r.id)));
    assert.ok((await feed(B, `p_room => 'smoke_free'`)).every((r) => r.room === 'smoke_free'));
    await post(C, 'Bonjour à tous', { lang: 'fr', room: 'starting', type: 'general' });
    assert.ok((await feed(B, `p_lang => 'fr'`)).every((r) => r.lang === 'fr'));
  });
});

describe('replies, reactions and notifications', () => {
  test('replies go two levels deep at most, and notify the author once per reply', async () => {
    const id = await post(C, 'Having a strong craving tonight', { room: 'cravings' });
    const r1 = (await as(B, `select public.community_add_comment($1, 'You got this, it passes.') as id`, [id]))[0].id;
    const r2 = (await as(C, `select public.community_add_comment($1, 'Thank you!', $2) as id`, [id, r1]))[0].id;
    await rejects(as(B, `select public.community_add_comment($1, 'too deep', $2)`, [id, r2]), /invalid_parent/);
    const comments = await as(A, `select * from public.community_comments($1)`, [id]);
    assert.deepEqual(comments.map((c) => c.by_post_author), [false, true]);
    const notes = await as(C, `select * from public.community_notifications()`);
    assert.equal(notes.filter((n) => n.kind === 'reply' && n.post_id === id).length, 1);
    assert.ok(!Object.keys(notes[0]).some((k) => k.includes('actor')));
    await rejects(as(A, `select public.community_delete_comment($1)`, [r1]), /not_found/);
  });

  test('reactions are limited to the supportive set and notify once however often toggled', async () => {
    const id = await post(C, 'Made it through my first weekend', { type: 'milestone', room: 'smoke_free' });
    await rejects(as(B, `select public.community_react($1, 'like', true)`, [id]), /check constraint/);
    for (let i = 0; i < 3; i++) {
      await as(B, `select public.community_react($1, 'congrats', true)`, [id]);
      await as(B, `select public.community_react($1, 'congrats', false)`, [id]);
    }
    await as(B, `select public.community_react($1, 'congrats', true)`, [id]);
    const row = (await feed(C)).find((r) => r.id === id);
    assert.deepEqual(row.reactions, { congrats: 1 });
    const notes = (await as(C, `select * from public.community_notifications()`)).filter((n) => n.post_id === id);
    assert.deepEqual(notes.map((n) => n.kind), ['celebrate']);
  });

  test('saving is private to the member', async () => {
    const id = await post(C, 'Worth keeping', { type: 'general', room: 'starting' });
    await as(A, `select public.community_save($1, true)`, [id]);
    assert.deepEqual((await feed(A, 'p_saved_only => true')).map((r) => r.id), [id]);
    assert.equal((await feed(B)).find((r) => r.id === id).saved, false);
  });
});

describe('reports, blocks and moderation', () => {
  test('three different reporters hide a post; one reporter counts once', async () => {
    const id = await post(MOD, 'questionable advice', { type: 'general', room: 'starting' });
    for (let i = 0; i < 3; i++) await as(A, `select public.community_report('post', $1, 'dangerous_advice')`, [id]);
    assert.ok((await feed(C)).some((r) => r.id === id));
    await as(B, `select public.community_report('post', $1, 'dangerous_advice')`, [id]);
    await as(C, `select public.community_report('post', $1, 'misinformation', 'says to double the patches')`, [id]);
    assert.equal((await feed(C)).some((r) => r.id === id), false);
    await rejects(as(A, `select public.community_report('post', $1, 'just because')`, [id]), /not_found|check constraint/);
  });

  test('blocking hides content both ways, works on anonymous authors, and never reveals them', async () => {
    const anon = await post(B, 'anonymous craving post', { anonymous: true });
    await as(A, `select public.community_block_author('post', $1)`, [anon]);
    assert.equal((await feed(A)).some((r) => r.id === anon), false);
    const fromA = await post(A, 'A writes after blocking', { type: 'general', room: 'starting' });
    assert.equal((await feed(B)).some((r) => r.id === fromA), false);
    await rejects(as(B, `select public.community_add_comment($1, 'hi')`, [fromA]), /not_found/);
    await rejects(as(A, `select public.community_block_author('post', $1)`, [fromA]), /cannot_block_self/);
    assert.equal((await as(A, 'select public.community_blocked_count() as n'))[0].n, 1);
    await as(A, 'select public.community_unblock_all()');
    assert.ok((await feed(A)).some((r) => r.id === anon));
  });

  test('crisis words create a moderator report without hiding the post', async () => {
    const id = await post(C, 'I feel like giving up on everything', { type: 'difficult_day', concern: true });
    assert.ok((await feed(A)).some((r) => r.id === id));
    const queue = await as(MOD, 'select * from public.mod_reports()');
    assert.equal(queue[0].reason, 'self_harm');
    assert.equal(queue[0].target_id, id);
  });

  test('members cannot moderate', async () => {
    await rejects(as(A, 'select * from public.mod_reports()'), /forbidden/);
    await rejects(as(A, `select public.mod_act_on_user($1, 'ban')`, [B]), /forbidden/);
    await rejects(as(A, `select public.mod_set_status('post', 1, 'removed')`), /forbidden/);
  });

  test('moderators can hide, restore, warn, restrict and ban, and every action is logged', async () => {
    const id = await post(D, 'something rude', { type: 'general', room: 'starting' });
    await as(MOD, `select public.mod_set_status('post', $1, 'hidden', 'rude')`, [id]);
    assert.equal((await feed(A)).some((r) => r.id === id), false);
    await as(MOD, `select public.mod_set_status('post', $1, 'visible')`, [id]);
    assert.ok((await feed(A)).some((r) => r.id === id));

    await as(MOD, `select public.mod_act_on_user($1, 'warn', null, 'be kind')`, [D]);
    assert.ok((await as(D, 'select * from public.community_notifications()')).some((n) => n.kind === 'warning'));
    await as(MOD, `select public.mod_act_on_user($1, 'restrict', 3)`, [D]);
    await rejects(post(D, 'still here?'), /restricted/);
    await as(MOD, `select public.mod_act_on_user($1, 'ban')`, [D]);
    await rejects(as(D, `select public.community_react($1, 'with_you', true)`, [id]), /banned/);
    await rejects(as(MOD, `select public.mod_act_on_user($1, 'ban')`, [MOD]), /cannot_act_on_self/);
    const logged = (await db.query('select action from private.moderation_actions order by id')).rows.map((r) => r.action);
    assert.deepEqual(logged.slice(-5), ['hide', 'restore', 'warn', 'restrict', 'ban']);
  });

  test('leaving the community deletes everything of mine', async () => {
    await as(C, 'select public.community_delete_my_data()');
    const left = (await db.query(`select
      (select count(*) from private.posts where author_id = $1) +
      (select count(*) from private.comments where author_id = $1) +
      (select count(*) from private.reactions where user_id = $1) +
      (select count(*) from private.notifications where recipient_id = $1) as n`, [C])).rows[0].n;
    assert.equal(Number(left), 0);
    await rejects(post(C, 'back?'), /no_profile/);
  });
});
