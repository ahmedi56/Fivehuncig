# Architecture and decisions

## Requirements (v1)

- **Users:** adult smokers, many of them not ready to quit; low motivation, little patience.
- **Platforms:** iOS and Android from one codebase.
- **Scope:** offline-first. No accounts, no payments. One optional, opt-in server feature: the AI support chat (see `docs/AI_CHAT.md`).
- **Non-functional:** fast start, works with no internet, private by default, accessible, no shaming copy.

## Decisions

| Decision | Choice | Why | Alternatives considered |
|---|---|---|---|
| App framework | **Expo SDK 57 (React Native 0.86) + TypeScript** | One codebase for iOS + Android; Expo Go for instant testing on a real phone; EAS cloud builds iOS without a Mac (the dev machine is Windows). | Flutter (equally capable, but Expo gives faster on-device testing without native toolchains); native Swift + Kotlin (2× the work). |
| Navigation | **Expo Router**, native tabs | File-based routes, native tab bar on both platforms, `Stack.Protected` gates onboarding. | React Navigation directly (more boilerplate). |
| State + storage | **zustand + persist → AsyncStorage**, one JSON document | Data is small (≈ 20k timestamps max after years), single user, no queries beyond "last N days". A database would be overhead. Capped list sizes keep it fast. Versioned (`version: 1`) with a `migrate` hook. | expo-sqlite (worth it once we need queries or sync); MMKV (needs a dev build, not Expo Go). |
| Domain logic | **Pure functions in `src/domain`** with Jest tests | The rules that matter (timer, money, streaks, badges) are testable without UI and can move to a server later unchanged. | Logic in components (untestable). |
| Notifications | **expo-notifications, local only** | Timer-done + daily If-Then reminders. Every call fails soft; the app works with notifications denied. | Push via server (not needed offline). |
| Photos | **expo-image-picker → copied into app documents** | Reasons-wall photos survive cache clears; deleted with the reason or on "Delete all my data". | Store picker URIs (cache can be wiped). |
| Styling | **StyleSheet + small token file** (`theme.ts`) | No extra dependency; light/dark palettes; one type scale. | NativeWind/Tamagui (more setup than this app needs). |
| Charts | Plain `View` bars + `react-native-svg` ring | Two simple visuals don't justify a chart library. | victory-native, etc. |
| Languages | **English, French, Arabic** as typed dictionaries in `src/i18n` (`fr`/`ar` are typed as `Messages`, so a missing string fails the typecheck); `expo-localization` picks the phone's language until the user chooses one | No runtime dependency beyond an Expo module; parameters and plurals are plain typed functions. Hand-written CLDR plural rules, because Hermes does not ship `Intl.PluralRules` everywhere. Domain code returns ids and codes, never display text. | i18next / i18n-js (string keys, no compile-time check of parameters). |
| Right-to-left | **Native RTL off** (`expo-localization` plugin, `supportsRTL: false`); direction is set in JS (`direction` style on every `Screen`, explicit `textAlign`/`writingDirection` in `Text` and `Field`) | On SDK 57, native RTL is disabled in Expo Go and switching it needs `Updates.reloadAsync()`, which does not work in Expo Go. JS direction behaves the same everywhere and switches instantly with no restart. Trade-off: native chrome (stack header back arrow, native tab order) stays LTR. | `I18nManager.forceRTL` + reload. |
| AI chat | **Expo Router API route** (`src/app/api/chat+api.ts`, `web.output: "server"`) calling Claude with the official SDK; safety, validation and rate limits in `src/server`, shared wire types in `src/domain/chat.ts` | The key stays on the server; no separate backend to run; the rest of the app keeps working offline. Opt-in consent, minimal context, no stored conversations. | Calling the model from the app (would ship the key); a separate backend service (more to operate). |
| Community | **Supabase** (Postgres + anonymous auth). Tables in a non-exposed `private` schema; the app calls only security-definer functions that use `auth.uid()`, validate input, rate-limit and enforce ownership/moderator rights. Feed with replies, no realtime. | Server-side authorization that can't be bypassed by editing ids; no emails collected; moderation built in. Tested by running the real SQL in PGlite (`npm run test:db`). | Firebase (weaker for moderation queries); own server (more auth code to own). |
| Sound | **expo-audio** (local files only), original sounds synthesised for the app in `assets/sounds` (pentatonic notes, chime, knock, a 14-second wave loop matching one 4-4-6 breath) | Each Pattern Pop bubble has its own note, so the sequence is a tune as well as a pattern (more to hold in working memory); Block Drop gets landing and row sounds; calm waves are an optional comfort in Breathe and Urge surfing. Respects the silent switch, mixes with other audio, fails soft, switches in Settings (game sounds on, waves off by default). No video in SOS: watching is passive, and the craving evidence favours active tasks. The expo-audio config plugin is not used (no background audio, no microphone). | Bundled music or recorded audio (licensing, size); `expo-speech` voice prompts (sound differs by device). |
| Support lines | Verified data in `src/resources/support.ts` with source URL and check date per entry, tested | No invented numbers; easy to update by pull request. | Admin CMS (needs accounts and a backend). |
| Learn library | Article text in the dictionaries; order, category, icon and sources in `src/i18n/articles.ts` | One place to add an article; each language must supply every article (enforced by tests). Sources link to top-level WHO/CDC/NHS/NCI/FDA pages because deep links move. | Remote CMS (needs a backend; not justified offline). |

## Data model (`src/domain/types.ts`)

- `Profile`: baseline cigarettes/day, pack price/size, currency, awake hours, mode, start/cut-down/quit timestamps, weekly step.
- `SmokeEvent { id, at, early?, trigger? }`
- `CravingEvent { id, at, beaten, tool?, trigger? }`
- `TriggerId`: stress, coffee, alcohol, social, boredom, meal, work, other. Optional, one tap; added without a schema version bump because old data simply has no trigger.
- `language?: 'en' | 'fr' | 'ar'` and `hapticsOff?: boolean` (display preferences, kept when the user deletes their data)
- `Plan { id, trigger, action, hour?, minute?, notificationId? }`
- `Reason { id, text, photoUri? }`
- `CravingRating { id, tool, at, before?, after, smokedAfter?, followUpId? }` (schema v2; `UrgeSurfSession.reflection?` was added in the same version): "Craving now? 0–10" before and after an SOS tool and the 30-minute "Did you smoke after that?" answer. Persisted state is versioned; `migrateState` in `src/store/app-store.ts` brings v1 data to v2 (no ratings yet).

## Key rules

- **Timer gap** = awake hours ÷ baseline/day (min 15 min), × (1 + weeklyStep)^fullWeeksOnPlan, capped at one per awake day.
- **Cigarettes avoided** = Σ per day max(0, expected − actual); today's expectation is pro-rated by time elapsed, so nobody is credited for cigarettes they haven't had time to smoke.
- **Slip** never erases past smoke-free days; only the current streak restarts.
- **Badges** require real behaviour, not app opens.
- **Nudge** appears only after 3+ days, at most once a week if dismissed.
- **Reminders stay in sync:** logging, undoing and changing mode all go through `services/actions.ts`, which moves or cancels the "timer done" notification. Leaving cut-down mode always cancels it.
- **Journey (points, challenges, memories, Your best):** pure functions in `src/domain/journey.ts` and `src/domain/memories.ts`, recomputed from the logged events (cravings, urge-surf sessions, lessons, plans, smoke-free days). No score is stored, so nothing can be counted twice and a cigarette never removes points or memories. Difficulty measures the exercise, never cigarette counts; two completed challenges unlock the next level and lower levels stay open. The "league" ranks a member's week only against their own past weeks.
- **No shared leaderboard (yet):** ranking members against each other needs accounts and a server-side event log so points can be recomputed server-side (never accepted from the app). Not built: it would break the "no account" promise; see docs/LEADERBOARD.md for the design if you decide to add it.
- **Craving ratings** (`src/domain/ratings.ts`): the member's own before/after scores rank their tools by average drop ("Your best tool", only after 2+ rated uses with a real drop). The follow-up is a local notification 30 minutes later that opens `/follow-up?id=`; the same question also appears on Today from 30 minutes to a day later, so it works without notifications. Everything stays on the phone. Evidence: docs/RESEARCH_QUIT_EVIDENCE.md, "Cross-cutting measurement".
- **SOS activities** (ordered on the SOS screen by acute-craving evidence, docs/RESEARCH_QUIT_EVIDENCE.md section 3): Move it (5-minute walk, `activities/move`), Squeeze (3-minute isometric routine, `activities/squeeze`), Block Drop (3-minute block puzzle with a hard stop, `games/block-drop`), breathing, Memory match (6 → 8 → 10 pairs, 3-minute cap), Pattern Pop (remember-the-sequence, replaces Bubble pop at `games/bubbles`), urge surfing (with a "what did it actually feel like?" reflection step) and Vivid Escape (2-minute guided imagery, `activities/imagery`). Timings, steps and game rules are pure and tested in `src/domain/activities.ts`, `blocks.ts` and `pattern.ts`. Block Drop never ends in failure: a full board starts fresh and eases the speed. No audio and no step counter (no new dependency); vibration follows the Settings switch, and nothing animates that reduced motion would need to stop.
- **Untrusted route params:** `/learn/[id]`, `/plans?trigger=`, `/slip?smoke=` and `/follow-up?id=` only accept known ids; a tapped notification may only open `/follow-up?id=`; anything else is ignored or shows a not-found state.

## Security and privacy

- No network calls except opening help links in the browser. No analytics SDKs, no ads.
- No secrets in the app. Nothing to leak server-side because there is no server.
- All user text is trimmed and length-limited; numbers are validated (`validate.ts`).
- Data at rest is in the app sandbox, protected by the phone's own encryption. If sensitive-data requirements grow (accounts, sync), move to encrypted storage and add a backend threat model.
- "Export my data" and "Delete all my data" are in Settings.

## Testing

- `src/domain/domain.test.ts`: timer schedule, stats, money, streaks, health timeline, nudges, badges, validation, formatting.
- `src/store/app-store.test.ts`: onboarding, early-cigarette flag, undo, mode switching, plans/reasons/cravings, trigger tagging, reset (keeps language).
- `src/services/actions.test.ts`: the timer reminder is scheduled, moved on undo, and cancelled when leaving cut-down mode; a rating schedules its follow-up and answering cancels it.
- `src/domain/activities.test.ts`, `blocks.test.ts`, `pattern.test.ts`: walk cues, the 3-minute squeeze routine, imagery prompts, memory levels; block movement, rotation, line clears, a fresh board instead of game over, speed; sequence building and adaptive length.
- `src/domain/ratings.test.ts`: score validation, average drop, best tool (minimum uses, ties), when the follow-up is due.
- `src/services/notifications.test.ts`: `expo-notifications` is never loaded in Android Expo Go or on web.
- `src/i18n/i18n.test.ts`: French and Arabic have exactly the same strings, lists and functions as English; no empty text; Arabic/French plural rules; plan sentences (French elision, Arabic).
- UI verified by walking the full flow in a phone-sized browser (light and dark). **Still to do on real devices:** notifications, photo picker, haptics, native tab bar.

## Roadmap (from the research, in order)

1. **v1.1:** home-screen widget for one-tap logging; craving-time patterns ("you usually crave at 10:00").
2. **v2 (needs backend):** accounts + encrypted cloud backup, buddy check-in ("I'm OK" / "Help me"). Suggested: Supabase (Postgres + auth + row-level security) or Firebase. Requires privacy policy update.
3. **v3:** AI "Talk it out" coach (motivational interviewing) via a server-side LLM call with safety guardrails and quitline hand-off; never call the model from the app with an embedded key.
4. **Later:** Promise Pot deposits (needs payments provider, legal review per country, CO/cotinine verification), smartwatch smoking detection, craving forecast.

## Release switches (Oct 2026)

`src/config/features.ts` keeps the AI chat and the Community out of the first test release (no API budget, no moderator). They are on in development and off in release builds unless the build sets `EXPO_PUBLIC_FEATURE_CHAT=1` / `EXPO_PUBLIC_FEATURE_COMMUNITY=1`. When off, every entry point is hidden (Community tab, SOS, More, Settings, Urge surf result, tour), the screens redirect to Today, and `POST /api/chat` answers 404. The `expo-web-release-features` entry in `.claude/launch.json` runs the dev server with both off.

Other safety basics from the same review: notifications use neutral words only ("Mahla · A quick check-in"), so nothing about smoking shows on a lock screen; onboarding asks for one 18+ and consent tick (saved as `consentedAt`, store v4); Help lists when to talk to a doctor (marked CLINICIAN_REVIEW).
