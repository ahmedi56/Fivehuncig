# AI support chat

An opt-in companion for cravings and stress. Everything else in FivehunCig stays offline; the chat is the only feature that sends anything off the phone, and only after the member agrees.

## Flow

```
Member ─► Chat screen (src/app/chat.tsx)
            │  1. Crisis words? → fixed safety card + verified lines, on the phone, no network
            │  2. Otherwise POST /api/chat with: language, last ≤12 turns, minimal context
            ▼
          API route (src/app/api/chat+api.ts) → orchestrator (src/server/chat-handler.ts)
            │  validate (src/domain/chat.ts) → safety again → rate limit → provider
            ▼
          Claude (src/server/anthropic.ts), streamed back as NDJSON lines
            │  {t:'delta'} … {t:'done'}  |  {t:'safety'}  |  {t:'error', code}
            ▼
          Member sees text as it arrives; can record "Craving passed" / "I smoked"
```

## Safety

- `src/domain/safety.ts` detects self-harm and medical-emergency language in English, French and Arabic (accent/diacritic-insensitive). It runs on the phone **and** on the server; a match never reaches the model. The reply is fixed text plus verified lines from `src/resources/support.ts`.
- The system prompt (`src/server/prompt.ts`) sets the role: supportive companion, not a clinician. No diagnosis, prescribing, dosing or outcome promises; general nicotine-replacement information only, with referral to a pharmacist/doctor; no invented statistics or phone numbers; refers emergencies to local services; redirects off-topic questions.
- `stop_reason: "refusal"` is handled (the member sees a neutral message), and `fallbacks: "default"` re-runs classifier declines on Anthropic's recommended fallback model.
- Detection is keyword-based and deliberately broad. It will not catch every phrasing; the system prompt is the second line. Review both with a clinician before launch.

## Privacy and data minimisation

- Consent screen before first use; Settings can turn it off; "Delete all my data" withdraws consent.
- Sent per request: the member's messages (last 12 turns) and coarse numbers (approach, hours since last cigarette, usual per day, cravings beaten, up to 3 trigger ids). Never names, reasons, plans, photos or the full log.
- Conversations are kept in memory only and vanish when the screen closes.
- Server logs are metrics only: outcome, language, model, turn count, latency, time to first token, token counts, estimated cost. Never message text (tested).
- The `x-install-id` header is a random id for rate limiting, not linked to a person.
- Anthropic processes the messages under its API terms. Update `docs/PRIVACY.md` with your company details and data-processing agreement before launch.

## Cost and abuse controls

- Model `claude-opus-5-5` at `effort: "low"`, `max_tokens: 1024`, history bounded to 12 turns and 1,000 characters per member message. Override with `CHAT_MODEL`.
- Rate limits (`src/server/rate-limit.ts`): 20 messages / 10 min and 120 / day per install, 3,000 / day overall. **In-memory, per server instance**: move to a shared store (Redis, KV) before relying on them as a hard budget.
- One request at a time per screen (the send button is disabled while a reply streams; repeated taps are ignored). 30 s server timeout, 40 s client timeout.
- No prompt caching: the stable prompt is below the model's minimum cacheable length, so a cache marker would do nothing.

## Setup

1. Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. Never use an `EXPO_PUBLIC_` name for it.
2. `npx expo start`. In development, the app's relative `fetch('/api/chat')` reaches the dev server on web, iOS and Android.
3. Without a key the chat shows "not set up yet" and points to the offline tools.

## Deploying

`app.json` uses `web.output: "server"`, which is required for API routes. `npx expo export --platform web` produces `dist/server/_expo/functions/api/chat+api.js` (the Anthropic SDK is only in the server bundle; it is absent from the web client and the Android bundle).

- Host with EAS Hosting (`npx eas-cli@latest deploy`) and set `ANTHROPIC_API_KEY` as a secret there, or use an `expo-server` adapter for another Node host.
- Store builds must know where the API lives: set the expo-router plugin `origin` in `app.json` to your deployed URL (`["expo-router", { "origin": "https://your-app.expo.app/" }]`) before `eas build`.

## Testing

- `src/server/chat-handler.test.ts`: streaming, minimal context, safety bypass (also without a key), not-configured, bad requests, rate limits, bounded history, provider failure, refusal, metrics without text.
- `src/domain/safety.test.ts`: crisis phrases in three languages, ordinary craving talk not flagged.
- `src/services/chat-client.test.ts`: NDJSON split across chunks, malformed lines, network failure, HTTP errors.
- **Not yet done:** live conversations with the real model (no API key was available). Before launch, run the scenarios in the product brief (craving, stress, relapse, education, unrelated, medical, emergency) in all three languages and have a clinician and native speakers review the replies.
