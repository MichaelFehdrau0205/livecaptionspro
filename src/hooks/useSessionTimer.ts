'use client';

import { useEffect, useState } from 'react';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function getInitialElapsed(startTime: number | null, endTime: number | null): number {
  if (startTime === null) return 0;
  if (endTime != null) return Math.floor((endTime - startTime) / 1000);
  return Math.floor((Date.now() - startTime) / 1000);
}

export function useSessionTimer(startTime: number | null, endTime: number | null = null) {
  const [elapsed, setElapsed] = useState(() => getInitialElapsed(startTime, endTime));

  useEffect(() => {
    if (startTime === null) return;
    if (endTime != null) {
      setElapsed(Math.floor((endTime - startTime) / 1000));
      return;
    }
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  return formatTime(startTime === null ? 0 : elapsed);
}
