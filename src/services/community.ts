import type { ChatLang } from '@/domain/chat';

import { captchaSiteKey, getSupabase, supabaseConfigured } from './supabase';

/**
 * The app side of the community. Every call goes to a database function in
 * supabase/migrations/20261003000000_community.sql, which checks who is calling (from the
 * signed-in session, never from ids sent here), validates input, and applies rate limits.
 */

export const ROOMS = ['starting', 'cravings', 'smoke_free', 'challenge'] as const;
export type Room = (typeof ROOMS)[number];

export const POST_TYPES = ['craving', 'difficult_day', 'milestone', 'motivation', 'general', 'daily_prompt', 'challenge'] as const;
export type PostType = (typeof POST_TYPES)[number];

export const REACTIONS = ['with_you', 'you_got_this', 'ride_wave', 'congrats', 'not_alone'] as const;
export type Reaction = (typeof REACTIONS)[number];

export const REPORT_REASONS = ['harassment', 'spam', 'hate', 'dangerous_advice', 'sexual', 'self_harm', 'misinformation', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Default room for each kind of post; the member can change it. */
export const ROOM_FOR: Record<PostType, Room> = {
  craving: 'cravings',
  difficult_day: 'cravings',
  motivation: 'cravings',
  milestone: 'smoke_free',
  general: 'starting',
  daily_prompt: 'starting',
  challenge: 'challenge',
};

export interface FeedPost {
  id: number;
  room: Room;
  type: PostType;
  body: string;
  lang: ChatLang;
  created_at: string;
  edited: boolean;
  /** Null for anonymous posts. */
  author_name: string | null;
  is_anonymous: boolean;
  is_mine: boolean;
  reactions: Partial<Record<Reaction, number>>;
  my_reactions: Reaction[];
  comment_count: number;
  saved: boolean;
}

export interface Comment {
  id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  author_name: string | null;
  is_anonymous: boolean;
  is_mine: boolean;
  by_post_author: boolean;
}

export interface Me {
  nickname: string;
  role: 'member' | 'moderator';
  restricted_until: string | null;
  banned: boolean;
  notify_support: boolean;
  notify_replies: boolean;
}

export interface CommunityNotification {
  id: number;
  kind: 'support' | 'reply' | 'celebrate' | 'warning';
  post_id: number | null;
  created_at: string;
  read: boolean;
}

export interface ModReport {
  report_id: number;
  target_type: 'post' | 'comment';
  target_id: number;
  reason: ReportReason;
  note: string | null;
  created_at: string;
  reports_on_target: number;
  content: string | null;
  content_status: string | null;
  author_id: string | null;
  author_nickname: string | null;
  author_warnings: number | null;
}

export type CommunityError =
  | 'not_configured'
  | 'network'
  | 'not_authenticated'
  | 'captcha_required'
  | 'captcha_failed'
  | 'no_profile'
  | 'banned'
  | 'restricted'
  | 'rate_limited'
  | 'duplicate'
  | 'links_not_allowed'
  | 'empty'
  | 'too_long'
  | 'invalid_nickname'
  | 'reserved_nickname'
  | 'not_found'
  | 'forbidden'
  | 'unknown';

const KNOWN: CommunityError[] = [
  'not_authenticated',
  'no_profile',
  'banned',
  'restricted',
  'rate_limited',
  'duplicate',
  'links_not_allowed',
  'empty',
  'too_long',
  'invalid_nickname',
  'reserved_nickname',
  'not_found',
  'forbidden',
];

export type Result<T> = { ok: true; data: T } | { ok: false; error: CommunityError };

/** Maps a database or network error to a code the UI can explain. Never shows raw errors. */
export function toCommunityError(error: { message?: string; code?: string } | null | undefined): CommunityError {
  const message = error?.message ?? '';
  const known = KNOWN.find((k) => message === k || message.includes(k));
  if (known) return known;
  if (/captcha/i.test(message)) return 'captcha_failed';
  if (/fetch|network|Failed to fetch|timeout/i.test(message)) return 'network';
  return 'unknown';
}

async function hasSession(): Promise<boolean> {
  try {
    const { data } = await getSupabase()!.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

/** Anonymous sign-in (no email, no phone). The token is required when CAPTCHA is on in Supabase. */
async function signIn(captchaToken?: string): Promise<Result<true>> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'not_configured' };
  try {
    const { error } = await sb.auth.signInAnonymously(captchaToken ? { options: { captchaToken } } : undefined);
    return error ? { ok: false, error: toCommunityError(error) } : { ok: true, data: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}

/**
 * Reuses the saved session. Without one: with CAPTCHA on, the member must join first (the Join
 * button runs the check); otherwise sign in anonymously right away.
 */
async function session(): Promise<Result<true>> {
  if (!getSupabase()) return { ok: false, error: 'not_configured' };
  if (await hasSession()) return { ok: true, data: true };
  if (captchaSiteKey()) return { ok: false, error: 'captcha_required' };
  return signIn();
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<Result<T>> {
  if (__DEV__) {
    // break-ui worst-case toggle (web dev builds only): answer from fixtures, no network.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- dev-only, stripped from production
    const { devDataMode } = require('@/dev/data-mode') as typeof import('@/dev/data-mode');
    const mode = devDataMode();
    if (mode !== 'demo') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- dev-only, stripped from production
      const { communityFixture } = require('@/dev/community-fixtures') as typeof import('@/dev/community-fixtures');
      return { ok: true, data: communityFixture(mode, fn, args) as T };
    }
  }
  if (!supabaseConfigured()) return { ok: false, error: 'not_configured' };
  const s = await session();
  if (!s.ok) return s;
  try {
    const { data, error } = await getSupabase()!.rpc(fn, args);
    return error ? { ok: false, error: toCommunityError(error) } : { ok: true, data: data as T };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export const community = {
  configured: () => {
    if (__DEV__) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- dev-only, stripped from production
      const { devDataMode } = require('@/dev/data-mode') as typeof import('@/dev/data-mode');
      if (devDataMode() !== 'demo') return true; // fixtures stand in for the backend
    }
    return supabaseConfigured();
  },
  hasSession: () => (getSupabase() ? hasSession() : Promise.resolve(false)),
  signIn,

  me: async (): Promise<Result<Me | undefined>> => {
    const r = await rpc<Me[]>('community_me');
    // Not signed in yet (CAPTCHA pending): same as not joined.
    if (!r.ok && r.error === 'captcha_required') return { ok: true, data: undefined };
    return r.ok ? { ok: true, data: r.data[0] } : r;
  },
  setProfile: (nickname: string, notifySupport = true, notifyReplies = true) =>
    rpc<null>('community_set_profile', { p_nickname: nickname, p_notify_support: notifySupport, p_notify_replies: notifyReplies }),
  deleteMyData: async (): Promise<Result<null>> => {
    // Never signed in: nothing on the server to delete (and no account to create for it).
    if (!getSupabase() || !(await hasSession())) return { ok: true, data: null };
    const r = await rpc<null>('community_delete_my_data');
    if (r.ok) await getSupabase()?.auth.signOut();
    return r;
  },

  feed: (opts: { room?: Room; lang?: ChatLang; savedOnly?: boolean; mineOnly?: boolean; before?: FeedPost; limit?: number; id?: number } = {}) =>
    rpc<FeedPost[]>('community_feed', {
      p_room: opts.room ?? null,
      p_lang: opts.lang ?? null,
      p_saved_only: opts.savedOnly ?? false,
      p_mine_only: opts.mineOnly ?? false,
      p_before_created: opts.before?.created_at ?? null,
      p_before_id: opts.before?.id ?? null,
      p_limit: opts.limit ?? 20,
      p_id: opts.id ?? null,
    }),
  comments: (postId: number) => rpc<Comment[]>('community_comments', { p_post: postId }),

  createPost: (p: { room: Room; type: PostType; body: string; lang: ChatLang; anonymous: boolean; concern: boolean }) =>
    rpc<number>('community_create_post', {
      p_room: p.room,
      p_type: p.type,
      p_body: p.body,
      p_lang: p.lang,
      p_anonymous: p.anonymous,
      p_concern: p.concern,
    }),
  editPost: (postId: number, body: string) => rpc<null>('community_edit_post', { p_post: postId, p_body: body }),
  deletePost: (postId: number) => rpc<null>('community_delete_post', { p_post: postId }),
  addComment: (p: { postId: number; body: string; parentId?: number; anonymous: boolean; concern: boolean }) =>
    rpc<number>('community_add_comment', {
      p_post: p.postId,
      p_body: p.body,
      p_parent: p.parentId ?? null,
      p_anonymous: p.anonymous,
      p_concern: p.concern,
    }),
  deleteComment: (commentId: number) => rpc<null>('community_delete_comment', { p_comment: commentId }),
  react: (postId: number, kind: Reaction, on: boolean) => rpc<null>('community_react', { p_post: postId, p_kind: kind, p_on: on }),
  save: (postId: number, on: boolean) => rpc<null>('community_save', { p_post: postId, p_on: on }),
  report: (targetType: 'post' | 'comment', targetId: number, reason: ReportReason, note?: string) =>
    rpc<null>('community_report', { p_target_type: targetType, p_target: targetId, p_reason: reason, p_note: note ?? null }),
  blockAuthor: (targetType: 'post' | 'comment', targetId: number) =>
    rpc<null>('community_block_author', { p_target_type: targetType, p_target: targetId }),
  blockedCount: () => rpc<number>('community_blocked_count'),
  unblockAll: () => rpc<null>('community_unblock_all'),

  notifications: () => rpc<CommunityNotification[]>('community_notifications', { p_limit: 30 }),
  markRead: () => rpc<null>('community_mark_read'),

  modReports: () => rpc<ModReport[]>('mod_reports', { p_limit: 50 }),
  modSetStatus: (targetType: 'post' | 'comment', targetId: number, status: 'visible' | 'hidden' | 'removed', reason?: string) =>
    rpc<null>('mod_set_status', { p_target_type: targetType, p_target: targetId, p_status: status, p_reason: reason ?? null }),
  modDismiss: (reportId: number) => rpc<null>('mod_dismiss_report', { p_report: reportId, p_reason: null }),
  modActOnUser: (userId: string, action: 'warn' | 'restrict' | 'ban', days?: number) =>
    rpc<null>('mod_act_on_user', { p_user: userId, p_action: action, p_days: days ?? null, p_reason: null }),
};
