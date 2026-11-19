import type { ArticleCategory, ArticleId, ReviewState } from '@/i18n/articles';
import type { Lang } from '@/i18n/plural';

/**
 * Videos. EMPTY ON PURPOSE: no real, reviewed video content exists yet, and the app must never
 * show placeholder or AI-generated "health videos". Screens show a video only when this list
 * has a published, reviewed, captioned entry in the member's language; otherwise they show
 * nothing and every exercise still works fully without video.
 *
 * To add a video (see docs/CONTENT_REVIEW.md):
 * 1. Encode as HLS (.m3u8) with a few quality levels so the player adapts to the connection.
 *    Package captions as WebVTT subtitle renditions inside the HLS stream, one per language
 *    (expo-video selects subtitle tracks from the stream; it does not load separate caption files).
 * 2. Make a small JPEG/WebP thumbnail (shown first; the video loads only when the member taps play).
 * 3. Get clinical review, plus native-speaker review for French/Arabic captions and text.
 * 4. Add the entry with `published: true`.
 */

/** Planned short videos for the urge-surfing exercise. A slot is a topic, not content. */
export const URGE_SURF_SLOTS = ['what-is-urge-surfing', 'ride-the-wave', 'breathing', 'notice-without-acting', 'craving-peak'] as const;
export type UrgeSurfSlot = (typeof URGE_SURF_SLOTS)[number];

export interface VideoEntry {
  id: string;
  category: ArticleCategory;
  /** Article this video belongs with, if any. */
  article?: ArticleId;
  /** Urge-surfing topic this video fills, if any. */
  slot?: UrgeSurfSlot;
  durationSec: number;
  /** HLS (.m3u8) stream with quality levels and subtitle renditions. */
  streamUrl: string;
  thumbnailUrl: string;
  /**
   * Per-language text. `captions: true` means the stream carries a reviewed subtitle track in
   * that language; `summary` is a plain-text version of what is said, shown under the player so
   * the content works without sound or video.
   */
  locales: Partial<Record<Lang, { title: string; summary: string; captions: boolean }>>;
  /** Who produced it and the evidence it is based on. */
  source: string;
  review: { clinical: ReviewState } & Partial<Record<Lang, ReviewState>>;
  published: boolean;
}

export const VIDEOS: VideoEntry[] = [];

/** Videos a member can watch in `lang`: published, clinically reviewed, captioned and language-reviewed. */
export function videosFor(lang: Lang, list: VideoEntry[] = VIDEOS): VideoEntry[] {
  return list.filter(
    (v) => v.published && v.review.clinical === 'reviewed' && v.locales[lang]?.captions === true && (lang === 'en' || v.review[lang] === 'reviewed'),
  );
}

/** Urge-surfing videos for `lang`, in slot order. */
export function urgeSurfVideos(lang: Lang, list: VideoEntry[] = VIDEOS): VideoEntry[] {
  return videosFor(lang, list)
    .filter((v) => v.slot)
    .sort((a, b) => URGE_SURF_SLOTS.indexOf(a.slot!) - URGE_SURF_SLOTS.indexOf(b.slot!));
}
