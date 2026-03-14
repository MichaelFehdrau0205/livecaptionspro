'use client';

import { SessionProvider, useSession } from '@/context/SessionContext';
import { StartScreen } from '@/components/StartScreen';
import { SessionScreen } from '@/components/SessionScreen';
import { SessionEndScreen } from '@/components/SessionEndScreen';

function AppRouter() {
  const { state } = useSession();

  if (state.status === 'idle') return <StartScreen />;
  if (state.status === 'ended') return <SessionEndScreen />;
  return <SessionScreen />;
}

export default function Home() {
  return (
    <SessionProvider>
      <AppRouter />
    </SessionProvider>
  );
}
