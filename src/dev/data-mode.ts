import { Platform } from 'react-native';

/**
 * DEV ONLY (break-ui). Which dataset the app runs on: the real one, or a worst-case fixture.
 * Set with `?data=worst|heavy|empty|one|demo` in the web address; remembered for the browser tab.
 * Always 'demo' (real data) in production builds and on iOS/Android.
 */
export type DataMode = 'demo' | 'worst' | 'heavy' | 'empty' | 'one';
export const DATA_MODES: DataMode[] = ['demo', 'worst', 'heavy', 'empty', 'one'];

const KEY = 'fivehuncig-dev-data';
let cached: DataMode | undefined;

export function devDataMode(): DataMode {
  if (!__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined') return 'demo';
  if (cached) return cached;
  let mode: string | null = null;
  try {
    mode = new URLSearchParams(window.location.search).get('data');
    if (mode) window.sessionStorage.setItem(KEY, mode);
    else mode = window.sessionStorage.getItem(KEY);
  } catch {
    // Storage blocked: fall back to the address only.
  }
  cached = DATA_MODES.includes(mode as DataMode) ? (mode as DataMode) : 'demo';
  return cached;
}

/** Switch dataset: a full reload, so every screen and the store start from the new data. */
export function setDevDataMode(mode: DataMode) {
  try {
    window.sessionStorage.setItem(KEY, mode);
  } catch {
    // ignore
  }
  const url = new URL(window.location.href);
  url.searchParams.set('data', mode);
  window.location.replace(url.toString());
}
