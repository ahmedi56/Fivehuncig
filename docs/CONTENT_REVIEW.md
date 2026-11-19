# Content review

**Status: nothing has been clinically or natively reviewed yet.** Do not describe the content as reviewed until the steps below have happened and `REVIEW` in `src/i18n/articles.ts` is updated.

## What needs review

| Content | Where | Clinical | French | Arabic |
|---|---|---|---|---|
| 19 Learn articles | `src/i18n/{en,fr,ar}.ts` → `learn.articles` | pending | pending | pending |
| Health timeline (7 milestones) | `milestones` in each language file | pending | pending | pending |
| Help and safety wording | `help`, `safety` | pending | pending | pending |
| AI system prompt | `src/server/prompt.ts` | pending | n/a | n/a |
| Crisis keyword lists | `src/domain/safety.ts` | pending | pending | pending |
| Support lines | `src/resources/support.ts` | verified against official sources on 2026-10-02 (FR, US, GB only) | | |

The English was written from public WHO, CDC, NHS, NCI and FDA guidance. French and Arabic were translated in-house (not machine-verified, not native-reviewed). Arabic is Modern Standard Arabic and addresses the reader in the masculine by default; a reviewer should decide on gender-inclusive wording.

## How to review

1. **Clinical reviewer** (doctor, pharmacist or tobacco specialist): check every claim against current guidance in your target countries; flag anything that overstates certainty. Product articles must keep the "what we know / what is still uncertain" split.
2. **Native French and Arabic reviewers**: natural wording, correct terms (e.g. "substituts nicotiniques", "بدائل النيكوتين"), regional fit (Maghreb vs Gulf Arabic readers).
3. Record the result: set the article's `clinical`, `fr` or `ar` to `'reviewed'` in `REVIEW` and note reviewer + date in the pull request.

## Videos

Planned urge-surfing topics (`URGE_SURF_SLOTS` in `src/content/videos.ts`, no content yet): what urge surfing is; riding a craving like a wave; breathing during a craving; noticing a craving without acting on it; what happens when a craving peaks. Each needs a real, reviewed, captioned recording before it is added.

`src/content/videos.ts` is empty on purpose. A video is offered only when it is published, clinically reviewed, carries a subtitle track in that language inside its HLS stream, and (for French/Arabic) the captions and text are language-reviewed. `videosFor()` enforces this and is tested. Never add placeholder or AI-generated "health videos".

The player is ready (`src/components/video-card.tsx`, expo-video): thumbnail first, the stream loads only on tap, captions switch on in the member's language, and a failed load shows "the exercise works without it" with a retry. The urge-surfing intro lists videos for its slots; nothing is shown while the list is empty. Verified in the browser with a temporary unreachable test entry (removed afterwards); real playback still needs testing on a phone with a real HLS stream.

## Support lines

Add or change a number only after checking it on the official source itself. Record `source` and `verifiedAt`; re-check yearly. Countries still missing (no official source reachable on 2026-10-02): Tunisia, Morocco, Algeria, Saudi Arabia and other Arabic-speaking countries; United States emergency number (911 official sites blocked automated checks). These members see the WHO link and "call your local emergency number".
