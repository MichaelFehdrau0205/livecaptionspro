'use client';

import { SessionProvider } from '@/context/SessionContext';
import { AppRouter } from '@/app/page';

/** End session page: shows SessionEndScreen (SESSION ENDED, stats, NEW SESSION button). */
export default function EndSessionPage() {
  return (
    <SessionProvider initialStatus="ended">
      <AppRouter />
    </SessionProvider>
  );
}
