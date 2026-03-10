'use client';

import { useCallback, useRef, useState } from 'react';
import type { GapFillerResponse } from '@/types';
import { GAP_FILLER_RATE_LIMIT_PAUSE_MS } from '@/lib/constants';

interface UseGapFillerOptions {
  onResult: (lineId: string, response: GapFillerResponse) => void;
}

export function useGapFiller({ onResult }: UseGapFillerOptions) {
  const [paused, setPaused] = useState(false);
  const rateLimitPauseUntilRef = useRef<number>(0);
  const contextRef = useRef<string[]>([]);
  const queueRef = useRef<Array<{ lineId: string; sentence: string }>>([]);

  const fill = useCallback(
    async (lineId: string, sentence: string) => {
      // Check rate limit pause
      if (Date.now() < rateLimitPauseUntilRef.current) {
        setPaused(true);
        return;
      }
      setPaused(false);

      try {
        const res = await fetch('/api/gap-filler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sentence,
            context: [...contextRef.current],
            domain: 'education',
          }),
        });

        if (!res.ok) return;

        const data: GapFillerResponse = await res.json();

        if (data.rateLimited) {
          rateLimitPauseUntilRef.current = Date.now() + GAP_FILLER_RATE_LIMIT_PAUSE_MS;
          setPaused(true);
        }

        // Update context window
        contextRef.current = [...contextRef.current, sentence].slice(-5);

        onResult(lineId, data);
      } catch {
        // Network error — queue for retry when connection returns
        queueRef.current.push({ lineId, sentence });
      }
    },
    [onResult]
  );

  const flushQueue = useCallback(() => {
    const items = [...queueRef.current];
    queueRef.current = [];
    items.forEach(({ lineId, sentence }) => {
      fill(lineId, sentence);
    });
  }, [fill]);

  return { fill, paused, flushQueue };
}
