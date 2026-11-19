import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CravingTool, Helped } from '@/domain/types';

/** Result of an urge-surfing exercise started from the chat, handed back to the chat once. */
export interface SurfResult {
  before?: number;
  after: number;
  helped: Helped;
}

/** A delay that ended longer ago than this belongs to an earlier craving and isn't restored. */
const STALE_MS = 30 * 60_000;

/**
 * State for the current craving. Only the running delay is saved, so closing the app mid-craving
 * (or the system killing it) doesn't throw the countdown away.
 */
interface SosSession {
  delayEndsAt?: number;
  tool?: CravingTool;
  surfResult?: SurfResult;
  /**
   * "How strong is the craving?" for the current craving: asked once on the SOS screen, never inside
   * a tool. Each tool's end rating replaces it, so a second tool starts from where the first left off.
   */
  cravingLevel?: number;
  setCravingLevel: (level?: number) => void;
  startDelay: (minutes?: number) => void;
  pickTool: (tool: CravingTool) => void;
  end: () => void;
  setSurfResult: (result: SurfResult) => void;
  /** Returns the pending result and clears it, so it is reported only once. */
  takeSurfResult: () => SurfResult | undefined;
}

export const useSosSession = create<SosSession>()(
  persist(
    (set, get) => ({
      startDelay: (minutes = 5) => set({ delayEndsAt: Date.now() + minutes * 60_000, tool: 'delay' }),
      pickTool: (tool) => set({ tool }),
      setCravingLevel: (cravingLevel) => set({ cravingLevel }),
      end: () => set({ delayEndsAt: undefined, tool: undefined, cravingLevel: undefined }),
      setSurfResult: (surfResult) => set({ surfResult }),
      takeSurfResult: () => {
        const result = get().surfResult;
        if (result) set({ surfResult: undefined });
        return result;
      },
    }),
    {
      name: 'fivehuncig-sos',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ delayEndsAt: s.delayEndsAt, tool: s.tool }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<SosSession> | undefined;
        if (!saved?.delayEndsAt || saved.delayEndsAt < Date.now() - STALE_MS) return current;
        return { ...current, delayEndsAt: saved.delayEndsAt, tool: saved.tool };
      },
    },
  ),
);
