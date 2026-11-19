# Peer-support community

A small, moderated quit-smoking community: share a craving, a hard day or a milestone, get support, and go straight back to urge surfing or the AI companion. Not a social network: no follower counts, no likes leaderboard, no infinite engagement notifications.

## Setup (once)

1. Create a Supabase project (you create it; the app never sees your account).
2. **Authentication → Sign In / Providers → enable "Anonymous sign-ins".** Members get an anonymous account with no email or phone.
3. Strongly recommended: CAPTCHA, because anonymous sign-ups are otherwise easy to automate.
   1. Create a free hCaptcha account and a site; under the site's hostnames, add the hostname your web app is served from (e.g. `localhost` for development). Copy the **site key** and your account **secret**.
   2. Supabase **Authentication → Attack Protection → Enable CAPTCHA protection**, provider **hCaptcha**, paste the **secret**, save.
   3. Set `EXPO_PUBLIC_HCAPTCHA_SITE_KEY` (the site key, public) in `.env.local` and restart Expo.

   The check runs once, when a member taps **Join** (usually invisible; a puzzle only when hCaptcha is unsure). Returning members reuse their saved session. Turn CAPTCHA on in Supabase and set the site key together: with CAPTCHA on and no site key, nobody can join.
4. Run the migration: paste `supabase/migrations/20261003000000_community.sql` into the SQL editor, or `npx supabase link` then `npx supabase db push`.
5. Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (both public by design). **Never** put the `service_role` key in the app.
6. Make a moderator (SQL editor): `update private.profiles set role = 'moderator' where nickname = 'TheirNickname';`

Without step 5 the Community tab shows "isn't set up yet" and everything else works offline.

## Security model

- Tables live in the `private` schema (not exposed by the API) with RLS enabled and forced and no client privileges. The app can only call `public.community_*` and `public.mod_*` functions.
- Each function is `security definer` with an empty `search_path`, identifies the caller with `auth.uid()` (never an id sent by the app), validates input, and checks permissions: own posts/replies only for edit/delete; moderator role for `mod_*`; banned/restricted members cannot post or react. The unauthenticated `anon` role can call nothing.
- Anonymous posts never return the author. Feed and reply results contain no user ids. Blocking an anonymous author is done server-side by post id, so it works without revealing who it is.
- Text is plain text only (React Native renders no HTML): control characters stripped, length limits, **links refused**, duplicates within a day refused.
- Rate limits: 5 posts / 10 min and 20 / day; 15 replies / 10 min and 100 / day; 20 reports / day.
- Reports: one per member per item; three different reporters hide the item until a moderator decides (hidden, not deleted). Crisis words in a post or reply (detected in the app) add a "self-harm concern" report that moderators see first; the post stays visible.
- Moderators can hide, remove, restore, dismiss, warn, pause posting (1–30 days) and ban. Every action is logged in `private.moderation_actions`.
- "Leave the community" (and Settings → Delete all my data) deletes the profile and, by cascade, all posts, replies, reactions, saves, blocks and notifications of that member.

## Product rules

- From a craving to help in 1–2 taps: Today → SOS (or Community → 🔥 I need support) → talk to people / urge surfing / AI companion.
- Supportive reactions only (I'm with you, You got this, Ride the wave, Congrats, You're not alone). Counts are shown on the post, never ranked.
- Points: replying to support *someone else* earns 5 points, at most 3 times a day. Posting, reacting, time in the app and reactions received earn nothing.
- "A difficult day" posts show "One difficult moment doesn't erase your progress."
- Activity is in-app only ("Someone supported your post"), never naming who, and members can switch each kind off. No phone push notifications yet.
- Feed shows posts in the member's language by default; "All languages" shows everything.

## Testing

- `npm run test:db`: runs the real migration in PGlite (Postgres 18 in WebAssembly) and checks, as different callers: anonymous access denied, no direct table access, nickname rules, anonymous authors hidden, edit/delete only own content, text cleaning and link refusal, duplicates and rate limits, pagination and filters, single-post reads follow feed rules, reply depth, notifications (once, without actor), reactions limited to the supportive set, private saves, report threshold, blocks both ways, crisis concern reports, moderator-only actions and audit log, account deletion cascade.
- `node supabase/dev/local-server.mjs`: a local backend (dev only) that runs the real migration and answers Supabase's anonymous sign-up and RPC endpoints, so the app can be tried end to end without Docker or a cloud project. Point `.env.local` at `http://localhost:54321` while using it, and remove that afterwards.

## Remaining work

- Not yet tested against a real Supabase project (no project/credentials here); first run the migration there and repeat the member journeys.
- Phone push notifications (needs push tokens and a server-side sender).
- A "reach out" moderator action for self-harm concerns (send the member verified crisis resources) instead of only dismiss/hide.
- Realtime updates are intentionally not used; the feed refreshes when the screen is opened.
