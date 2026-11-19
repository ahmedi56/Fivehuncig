import { sendChat } from './chat-client';

const mockFetch = jest.fn();
jest.mock('expo/fetch', () => ({ fetch: (...args: unknown[]) => mockFetch(...args) }));

/** A Response-like object whose body arrives in the given chunks (split mid-line on purpose). */
function streamed(chunks: string[], status = 200) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok: status >= 200 && status < 300,
    status,
    body: {
      getReader: () => ({
        read: async () => (i < chunks.length ? { value: encoder.encode(chunks[i++]), done: false } : { value: undefined, done: true }),
      }),
    },
  };
}

const request = { lang: 'en' as const, messages: [{ role: 'user' as const, text: 'hi' }] };

async function run() {
  const events: unknown[] = [];
  await sendChat(request, { installId: 'id-1', signal: new AbortController().signal, onEvent: (e) => events.push(e) });
  return events;
}

beforeEach(() => mockFetch.mockReset());

describe('chat client', () => {
  it('reassembles lines split across chunks and sends the install id', async () => {
    mockFetch.mockResolvedValue(streamed(['{"t":"delta","te', 'xt":"Hel"}\n{"t":"delta","text":"lo"}\n', '{"t":"done"}\n']));
    expect(await run()).toEqual([{ t: 'delta', text: 'Hel' }, { t: 'delta', text: 'lo' }, { t: 'done' }]);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/chat');
    expect(init.headers['x-install-id']).toBe('id-1');
  });

  it('ignores malformed lines instead of failing the reply', async () => {
    mockFetch.mockResolvedValue(streamed(['not json\n{"t":"delta","text":"ok"}\n{"t":"weird"}\n{"t":"done"}\n']));
    expect(await run()).toEqual([{ t: 'delta', text: 'ok' }, { t: 'done' }]);
  });

  it('reports a network failure, then done', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));
    expect(await run()).toEqual([{ t: 'error', code: 'network' }, { t: 'done' }]);
  });

  it('maps an HTTP error with no event to an error code', async () => {
    mockFetch.mockResolvedValue(streamed([], 429));
    expect(await run()).toEqual([{ t: 'error', code: 'rate_limited' }, { t: 'done' }]);
  });

  it('passes through the server error event', async () => {
    mockFetch.mockResolvedValue(streamed(['{"t":"error","code":"not_configured"}\n'], 503));
    expect(await run()).toEqual([{ t: 'error', code: 'not_configured' }, { t: 'done' }]);
  });
});
