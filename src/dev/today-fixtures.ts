/**
 * DEV ONLY (break-ui). On-device data for the worst-case toggle, shaped like the saved store.
 * Limits from src/domain/validate.ts and the forms: price per pack up to 1,000,000; cigarettes
 * per day 1–100; currency up to 4 characters; reason 100 chars; plan trigger and action 80 each.
 */
import { weekKey } from '@/domain/journey';
import { TRIGGERS, type ChallengeEntry, type CravingEvent, type LessonRead, type Plan, type Profile, type Reason, type SmokeEvent, type SupportGiven, type UrgeSurfSession } from '@/domain/types';
import { ARTICLE_IDS } from '@/i18n/articles';

import type { DataMode } from './data-mode';

const DAY = 86_400_000;
const HOUR = 3_600_000;

type TodayData = {
  profile: Profile;
  cravings: CravingEvent[];
  plans: Plan[];
  reasons: Reason[];
  smokes: SmokeEvent[];
  surfs?: UrgeSurfSession[];
  lessons?: LessonRead[];
  challenges?: ChallengeEntry[];
  supports?: SupportGiven[];
};

export function todayFixture(mode: DataMode, now = Date.now()): TodayData | undefined {
  if (mode === 'demo') return undefined;
  if (mode === 'heavy') return heavyFixture(now);

  if (mode === 'worst') {
    // Smoke-free for 1,284 days and 23 hours: a long-term member, three and a half years in.
    const quitAt = now - 1284 * DAY - 23 * HOUR;
    return {
      // Lebanese pounds: a real currency where a pack costs six figures.
      profile: { cigsPerDay: 40, pricePerPack: 150_000, cigsPerPack: 20, currency: 'LBP', wakeHours: 16, mode: 'quit', startedAt: quitAt, quitAt, weeklyStep: 0.1 },
      smokes: [],
      // 1,284 cravings beaten, all in the evening (feeds the "your hardest time" insight).
      cravings: Array.from({ length: 1284 }, (_, i) => {
        const day = new Date(now - (i + 1) * DAY);
        day.setHours(21, 0, 0, 0);
        return { id: `w${i}`, at: day.getTime(), beaten: true, tool: 'urge-surf' };
      }),
      plans: [
        {
          id: 'w-plan',
          // 80 + 80 characters: the form limits.
          trigger: 'I finish a long night shift and the whole crew heads out to the loading dock'.slice(0, 80),
          action: 'text my sister Aleksandra and walk one full lap of the warehouse with cold water'.slice(0, 80),
        },
      ],
      // 97 characters, near the 100-character form limit.
      reasons: [{ id: 'w-reason', text: "So my daughter Zofia doesn't grow up remembering me out in the rain with a cigarette after dinner" }],
    };
  }

  if (mode === 'one') {
    // Every count at exactly 1.
    const quitAt = now - DAY - HOUR;
    return {
      profile: { cigsPerDay: 1, pricePerPack: 1, cigsPerPack: 1, currency: '€', wakeHours: 16, mode: 'quit', startedAt: quitAt, quitAt, weeklyStep: 0.1 },
      smokes: [],
      cravings: [{ id: 'o1', at: now - 2 * HOUR, beaten: true, tool: 'breathe' }],
      plans: [{ id: 'o-plan', trigger: 'I wake up', action: 'drink water' }],
      reasons: [{ id: 'o-reason', text: 'Zofia' }],
    };
  }

  // Empty: a brand-new member, nothing logged yet.
  return {
    profile: { cigsPerDay: 15, pricePerPack: 9, cigsPerPack: 20, currency: '€', wakeHours: 16, mode: 'cutdown', startedAt: now, cutdownStartedAt: now, weeklyStep: 0.1 },
    smokes: [],
    cravings: [],
    plans: [],
    reasons: [],
  };
}

/**
 * A 100-a-day smoker (the form's maximum), cutting down for 400 days and using every feature
 * daily. The quit-mode worst case above leaves the 14-day chart and triggers empty; this fills them.
 */
function heavyFixture(now: number): TodayData {
  const startedAt = now - 400 * DAY;
  const at = (daysAgo: number, hour: number, minute = 0) => {
    const d = new Date(now - daysAgo * DAY);
    d.setHours(hour, minute, 0, 0);
    return Math.min(d.getTime(), now - 60_000);
  };
  // Cigarettes per day, today last: a heavy fortnight with a few smoke-free days and a slip today.
  const last14 = [100, 98, 100, 87, 0, 64, 100, 55, 0, 41, 39, 1, 0, 2];
  const perDay = (daysAgo: number) => (daysAgo < 14 ? last14[13 - daysAgo] : daysAgo < 30 ? 100 : 0);
  const smokes: SmokeEvent[] = [];
  for (let d = 29; d >= 0; d--) {
    for (let i = 0; i < perDay(d); i++) {
      // Every trigger appears; stress dominates.
      const trigger = i % 3 === 0 ? TRIGGERS[i % TRIGGERS.length] : 'stress';
      smokes.push({ id: `h-s${d}-${i}`, at: at(d, 6 + Math.floor((i * 16) / 100), (i * 7) % 60), trigger });
    }
  }
  // 12 cravings handled a day for 400 days: 4,800, under the store's 5,000 cap.
  const tools = ['delay', 'breathe', 'water', 'game', 'urge-surf', 'plan', 'chat'] as const;
  const cravings: CravingEvent[] = [];
  for (let d = 399; d >= 0; d--) {
    for (let i = 0; i < 12; i++) {
      cravings.push({ id: `h-c${d}-${i}`, at: at(d, 8 + i, 30), beaten: true, tool: tools[i % tools.length], trigger: TRIGGERS[i % TRIGGERS.length] });
    }
  }
  const surfs: UrgeSurfSession[] = Array.from({ length: 400 }, (_, d) => ({
    id: `h-u${d}`,
    at: at(d, 20),
    startedAt: at(d, 20) - 5 * 60_000,
    before: 9,
    after: 3,
    trend: 'weaker',
    helped: 'yes',
  }));
  // Past weeks: easy, medium and hard challenges completed in turn, so every level is open.
  const ids = ['surf-1', 'surf-strong', 'surf-helped-3'];
  const challenges: ChallengeEntry[] = Array.from({ length: 56 }, (_, w) => ({
    week: weekKey(now - (w + 1) * 7 * DAY),
    challengeId: ids[w % ids.length],
    joinedAt: now - (w + 1) * 7 * DAY,
  })).reverse();
  return {
    profile: { cigsPerDay: 100, pricePerPack: 12.5, cigsPerPack: 20, currency: 'CHF', wakeHours: 18, mode: 'cutdown', startedAt, cutdownStartedAt: startedAt, weeklyStep: 0.1 },
    smokes,
    cravings,
    // The store's limits: 20 plans and 30 reasons. Mixed scripts, as a bilingual member writes them.
    plans: Array.from({ length: 20 }, (_, i) => ({
      id: `h-plan${i}`,
      trigger: i % 2 ? 'أشرب القهوة بعد الغداء' : 'I finish a long shift and everyone heads out to smoke',
      action: i % 2 ? 'call my sister Aleksandra' : "I'll walk one full lap of the warehouse with cold water",
      ...(i === 0 ? { hour: 7, minute: 30 } : {}),
    })),
    reasons: Array.from({ length: 30 }, (_, i) => ({
      id: `h-reason${i}`,
      text: i % 3 === 0 ? 'Breathe on the stairs again' : i % 3 === 1 ? 'حتى تكبر ابنتي زوفيا وأنا بصحة جيدة وأستطيع أن ألعب معها في الحديقة كل يوم' : 'Pour Zofia',
    })),
    surfs,
    lessons: ARTICLE_IDS.map((id, i) => ({ id, at: startedAt + (i + 1) * DAY })),
    challenges,
    // Three supportive replies a day: the daily cap for points.
    supports: Array.from({ length: 1200 }, (_, i) => ({ id: `h-p${i}`, at: at(Math.floor(i / 3), 13, i % 3) })),
  };
}
