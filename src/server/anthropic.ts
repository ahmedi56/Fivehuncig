import Anthropic from '@anthropic-ai/sdk';

import type { ChatProvider, ProviderResult } from './chat-handler';

/**
 * Claude provider for the support chat. Server-only: reads ANTHROPIC_API_KEY (never an
 * EXPO_PUBLIC_ variable), so the key is never in the app bundle.
 *
 * Cost and latency: short conversational replies at low effort with a bounded history.
 * Override the model with CHAT_MODEL if you need to.
 */
export function createAnthropicProvider(env: Record<string, string | undefined> = process.env): ChatProvider | undefined {
  if (!env.ANTHROPIC_API_KEY) return undefined;
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 });
  const model = env.CHAT_MODEL || 'claude-opus-5-5';

  return {
    model,
    async *stream({ system, messages, signal }): AsyncGenerator<string, ProviderResult> {
      const stream = client.beta.messages.stream(
        {
          model,
          max_tokens: 1024,
          output_config: { effort: 'low' },
          // Re-run a safety-classifier decline on Anthropic's recommended fallback model.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          system: system.map((text) => ({ type: 'text' as const, text })),
          messages: messages.map((m) => ({ role: m.role, content: m.text })),
        },
        { signal },
      );
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield event.delta.text;
      }
      const final = await stream.finalMessage();
      return {
        refused: final.stop_reason === 'refusal',
        inputTokens: final.usage.input_tokens,
        outputTokens: final.usage.output_tokens,
      };
    },
  };
}
