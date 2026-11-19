/**
 * DEV ONLY (break-ui). Community data for the worst-case toggle, shaped exactly like the database
 * functions' results. Limits come from supabase/migrations/20261003000000_community.sql:
 * nickname 2–24 chars of [letters, digits, space, _ . -]; post 1–1000; reply 1–500; up to two
 * blank lines kept; no links. Every value is something a real member could post.
 */
import type { Comment, CommunityNotification, FeedPost, Me } from '@/services/community';

import type { DataMode } from './data-mode';

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const DAY = 24 * 60;

// 1000 characters: the database maximum for a post.
const LONG_POST = (
  'Day 3 and honestly this is the hardest it has been. I work nights at the warehouse and the ' +
  'whole crew goes out to the loading dock at 2am to smoke, every single night, and I used to be ' +
  'the one who organised it. Tonight I stayed inside and pretended to check the inventory sheets ' +
  'for twenty minutes so I would not have to walk past them. My hands keep looking for something ' +
  'to do. I chewed through a whole pack of gum and drank four coffees, which I know is probably ' +
  'making it worse. My sister says it gets easier after the first week but right now a week ' +
  'sounds like a year. The thing that helped most was the urge surfing timer, I did it three ' +
  'times in the break room and the craving actually went down from a 9 to a 5 each time. I keep ' +
  'telling myself I am doing this for my daughter Zofia, she drew me a picture of our family ' +
  'with no cigarettes in it and I put it on the fridge. If anyone else works nights, how do you ' +
  'get through the 2am break? I could really use some ideas tonight. Thanks all.'
).slice(0, 1000);

// 500 characters: the database maximum for a reply.
const LONG_REPLY = (
  'I worked nights for six years so I really get this. What saved me was changing what my hands ' +
  'did at the exact moment the break started: I kept a cold bottle of water in my locker and ' +
  'walked one full lap of the building while everyone else went to the dock. The first four nights ' +
  'were awful, by the second week the lap was just my new break. Also tell one person at work, ' +
  'just one, it makes it so much harder to slip quietly. You are already doing the hardest part. ' +
  'Proud of you, keep going tonight!'
).slice(0, 500);

const base = {
  room: 'cravings' as const,
  lang: 'en' as const,
  edited: false,
  is_anonymous: false,
  is_mine: false,
  reactions: {},
  my_reactions: [],
  comment_count: 0,
  saved: false,
};

const WORST_POSTS: FeedPost[] = [
  {
    ...base,
    id: 9001,
    type: 'craving',
    body: LONG_POST,
    created_at: ago(400 * DAY),
    edited: true,
    // 24 characters, no spaces: the longest nickname the database accepts.
    author_name: 'Wisniewska-Kowalczyk.Ola',
    reactions: { with_you: 1284, you_got_this: 312, ride_wave: 97, not_alone: 1000 },
    my_reactions: ['with_you'],
    comment_count: 1284,
    saved: true,
  },
  {
    ...base,
    id: 9002,
    room: 'smoke_free',
    type: 'milestone',
    // No spaces: nowhere for the browser to wrap.
    body: '#day30#smokefree#nevergiveup#onedayatatime#proudofmyself#30daysfree',
    created_at: ago(1),
    author_name: null,
    is_anonymous: true,
    reactions: { congrats: 1, with_you: 1 },
    comment_count: 1,
  },
  {
    ...base,
    id: 9003,
    type: 'difficult_day',
    body: 'Rough day.\n\nSmoked two after the meeting with my manager.\n\nStarting again tomorrow, not giving up.',
    created_at: ago(0),
    author_name: 'dana',
    is_mine: true,
  },
  {
    ...base,
    id: 9004,
    type: 'milestone',
    lang: 'ar',
    room: 'smoke_free',
    body: 'اليوم الثلاثين بدون سجائر مع FivehunCig 💪 شكراً لكل من شجعني في الليالي الصعبة',
    created_at: ago(59),
    author_name: 'نور الهدى عبد الرحمن',
    reactions: { congrats: 42 },
  },
  {
    ...base,
    id: 9005,
    type: 'motivation',
    body: '💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪💪',
    created_at: ago(23 * 60),
    author_name: 'Jo',
  },
  {
    ...base,
    id: 9006,
    room: 'starting',
    type: 'daily_prompt',
    body: '«What will you do with the money you save?»\nTake my mum to Marrakech for her 60th birthday, she has never been on a plane.',
    created_at: ago(8 * DAY),
    author_name: 'Seán O.Brien',
  },
];

const WORST_COMMENTS: Comment[] = [
  { id: 1, parent_id: null, body: LONG_REPLY, created_at: ago(399 * DAY), author_name: 'Christopher Montgomery 3', is_anonymous: false, is_mine: false, by_post_author: false },
  { id: 2, parent_id: 1, body: 'Thank you, I am trying the water bottle tonight 🙏', created_at: ago(398 * DAY), author_name: 'Wisniewska-Kowalczyk.Ola', is_anonymous: false, is_mine: false, by_post_author: true },
  { id: 3, parent_id: null, body: '#youcandoit#onedayatatime#keepgoing#proudofyou', created_at: ago(30), author_name: null, is_anonymous: true, is_mine: false, by_post_author: false },
  { id: 4, parent_id: null, body: 'Same here.', created_at: ago(0), author_name: 'Jo', is_anonymous: false, is_mine: true, by_post_author: false },
];

const ONE_POST: FeedPost = {
  ...base,
  id: 9101,
  type: 'craving',
  body: 'First post here. Having a craving after dinner.',
  created_at: ago(DAY),
  author_name: 'Sam Lee',
  reactions: { with_you: 1 },
  comment_count: 1,
};

const ONE_COMMENT: Comment = { id: 11, parent_id: null, body: 'You can do this.', created_at: ago(60), author_name: 'Jo', is_anonymous: false, is_mine: false, by_post_author: false };

const ME: Me = { nickname: 'Wisniewska-Kowalczyk.Ola', role: 'member', restricted_until: null, banned: false, notify_support: true, notify_replies: true };

/** Undefined means "not faked": the real call runs. Writes always succeed and change nothing. */
export function communityFixture(mode: DataMode, fn: string, args: Record<string, unknown>): unknown {
  const worst = mode === 'worst' || mode === 'heavy';
  const posts = worst ? WORST_POSTS : mode === 'one' ? [ONE_POST] : [];
  const comments = worst ? WORST_COMMENTS : mode === 'one' ? [ONE_COMMENT] : [];
  switch (fn) {
    case 'community_me':
      return [ME];
    case 'community_feed':
      return args.p_id != null ? posts.filter((p) => p.id === args.p_id) : posts;
    case 'community_comments':
      return comments;
    case 'community_notifications': {
      // The app asks for at most 30, so 30 unread is the real maximum for the badge.
      const n = mode === 'worst' ? 30 : mode === 'one' ? 1 : 0;
      return Array.from({ length: n }, (_, i): CommunityNotification => ({ id: i + 1, kind: 'support', post_id: 9001, created_at: ago(i), read: false }));
    }
    case 'community_blocked_count':
      return mode === 'worst' ? 1284 : mode === 'one' ? 1 : 0;
    default:
      return null;
  }
}
