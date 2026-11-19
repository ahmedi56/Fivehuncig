import { TRIGGERS, type Mode, type TriggerId } from './types';

/**
 * Wire format between the app and `POST /api/chat`. Shared by both sides, so it must stay
 * free of secrets and server-only imports.
 */

export type ChatLang = 'en' | 'fr' | 'ar';

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

/**
 * The only member data the AI ever sees: coarse numbers chosen for relevance, no free text
 * (reasons, plans, photos) and nothing that identifies the person.
 */
export interface ChatContext {
  mode: Mode;
  /** Whole hours since the last cigarette (or since starting), capped at 90 days. */
  smokeFreeHours: number;
  cigsPerDay: number;
  /** Up to 3 most common triggers in the last 30 days. */
  topTriggers: TriggerId[];
  cravingsBeaten: number;
}

export interface ChatRequest {
  lang: ChatLang;
  messages: ChatTurn[];
  context?: ChatContext;
}

/** One line of the newline-delimited JSON stream the server sends back. */
export type ChatEvent =
  | { t: 'delta'; text: string }
  | { t: 'safety'; kind: 'self-harm' | 'medical-emergency' }
  | { t: 'error'; code: ChatErrorCode }
  | { t: 'done' };

export type ChatErrorCode = 'bad_request' | 'not_configured' | 'rate_limited' | 'provider' | 'refused' | 'timeout';

/** Limits that keep requests cheap and bounded. */
export const CHAT_LIMITS = {
  /** Characters per message the member can type. */
  maxMessageChars: 1000,
  /** Turns kept when talking to the AI; older ones are dropped. */
  maxTurns: 12,
} as const;

const MODES: Mode[] = ['watch', 'cutdown', 'quit'];
const clampInt = (n: unknown, min: number, max: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : undefined;

/** Keeps the most recent turns, starting on a user turn (the API requires it). */
export function boundHistory(turns: ChatTurn[], max: number = CHAT_LIMITS.maxTurns): ChatTurn[] {
  let recent = turns.slice(-max);
  while (recent.length && recent[0].role !== 'user') recent = recent.slice(1);
  return recent;
}

/**
 * Validates an untrusted request body. Returns a clean copy (unknown fields dropped,
 * history bounded) or undefined.
 */
export function parseChatRequest(body: unknown): ChatRequest | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as Record<string, unknown>;
  if (b.lang !== 'en' && b.lang !== 'fr' && b.lang !== 'ar') return undefined;
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > 50) return undefined;

  const messages: ChatTurn[] = [];
  for (const m of b.messages) {
    if (!m || typeof m !== 'object') return undefined;
    const { role, text } = m as Record<string, unknown>;
    if ((role !== 'user' && role !== 'assistant') || typeof text !== 'string') return undefined;
    const clean = text.trim();
    if (!clean || clean.length > CHAT_LIMITS.maxMessageChars * 4) return undefined;
    messages.push({ role, text: clean.slice(0, role === 'user' ? CHAT_LIMITS.maxMessageChars : CHAT_LIMITS.maxMessageChars * 4) });
  }
  if (messages[messages.length - 1].role !== 'user') return undefined;

  const bounded = boundHistory(messages);
  if (bounded.length === 0) return undefined;

  return { lang: b.lang, messages: bounded, context: parseContext(b.context) };
}

function parseContext(raw: unknown): ChatContext | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const c = raw as Record<string, unknown>;
  if (!MODES.includes(c.mode as Mode)) return undefined;
  const smokeFreeHours = clampInt(c.smokeFreeHours, 0, 90 * 24);
  const cigsPerDay = clampInt(c.cigsPerDay, 1, 100);
  const cravingsBeaten = clampInt(c.cravingsBeaten, 0, 100_000);
  if (smokeFreeHours === undefined || cigsPerDay === undefined || cravingsBeaten === undefined) return undefined;
  const topTriggers = Array.isArray(c.topTriggers)
    ? c.topTriggers.filter((t): t is TriggerId => (TRIGGERS as readonly unknown[]).includes(t)).slice(0, 3)
    : [];
  return { mode: c.mode as Mode, smokeFreeHours, cigsPerDay, topTriggers, cravingsBeaten };
}
