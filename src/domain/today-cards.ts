/**
 * Today shows one card at a time, the most useful one first, so the screen fits without scrolling.
 * Order: a waiting "did you smoke?" check-in, a readiness suggestion, medicine (first two weeks),
 * the member's riskiest time of
 * day (with their plan), this week's challenge, one of their reasons, their plan (or making one),
 * then a one-minute article. A card hidden with "Done" stays hidden until tomorrow. Pure functions.
 */
export const TODAY_CARDS = ['followUp', 'nudge', 'medicine', 'risk', 'challenge', 'reason', 'plan', 'article'] as const;

/** The medicine card shows during the first two weeks: medicine plus support is the strongest help. */
export const MEDICINE_CARD_DAYS = 14;
export type TodayCard = (typeof TODAY_CARDS)[number];

/** Cards with their own answer buttons: they leave when answered, not with "Done". */
export const ANSWER_CARDS: readonly TodayCard[] = ['followUp', 'nudge'];

export interface TodayCardInput {
  followUp: boolean;
  nudge: boolean;
  medicine: boolean;
  risk: boolean;
  challenge: boolean;
  reason: boolean;
  /** One-minute articles; off while they wait for a health review. Defaults to on. */
  article?: boolean;
}

/** The cards that apply right now, most useful first. The plan card always applies; the article card unless switched off. */
export function todayCards(input: TodayCardInput, hidden: readonly TodayCard[] = []): TodayCard[] {
  const applies: Record<TodayCard, boolean> = { ...input, plan: true, article: input.article ?? true };
  return TODAY_CARDS.filter((card) => applies[card] && (ANSWER_CARDS.includes(card) || !hidden.includes(card)));
}

/** Which card to show after "Next card" was tapped `skips` times: it goes round, never past the end. */
export function cardAt(cards: readonly TodayCard[], skips: number): TodayCard | undefined {
  return cards.length ? cards[((skips % cards.length) + cards.length) % cards.length] : undefined;
}

/** Hidden cards are remembered for one local day only. */
export function hiddenToday(saved: { day?: string; cards?: unknown } | null | undefined, today: string): TodayCard[] {
  if (!saved || saved.day !== today || !Array.isArray(saved.cards)) return [];
  return saved.cards.filter((c): c is TodayCard => (TODAY_CARDS as readonly string[]).includes(c as string));
}
