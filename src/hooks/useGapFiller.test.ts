import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGapFiller } from './useGapFiller';
import { GAP_FILLER_RATE_LIMIT_PAUSE_MS } from '@/lib/constants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeResponse = (overrides = {}) => ({
  correctedSentence: 'corrected text',
  words: [{ text: 'corrected', type: 'confirmed', confidence: 0.95 }],
  ...overrides,
});

function mockFetch(response: object, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
  });
}

function mockFetchFail(error = new Error('Network error')) {
  global.fetch = vi.fn().mockRejectedValue(error);
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useGapFiller', () => {
  describe('basic fetch', () => {
    it('calls /api/gap-filler with correct payload', async () => {
      mockFetch(makeResponse());
      const onResult = vi.fn();
      const { result } = renderHook(() => useGapFiller({ onResult }));

      await act(async () => {
        await result.current.fill('line-1', 'hello world');
      });

      expect(fetch).toHaveBeenCalledWith('/api/gap-filler', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: 'hello world', context: [], domain: 'education' }),
      }));
    });

    it('calls onResult with the API response', async () => {
      const response = makeResponse();
      mockFetch(response);
      const onResult = vi.fn();
      const { result } = renderHook(() => useGapFiller({ onResult }));

      await act(async () => {
        await result.current.fill('line-1', 'hello world');
      });

      expect(onResult).toHaveBeenCalledWith('line-1', response);
    });

    it('passes lineId correctly to onResult', async () => {
      mockFetch(makeResponse());
      const onResult = vi.fn();
      const { result } = renderHook(() => useGapFiller({ onResult }));

      await act(async () => {
        await result.current.fill('my-line-id', 'some text');
      });

      expect(onResult).toHaveBeenCalledWith('my-line-id', expect.any(Object));
    });

    it('does not call onResult when response is not ok', async () => {
      mockFetch({}, false);
      const onResult = vi.fn();
      const { result } = renderHook(() => useGapFiller({ onResult }));

      await act(async () => {
        await result.current.fill('line-1', 'hello');
      });

      expect(onResult).not.toHaveBeenCalled();
    });
  });

  describe('context window', () => {
    it('sends up to the last 5 sentences as context', async () => {
      mockFetch(makeResponse());
      const onResult = vi.fn();
      const { result } = renderHook(() => useGapFiller({ onResult }));

      // Fill 6 sentences
      for (let i = 1; i <= 6; i++) {
        mockFetch(makeResponse());
        await act(async () => {
          await result.current.fill(`line-${i}`, `sentence ${i}`);
        });
      }

      const lastCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      const body = JSON.parse(lastCall[1].body);
      expect(body.context).toHaveLength(5);
      expect(body.context).toEqual([
        'sentence 1', 'sentence 2', 'sentence 3', 'sentence 4', 'sentence 5',
      ]);
    });
  });

  describe('rate limiting', () => {
    it('starts with paused = false', () => {
      const { result } = renderHook(() => useGapFiller({ onResult: vi.fn() }));
      expect(result.current.paused).toBe(false);
    });

    it('sets paused = true when API returns rateLimited', async () => {
      mockFetch(makeResponse({ rateLimited: true }));
      const { result } = renderHook(() => useGapFiller({ onResult: vi.fn() }));

      await act(async () => {
        await result.current.fill('line-1', 'text');
      });

      expect(result.current.paused).toBe(true);
    });

    it('skips fetch and stays paused during rate limit window', async () => {
      mockFetch(makeResponse({ rateLimited: true }));
      const onResult = vi.fn();
      const { result } = renderHook(() => useGapFiller({ onResult }));

      // Trigger rate limit
      await act(async () => {
        await result.current.fill('line-1', 'text');
      });
      expect(result.current.paused).toBe(true);

      const callsBefore = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;

      // Try to fill again — should be skipped
      await act(async () => {
        await result.current.fill('line-2', 'more text');
      });

      expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
    });

    it('resumes after rate limit window expires', async () => {
      mockFetch(makeResponse({ rateLimited: true }));
      const { result } = renderHook(() => useGapFiller({ onResult: vi.fn() }));

      await act(async () => {
        await result.current.fill('line-1', 'text');
      });
      expect(result.current.paused).toBe(true);

      // Advance past the rate limit pause
      act(() => { vi.advanceTimersByTime(GAP_FILLER_RATE_LIMIT_PAUSE_MS + 1); });

      mockFetch(makeResponse());
      await act(async () => {
        await result.current.fill('line-2', 'new text');
      });

      expect(result.current.paused).toBe(false);
    });
  });

  describe('offline queue', () => {
    it('queues sentences when fetch fails due to network error', async () => {
      mockFetchFail();
      const onResult = vi.fn();
      const { result } = renderHook(() => useGapFiller({ onResult }));

      await act(async () => {
        await result.current.fill('line-1', 'queued sentence');
      });

      expect(onResult).not.toHaveBeenCalled();
    });

    it('flushQueue retries all queued sentences', async () => {
      mockFetchFail();
      const onResult = vi.fn();
      const { result } = renderHook(() => useGapFiller({ onResult }));

      // Queue two sentences
      await act(async () => {
        await result.current.fill('line-1', 'first');
        await result.current.fill('line-2', 'second');
      });

      // Real timers so waitFor polling works
      vi.useRealTimers();
      mockFetch(makeResponse());
      await act(async () => { result.current.flushQueue(); });
      await waitFor(() => expect(onResult).toHaveBeenCalledTimes(2));
    });

    it('clears the queue after flushing', async () => {
      mockFetchFail();
      const onResult = vi.fn();
      const { result } = renderHook(() => useGapFiller({ onResult }));

      await act(async () => {
        await result.current.fill('line-1', 'queued');
      });

      vi.useRealTimers();
      mockFetch(makeResponse());
      await act(async () => { result.current.flushQueue(); });
      await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));

      onResult.mockClear();

      // Flush again — queue should be empty
      await act(async () => { result.current.flushQueue(); });
      await new Promise((r) => setTimeout(r, 50));
      expect(onResult).not.toHaveBeenCalled();
    });
  });
});
