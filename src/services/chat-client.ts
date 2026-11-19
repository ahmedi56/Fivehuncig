import { fetch } from 'expo/fetch';

import type { ChatErrorCode, ChatEvent, ChatRequest } from '@/domain/chat';

/** Client-side failures on top of the server's error codes. */
export type ClientErrorCode = ChatErrorCode | 'network';

/**
 * Sends one chat turn to `/api/chat` and calls `onEvent` for each streamed line.
 * Resolves when the stream ends; never throws (failures arrive as an `error` event).
 *
 * In development the relative URL reaches the Expo dev server on every platform. For a store
 * build, set the API origin (expo-router `origin` / EAS Hosting) as described in docs/AI_CHAT.md.
 */
export async function sendChat(
  request: ChatRequest,
  opts: { installId: string; signal: AbortSignal; onEvent: (event: ChatEvent | { t: 'error'; code: ClientErrorCode }) => void },
): Promise<void> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), 40_000);
  const onAbort = () => timeout.abort();
  opts.signal.addEventListener('abort', onAbort);

  let sawDone = false;
  let sawError = false;
  const emit = (event: ChatEvent | { t: 'error'; code: ClientErrorCode }) => {
    if (event.t === 'done') sawDone = true;
    if (event.t === 'error') sawError = true;
    opts.onEvent(event);
  };

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-install-id': opts.installId },
      body: JSON.stringify(request),
      signal: timeout.signal,
    });
    if (!res.body) {
      emit({ t: 'error', code: res.ok ? 'provider' : statusToCode(res.status) });
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const raw = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!raw) continue;
        const event = parseEvent(raw);
        if (event) emit(event);
      }
    }
    if (!res.ok && !sawError) emit({ t: 'error', code: statusToCode(res.status) });
  } catch {
    if (!opts.signal.aborted) emit({ t: 'error', code: timeout.signal.aborted ? 'timeout' : 'network' });
  } finally {
    clearTimeout(timer);
    opts.signal.removeEventListener('abort', onAbort);
    if (!sawDone && !opts.signal.aborted) opts.onEvent({ t: 'done' });
  }
}

function statusToCode(status: number): ClientErrorCode {
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'not_configured';
  if (status === 400) return 'bad_request';
  return 'provider';
}

function parseEvent(raw: string): ChatEvent | undefined {
  try {
    const e = JSON.parse(raw) as ChatEvent;
    if (e.t === 'delta' && typeof e.text === 'string') return e;
    if (e.t === 'safety' && (e.kind === 'self-harm' || e.kind === 'medical-emergency')) return e;
    if (e.t === 'error' && typeof e.code === 'string') return e;
    if (e.t === 'done') return e;
  } catch {
    // Ignore a malformed line rather than breaking the whole reply.
  }
  return undefined;
}
