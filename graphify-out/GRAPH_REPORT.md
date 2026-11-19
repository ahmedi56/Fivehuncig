# Graph Report - fivehuncig  (2026-10-29)

## Corpus Check
- 164 files · ~337,838 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1142 nodes · 3791 edges · 66 communities (39 shown, 27 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Core UI, Translations and Store
- Theme, Craving Scale and Article Screen
- Chat Server and Rate Limits
- Languages and Learn Articles
- Product Docs and Policies
- Block Drop Game
- Community Service and Dev Data
- Time, Schedule and Health Timeline (7)
- Saved Data Store and Types
- App Config (app.json)
- Pattern Pop and Sounds
- Local Community Test Server
- Weekly Challenges and Journey
- Breathing and Wave Visuals
- Activity Timings and Imagery
- Root Layout and Notifications (15)
- Online Dependencies (16)
- Stats and Memories
- Test Tooling (Jest) (18)
- Brand Asset Script
- Mahla Guide, Squeeze and Urge Surf (20)
- CI Workflow
- Test Tooling (Jest) (22)
- Root Layout and Notifications (23)
- Root Layout and Notifications (24)
- Quit-Treatment Evidence
- Time, Schedule and Health Timeline (26)
- Root Layout and Notifications (27)
- npm Scripts
- Root Layout and Notifications (29)
- Time, Schedule and Health Timeline (30)
- TypeScript Config
- Mahla Guide, Squeeze and Urge Surf (32)
- Root Layout and Notifications (33)
- SOS Screen and Craving Check
- Memory Match Game
- Ethics and Compliance Notes
- Reward Pot Idea
- Local Help and Ramadan Ideas
- Jest Config
- Platform and RTL Decision
- Text-Message Support Idea
- If-Then Plans Evidence
- Anthropic SDK
- Online Dependencies (45)
- expo-device
- Online Dependencies (47)
- Image Picker Package
- Linking Package
- Online Dependencies (50)
- Notifications Package
- Online Dependencies (52)
- Online Dependencies (53)
- Online Dependencies (54)
- Expo UI Package
- Web Browser Package
- hCaptcha Web Package
- hCaptcha Native
- react-dom
- Online Dependencies (60)
- Online Dependencies (61)

## God Nodes (most connected - your core abstractions)
1. `useT()` - 112 edges
2. `Text()` - 109 edges
3. `usePalette()` - 78 edges
4. `Button()` - 70 edges
5. `Screen()` - 64 edges
6. `useAppStore` - 64 edges
7. `react-native` - 58 edges
8. `Panel()` - 49 edges
9. `useLang()` - 48 edges
10. `react` - 44 edges

## Surprising Connections (you probably didn't know these)
- `migrateState()` --implements--> `zustand + persist to AsyncStorage (single JSON document)`  [INFERRED]
  src/store/app-store.ts → docs/ARCHITECTURE.md
- `migrateState()` --references--> `CravingRating (schema v2)`  [EXTRACTED]
  src/store/app-store.ts → docs/ARCHITECTURE.md
- `Server Output and EAS Hosting Deployment` --conceptually_related_to--> `EAS Build, Submit and Update`  [INFERRED]
  docs/AI_CHAT.md → AGENTS.md
- `Chat Request Flow` --conceptually_related_to--> `Craving SOS`  [INFERRED]
  docs/AI_CHAT.md → README.md
- `On-device Data Storage` --implements--> `Offline-first, No Account`  [INFERRED]
  docs/PRIVACY.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Craving-to-help Path** — readme_craving_sos, readme_urge_surfing, docs_community_peer_support_community, docs_ai_chat_ai_support_chat [EXTRACTED 1.00]
- **Mahla voiced cues for Walk, Squeeze and Breathe** — docs_voice_script_mahla, docs_voice_script_walk_cues, docs_voice_script_squeeze_cues, docs_voice_script_breathe_cues, docs_architecture_expo_audio_sound [INFERRED 0.75]
- **Layered Crisis Safety (keyword detection, system prompt, verified support lines, community concern reports)** — docs_ai_chat_crisis_safety_detection, docs_ai_chat_system_prompt, docs_content_review_support_lines_verification, docs_community_self_harm_concern_report [INFERRED 0.85]
- **Craving-evidence to SOS tool implementation pipeline** — docs_research_quit_evidence_acute_exercise, docs_research_quit_evidence_elaborated_intrusion_theory, docs_architecture_sos_activities, src_domain_activities, src_domain_blocks, src_domain_pattern [INFERRED 0.85]
- **Opt-in Exceptions to Offline-first Privacy** — readme_offline_first, docs_ai_chat_ai_support_chat, docs_community_peer_support_community, docs_privacy_privacy_policy, docs_privacy_delete_all_data [INFERRED 0.85]
- **Personal craving rating and follow-up loop** — docs_research_quit_evidence_cross_cutting_measurement, docs_architecture_craving_rating, src_domain_ratings, src_services_actions, docs_architecture_local_notifications [INFERRED 0.85]

## Communities (66 total, 27 thin omitted)

### Community 0 - "Core UI, Translations and Store"
Cohesion: 0.05
Nodes (134): AI chat via Expo Router API route (chat+api.ts) calling Claude, Expo Router with native tabs and Stack.Protected, Community on Supabase (private schema, security-definer functions), expo-router, buildContext(), Chat(), ChatScreen(), Consent() (+126 more)

### Community 1 - "Theme, Craving Scale and Article Screen"
Cohesion: 0.07
Nodes (49): react-native, Help(), ACTIONABLE, styles, More(), Support(), SupportScreen(), Learn() (+41 more)

### Community 2 - "Chat Server and Rate Limits"
Cohesion: 0.05
Nodes (46): limiter, POST(), provider, boundHistory(), CHAT_LIMITS, ChatErrorCode, ChatEvent, ChatLang (+38 more)

### Community 3 - "Languages and Learn Articles"
Cohesion: 0.06
Nodes (50): base, URGE_SURF_SLOTS, UrgeSurfSlot, urgeSurfVideos(), VideoEntry, VIDEOS, videosFor(), ar (+42 more)

### Community 4 - "Product Docs and Policies"
Cohesion: 0.06
Nodes (46): Continuous Native Generation, Development Build Requirement, EAS Build, Submit and Update, Expo Project Agent Guidelines, AI Support Chat, ANTHROPIC_API_KEY Setup, Chat Request Flow, x-install-id Header (+38 more)

### Community 5 - "Block Drop Game"
Cohesion: 0.07
Nodes (49): expo-audio local synthesized sounds, Typed i18n dictionaries EN/FR/AR (src/i18n), Learn library (src/i18n/articles.ts), SOS activities ordered by acute-craving evidence, Testing strategy, Brisk walking / acute exercise for cravings, Block Drop (3-minute block puzzle), Learn content plan (12 cards EN/FR/AR) (+41 more)

### Community 6 - "Community Service and Dev Data"
Cohesion: 0.07
Nodes (40): CaptchaResult, useCaptcha(), CaptchaResult, useCaptcha(), ago(), base, communityFixture(), LONG_POST (+32 more)

### Community 7 - "Time, Schedule and Health Timeline (7)"
Cohesion: 0.11
Nodes (33): STEPS, styles, suggestArticle(), NOW, Milestone, MilestoneId, milestoneProgress, MILESTONES (+25 more)

### Community 8 - "Saved Data Store and Types"
Cohesion: 0.15
Nodes (33): zustand, Slip(), MedsNudge(), heavyFixture(), TodayData, todayFixture(), ChatContext, activeDays() (+25 more)

### Community 9 - "App Config (app.json)"
Cohesion: 0.06
Nodes (30): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, blockedPermissions, package, predictiveBackGestureEnabled (+22 more)

### Community 10 - "Pattern Pop and Sounds"
Cohesion: 0.12
Nodes (24): PatternPop(), Phase, styles, BUBBLES, MAX_LENGTH, MIN_LENGTH, newSequence(), nextLength() (+16 more)

### Community 11 - "Local Community Test Server"
Cohesion: 0.09
Nodes (15): @electric-sql/pglite@^0.5.8, @electric-sql/pglite, b64url(), CORS, db, fns, migration, PORT (+7 more)

### Community 12 - "Weekly Challenges and Journey"
Cohesion: 0.12
Nodes (23): styles, profile(), CHALLENGES, eventsBetween(), inRange(), LEVELS, personalBests, personalRank() (+15 more)

### Community 13 - "Breathing and Wave Visuals"
Cohesion: 0.12
Nodes (20): react, BREATH_MS, PHASES, styles, Memories(), styles, Step, STEPS (+12 more)

### Community 14 - "Activity Timings and Imagery"
Cohesion: 0.13
Nodes (19): Journey (points, challenges, memories, Your best), Delay Ladder, styles, CYCLE, IMAGERY_MS, IMAGERY_PROMPTS, IMAGERY_SCENES, IMAGERY_STEP_MS (+11 more)

### Community 15 - "Root Layout and Notifications (15)"
Cohesion: 0.14
Nodes (18): SosTool, styles, TOOLS, Illustration(), bestTool(), cravingScore(), dueFollowUps(), FOLLOW_UP_DELAY (+10 more)

### Community 16 - "Online Dependencies (16)"
Cohesion: 0.09
Nodes (22): dependencies, expo@~57.0.31, expo-audio@~57.0.5, expo-file-system@~57.0.7, expo-glass-effect@~57.0.4, expo-haptics@~57.0.3, expo-router@~57.0.29, expo-symbols@~57.0.3 (+14 more)

### Community 17 - "Stats and Memories"
Cohesion: 0.26
Nodes (19): completedChallenges(), idTime(), computeMemories(), firstPackSaved(), firstSmokeFreeDay(), firstStreakOf(), longestGap(), MemoryId (+11 more)

### Community 18 - "Test Tooling (Jest) (18)"
Cohesion: 0.11
Nodes (19): { defineConfig }, expoConfig, devDependencies, eslint@^9.0.0, eslint-config-expo@~57.0.2, jest@^29.7.0, jest-expo@~57.0.6, @react-native/jest-preset@^0.86.3 (+11 more)

### Community 19 - "Brand Asset Script"
Cohesion: 0.16
Nodes (8): art_layer(), background(), leaf(), lum(), main(), monochrome_mark(), square_art(), without_tagline()

### Community 20 - "Mahla Guide, Squeeze and Urge Surf (20)"
Cohesion: 0.29
Nodes (17): expo-haptics, Imagery(), Move(), styles, Figure(), Squeeze(), styles, Memory() (+9 more)

### Community 21 - "CI Workflow"
Cohesion: 0.12
Nodes (16): runs-on, steps, timeout-minutes, jobs, check, name, on, pull_request (+8 more)

### Community 22 - "Test Tooling (Jest) (22)"
Cohesion: 0.12
Nodes (16): expo-image@~57.0.5, expo-video@~57.0.5, react-native-reanimated@4.5.1, react-native-screens@~4.26.0, react-native-web@~0.21.0, react-native-worklets@0.10.1, main, name (+8 more)

### Community 23 - "Root Layout and Notifications (23)"
Cohesion: 0.17
Nodes (11): cancelAll(), ensurePermission(), load(), NotificationsModule, notificationsSupported, NotificationText, scheduleFollowUp(), schedulePlanReminder() (+3 more)

### Community 24 - "Root Layout and Notifications (24)"
Cohesion: 0.28
Nodes (14): Breathe(), Sos(), answerFollowUp(), changeMode(), clearTimer(), finishCraving(), recordRating(), recordSmoke() (+6 more)

### Community 25 - "Quit-Treatment Evidence"
Cohesion: 0.16
Nodes (13): Architecture and decisions, Evidence-Based Upgrade Plan (Research Quit Evidence), ACT / Motivational interviewing / CBT relapse prevention content, Bupropion / single NRT (second-line), Cochrane component NMA 2023 (Lindson et al.), Combination NRT, Cytisine / cytisinicline, Gradual reduction (cut down to quit) (+5 more)

### Community 26 - "Time, Schedule and Health Timeline (26)"
Cohesion: 0.24
Nodes (10): Status(), Today(), ANSWER_CARDS, cardAt(), hiddenToday(), none, TODAY_CARDS, TodayCard (+2 more)

### Community 27 - "Root Layout and Notifications (27)"
Cohesion: 0.18
Nodes (8): CravingRating (schema v2), Data model (src/domain/types.ts), expo-notifications, local only (fail soft), zustand + persist to AsyncStorage (single JSON document), Voice recording script (Mahla), Guide lines (before/start/half/end/after/best/reason), Mahla (app guide persona), migrateState()

### Community 28 - "npm Scripts"
Cohesion: 0.20
Nodes (10): scripts, android, check, ios, lint, start, test, test:db (+2 more)

### Community 29 - "Root Layout and Notifications (29)"
Cohesion: 0.36
Nodes (8): RootLayout(), unstable_settings, ScreenFocus(), Loading(), isRTL(), configureNotifications(), onNotificationOpen(), useHydrated()

### Community 30 - "Time, Schedule and Health Timeline (30)"
Cohesion: 0.29
Nodes (6): cravingTimeInsight, DAY_PARTS, DayPart, dayPartOf(), MIN_EVENTS_FOR_INSIGHT, NOW

### Community 31 - "TypeScript Config"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, compilerOptions, paths, strict, types, extends, include, @/assets/*

### Community 32 - "Mahla Guide, Squeeze and Urge Surf (32)"
Cohesion: 0.31
Nodes (5): react-native-svg, Buddy(), styles, guideLine, RatedTool

### Community 33 - "Root Layout and Notifications (33)"
Cohesion: 0.36
Nodes (6): fitsDailyLimit(), isReminderKey(), MAX_PER_DAY, nearestReminder(), pruneScheduled(), REMINDER_TIMES

### Community 34 - "SOS Screen and Craving Check"
Cohesion: 0.38
Nodes (4): @react-native-async-storage/async-storage, Helped, SosSession, SurfResult

### Community 35 - "Memory Match Game"
Cohesion: 0.33
Nodes (6): FACES, newDeck(), shuffle(), styles, MEMORY_MS, memoryPairs()

### Community 37 - "Reward Pot Idea"
Cohesion: 0.67
Nodes (3): Roadmap (v1.1 widget, v2 backend, v3 AI coach, Promise Pot), Financial incentives / contingency management, Self-funded reward pot

### Community 38 - "Local Help and Ramadan Ideas"
Cohesion: 0.67
Nodes (3): Verified support lines (src/resources/support.ts), Localised help directory (Tunisia, MENA, global), Ramadan mode

### Community 39 - "Jest Config"
Cohesion: 0.67
Nodes (3): jest, preset, testMatch

## Knowledge Gaps
- **39 isolated node(s):** `expo/tsconfig.base`, `Expo Router with native tabs and Stack.Protected`, `Community on Supabase (private schema, security-definer functions)`, `Data model (src/domain/types.ts)`, `Voice recording script (Mahla)` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 322 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-native` connect `Theme, Craving Scale and Article Screen` to `Core UI, Translations and Store`, `Mahla Guide, Squeeze and Urge Surf (32)`, `Memory Match Game`, `Languages and Learn Articles`, `Block Drop Game`, `Community Service and Dev Data`, `Time, Schedule and Health Timeline (7)`, `Saved Data Store and Types`, `Pattern Pop and Sounds`, `Weekly Challenges and Journey`, `Breathing and Wave Visuals`, `Activity Timings and Imagery`, `Root Layout and Notifications (15)`, `Online Dependencies (16)`, `Mahla Guide, Squeeze and Urge Surf (20)`, `Test Tooling (Jest) (22)`, `Root Layout and Notifications (23)`, `Root Layout and Notifications (29)`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `Expo Router with native tabs and Stack.Protected`, `Community on Supabase (private schema, security-definer functions)` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core UI, Translations and Store` be split into smaller, more focused modules?**
  _Cohesion score 0.053043110735418425 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Breathing and Wave Visuals` to `Core UI, Translations and Store`, `Mahla Guide, Squeeze and Urge Surf (32)`, `Theme, Craving Scale and Article Screen`, `Memory Match Game`, `Block Drop Game`, `Community Service and Dev Data`, `Time, Schedule and Health Timeline (7)`, `Saved Data Store and Types`, `Pattern Pop and Sounds`, `Weekly Challenges and Journey`, `Activity Timings and Imagery`, `Root Layout and Notifications (15)`, `Online Dependencies (16)`, `Mahla Guide, Squeeze and Urge Surf (20)`, `Test Tooling (Jest) (22)`, `Root Layout and Notifications (29)`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Theme, Craving Scale and Article Screen` be split into smaller, more focused modules?**
  _Cohesion score 0.06749482401656315 - nodes in this community are weakly interconnected._
- **Why does `useT()` connect `Core UI, Translations and Store` to `Mahla Guide, Squeeze and Urge Surf (32)`, `Theme, Craving Scale and Article Screen`, `Memory Match Game`, `Languages and Learn Articles`, `Block Drop Game`, `Time, Schedule and Health Timeline (7)`, `Saved Data Store and Types`, `Pattern Pop and Sounds`, `Weekly Challenges and Journey`, `Breathing and Wave Visuals`, `Activity Timings and Imagery`, `Root Layout and Notifications (15)`, `Mahla Guide, Squeeze and Urge Surf (20)`, `Root Layout and Notifications (29)`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `Chat Server and Rate Limits` be split into smaller, more focused modules?**
  _Cohesion score 0.05201266395296246 - nodes in this community are weakly interconnected._