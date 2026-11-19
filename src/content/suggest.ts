import { DAY } from '@/domain/time';
import type { Profile, SmokeEvent } from '@/domain/types';
import type { ArticleId } from '@/i18n/articles';

/** One article that fits where the member is right now, shown on Today. */
export function suggestArticle(profile: Profile, smokes: SmokeEvent[], now: number): ArticleId {
  const last = smokes.reduce<number | undefined>((max, s) => (max === undefined || s.at > max ? s.at : max), undefined);
  if (profile.mode === 'quit') {
    const quitAt = profile.quitAt ?? profile.startedAt;
    if (last !== undefined && last > quitAt && now - last < DAY) return 'slips';
    if (now - quitAt < 14 * DAY) return 'withdrawal';
    return 'when-you-stop';
  }
  if (profile.mode === 'cutdown') return now - (profile.cutdownStartedAt ?? profile.startedAt) < 7 * DAY ? 'cut-down' : 'routines';
  return 'nicotine-brain';
}
