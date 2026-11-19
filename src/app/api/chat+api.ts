import { FEATURES } from '@/config/features';
import { createAnthropicProvider } from '@/server/anthropic';
import { handleChat } from '@/server/chat-handler';
import { RateLimiter } from '@/server/rate-limit';

// One provider and limiter per server instance.
const provider = createAnthropicProvider();
const limiter = new RateLimiter();

/** Support chat. Runs on the server only; see src/server/chat-handler.ts. */
export async function POST(request: Request): Promise<Response> {
  // Left out of the test release: no server spend unless this build turns the chat on.
  if (!FEATURES.chat) return new Response('Not found', { status: 404 });
  return handleChat(request, {
    provider,
    limiter,
    // Metrics only: outcome, latency, token counts, estimated cost. Never message text.
    log: (entry) => console.log(JSON.stringify(entry)),
  });
}
