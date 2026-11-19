import { useShallow } from 'zustand/react/shallow';

import type { JourneyData } from '@/domain/journey';
import { useAppStore } from '@/store/app-store';

/** The member's journey events in one object. Re-renders only when one of the lists changes. */
export function useJourney(): JourneyData | undefined {
  return useAppStore(
    useShallow((s) =>
      s.profile
        ? {
            startedAt: s.profile.startedAt,
            smokes: s.smokes,
            cravings: s.cravings,
            surfs: s.surfs,
            lessons: s.lessons,
            plans: s.plans,
            challenges: s.challenges,
            supports: s.supports,
          }
        : undefined,
    ),
  );
}
