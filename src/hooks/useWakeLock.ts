'use client';

import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) {
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
      return;
    }

    async function acquire() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Wake lock not supported or denied — non-critical
      }
    }

    acquire();

    // Re-acquire on visibility change (screen dims then user returns)
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && active) {
        acquire();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [active]);
}
