import { parseChatRequest, type ChatEvent, type ChatErrorCode, type ChatTurn } from '@/domain/chat';
import { detectCrisis } from '@/domain/safety';

import { contextBlock, SYSTEM_PROMPT } from './prompt';
import type { RateLimiter } from './rate-limit';

/** What the orchestrator needs from an AI provider. The real one is in anthropic.ts. */
export interface ChatProvider {
  /** Model id, for metrics and cost estimates. */
  model: string;
  stream(args: {
    system: string[];
    messages: ChatTurn[];
    signal: AbortSignal;
  }): AsyncGenerator<string, ProviderResult>;
}

export interface ProviderResult {
  refused: boolean;
  inputTokens: number;
  outputTokens: number;
}

export interface ChatDeps {
  /** Undefined when no API key is configured: the chat reports "not configured". */
  provider?: ChatProvider;
  limiter: RateLimiter;
  /** Structured metrics sink. Never receives message text. */
  log: (entry: Record<string, unknown>) => void;
  timeoutMs?: number;
  now?: () => number;
}

/** USD per million tokens, for the cost estimate in logs only. */
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-opus-5-5': { input: 4, output: 20 },
};

const encoder = new TextEncoder();
const line = (event: ChatEvent) => encoder.encode(`${JSON.stringify(event)}\n`);

function errorResponse(code: ChatErrorCode, status: number): Response {
  return new Response(`${JSON.stringify({ t: 'error', code } satisfies ChatEvent)}\n`, {
    status,
    headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** A short-lived stream with a single event (safety). */
function singleEventResponse(event: ChatEvent): Response {
  return new Response(`${JSON.stringify(event)}\n${JSON.stringify({ t: 'done' } satisfies ChatEvent)}\n`, {
    status: 200,
    headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/**
 * POST /api/chat: validate → rate limit → safety → AI (streamed) → metrics.
 * Message text is never logged.
 */
export async function handleChat(request: Request, deps: ChatDeps): Promise<Response> {
  const now = deps.now ?? Date.now;
  const started = now();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('bad_request', 400);
  }
  const parsed = parseChatRequest(body);
  if (!parsed) return errorResponse('bad_request', 400);

  // Safety first, before limits or configuration: crisis resources must always come back.
  const last = parsed.messages[parsed.messages.length - 1];
  const crisis = detectCrisis(last.text);
  if (crisis) {
    deps.log({ evt: 'chat', outcome: 'safety', kind: crisis, lang: parsed.lang });
    return singleEventResponse({ t: 'safety', kind: crisis });
  }

  const clientKey =
    request.headers.get('x-install-id')?.slice(0, 64) ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'anonymous';
  if (!deps.limiter.take(clientKey, now())) {
    deps.log({ evt: 'chat', outcome: 'rate_limited', lang: parsed.lang });
    return errorResponse('rate_limited', 429);
  }

  const provider = deps.provider;
  if (!provider) {
    deps.log({ evt: 'chat', outcome: 'not_configured' });
    return errorResponse('not_configured', 503);
  }

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), deps.timeoutMs ?? 30_000);
  request.signal?.addEventListener?.('abort', () => abort.abort());

  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      let outcome = 'ok';
      let result: ProviderResult | undefined;
      let firstTokenMs: number | undefined;
      try {
        const gen = provider.stream({
          system: [SYSTEM_PROMPT, contextBlock(parsed.lang, parsed.context)],
          messages: parsed.messages,
          signal: abort.signal,
        });
        for (;;) {
          const next = await gen.next();
          if (next.done) {
            result = next.value;
            break;
          }
          firstTokenMs ??= now() - started;
          controller.enqueue(line({ t: 'delta', text: next.value }));
        }
        if (result.refused) {
          outcome = 'refused';
          controller.enqueue(line({ t: 'error', code: 'refused' }));
        }
      } catch {
        outcome = abort.signal.aborted ? 'timeout' : 'provider';
        controller.enqueue(line({ t: 'error', code: abort.signal.aborted ? 'timeout' : 'provider' }));
      } finally {
        clearTimeout(timer);
        controller.enqueue(line({ t: 'done' }));
        controller.close();
        const price = PRICES[provider.model];
        deps.log({
          evt: 'chat',
          outcome,
          lang: parsed.lang,
          model: provider.model,
          turns: parsed.messages.length,
          latencyMs: now() - started,
          firstTokenMs,
          inputTokens: result?.inputTokens,
          outputTokens: result?.outputTokens,
          estCostUsd:
            price && result
              ? Number(((result.inputTokens * price.input + result.outputTokens * price.output) / 1e6).toFixed(5))
              : undefined,
        });
      }
    },
    cancel() {
      abort.abort();
      clearTimeout(timer);
    },
  });

  return new Response(body$, {
    status: 200,
    headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' },
  });
}
