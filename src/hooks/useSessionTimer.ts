'use client';

import { useEffect, useState } from 'react';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}


export function useSessionTimer(startTime: number | null, endTime: number | null = null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startTime === null || endTime != null) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  const seconds =
    startTime === null
      ? 0
      : endTime != null
        ? Math.floor((endTime - startTime) / 1000)
        : elapsed;

  return formatTime(seconds);
}
