'use client';

import { useSession } from '@/context/SessionContext';

export function StartScreen() {
  const { startSession } = useSession();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e] px-6 text-white">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        {/* Logo / Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Live Captions Pro</h1>
          <p className="mt-3 text-lg text-white/70 leading-relaxed">
            Real-time captions with zero lost meaning.
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={startSession}
          data-testid="start-button"
          className="w-full py-5 rounded-2xl bg-white text-[#1a1a2e] text-xl font-bold tracking-wide
            hover:bg-white/90 active:scale-95 transition-all min-h-[56px]"
        >
          START CAPTIONING
        </button>

        {/* Mode indicator */}
        <span className="text-sm text-white/50 tracking-widest uppercase">Education Mode</span>
      </div>
    </div>
  );
}
