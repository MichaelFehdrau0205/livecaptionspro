'use client';

import { useEffect, useRef, useState } from 'react';
import { RECONNECT_INTERVAL_MS } from '@/lib/constants';

type ConnectionStatus = 'connected' | 'reconnecting' | 'lost';

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'connected' : 'reconnecting'
  );
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function handleOnline() {
      setStatus('connected');
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function handleOffline() {
      setStatus('lost');
      reconnectTimerRef.current = setInterval(() => {
        if (navigator.onLine) {
          handleOnline();
        } else {
          setStatus('reconnecting');
        }
      }, RECONNECT_INTERVAL_MS);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
    };
  }, []);

  return status;
}
