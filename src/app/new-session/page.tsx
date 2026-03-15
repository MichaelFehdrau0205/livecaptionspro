'use client';

import { useLayoutEffect } from 'react';
import { SessionProvider } from '@/context/SessionContext';
import { AppRouter } from '@/app/page';

/** New session page: shows StartScreen and opens the microphone permission modal so user can Allow → then live session → then end session page. */
export default function NewSessionPage() {
  useLayoutEffect(() => {
    try {
      sessionStorage.setItem('livecaptionspro_start_pending', '1');
    } catch (_) {}
  }, []);

  return (
    <SessionProvider>
      <AppRouter />
    </SessionProvider>
  );
}
