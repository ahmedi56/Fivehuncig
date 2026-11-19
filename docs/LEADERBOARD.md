# Shared leaderboard: design notes (not built)

> Update 2026-10-03: a peer-support community now exists (docs/COMMUNITY.md). Points stay personal; replying to support others earns a small, capped amount. A shared ranking is still not built, on purpose.

FivehunCig has no accounts, so today the "league" compares a member only with their own past weeks. A shared leaderboard needs a decision from the product owner, because it means adding accounts and storing data on a server.

If it is added:

- **Opt-in**, off by default, with a display name or anonymous handle and an avatar. Never real names unless the member chooses, never health data, smoking history or chat content.
- **Small groups, not global:** friends via invite code, or anonymous weekly leagues of ~20 members at a similar stage ("people around your progress"). Show your own rank and the few entries around it, never the full table.
- **Categories, not "who smoked least":** consistency (active days), craving skills (craving exercises), learning (lessons), milestones, weekly challenge.
- **Server is the source of truth:** the app uploads raw events (`craving_handled`, `surf_completed`, `lesson_read`, `challenge_joined`) with a client-generated id; the server dedupes by id, rejects future timestamps and implausible rates (e.g. more than N surfs per hour), checks eligibility, and recomputes points with the same rules as `src/domain/journey.ts`. A `POST /points {points: 999}` endpoint must never exist.
- **Weekly reset** by server time; ties broken by earliest completion.
- Update `docs/PRIVACY.md` and the onboarding promise before launch.
