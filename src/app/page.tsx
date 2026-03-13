'use client';

import dynamic from 'next/dynamic';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { SessionScreen } from '@/components/SessionScreen';
import { SessionEndScreen } from '@/components/SessionEndScreen';

// Load only on client to avoid hydration mismatch (server/client can serialize StartScreen markup differently)
const StartScreen = dynamic(
  () => import('@/components/StartScreen').then((m) => m.StartScreen),
  { ssr: false, loading: () => <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center text-white/70" aria-hidden="true">Loading…</div> }
);

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
