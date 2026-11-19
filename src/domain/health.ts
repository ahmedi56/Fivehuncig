import { DAY, HOUR, MINUTE, WEEK } from './time';

export type MilestoneId = '20m' | '12h' | '2d' | '2w' | '1mo' | '1y' | '5y';

export interface Milestone {
  id: MilestoneId;
  after: number;
}

/**
 * Recovery after the last cigarette. Sources: WHO "Health benefits of smoking cessation",
 * American Lung Association "Benefits of Quitting". Timelines are population averages.
 * The wording for each milestone lives in the translations (`milestones` in src/i18n).
 */
export const MILESTONES: Milestone[] = [
  { id: '20m', after: 20 * MINUTE },
  { id: '12h', after: 12 * HOUR },
  { id: '2d', after: 2 * DAY },
  { id: '2w', after: 2 * WEEK },
  { id: '1mo', after: 30 * DAY },
  { id: '1y', after: 365 * DAY },
  { id: '5y', after: 5 * 365 * DAY },
];

export interface MilestoneProgress extends Milestone {
  /** 0..1 */
  progress: number;
  reached: boolean;
}

export function milestoneProgress(smokeFreeMs: number): MilestoneProgress[] {
  const elapsed = Math.max(0, smokeFreeMs);
  return MILESTONES.map((m) => ({
    ...m,
    progress: Math.min(1, elapsed / m.after),
    reached: elapsed >= m.after,
  }));
}

export function nextMilestone(smokeFreeMs: number): MilestoneProgress | undefined {
  return milestoneProgress(smokeFreeMs).find((m) => !m.reached);
}
