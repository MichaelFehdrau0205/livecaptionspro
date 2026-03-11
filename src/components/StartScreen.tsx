'use client';

import { useState, useCallback } from 'react';
import { useSession } from '@/context/SessionContext';

export function StartScreen() {
  const { startSession, audioError } = useSession();
  const [showPrePrompt, setShowPrePrompt] = useState(false);

  const handleStartClick = useCallback(() => {
    // Debug: if you see this in the console, the click reached the handler
    if (typeof console !== 'undefined') console.log('[StartScreen] START CAPTIONING clicked, opening mic dialog');
    setShowPrePrompt(true);
  }, []);

  const handleAllowMicrophone = () => {
    startSession();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e] px-6 text-white relative">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Live Captions Pro</h1>
          <p className="mt-3 text-lg text-white/70 leading-relaxed">
            Real-time captions with zero lost meaning.
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleStartClick();
          }}
          data-testid="start-button"
          className="w-full py-5 rounded-2xl bg-white text-[#1a1a2e] text-xl font-bold tracking-wide
            hover:bg-white/90 active:scale-95 transition-all min-h-[56px] touch-manipulation"
          aria-label="Start captioning session"
        >
          START CAPTIONING
        </button>

        <span className="text-sm text-white/50 tracking-widest uppercase">Education Mode</span>
      </div>

      {showPrePrompt && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mic-prompt-title"
          data-testid="mic-permission-prompt"
        >
          <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-xl">
            <h2 id="mic-prompt-title" className="text-xl font-bold text-white mb-3">
              Microphone access
            </h2>
            <p className="text-white/80 leading-relaxed mb-6">
              Live Captions Pro needs microphone access. Your audio is processed locally — no audio is sent to our servers.
            </p>
            {audioError && (
              <p className="text-amber-400 text-sm mb-4" role="alert">
                {audioError.includes('denied') || audioError.includes('Permission')
                  ? 'Permission denied. Please allow microphone access and try again.'
                  : audioError.includes('not supported') || audioError.includes('getUserMedia')
                    ? 'Microphone not supported. Use a modern browser (Chrome, Safari, Edge).'
                    : audioError}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleAllowMicrophone}
                data-testid="allow-mic-button"
                className="w-full py-4 rounded-2xl bg-white text-[#1a1a2e] font-bold
                  hover:bg-white/90 active:scale-95 transition-all min-h-[56px]"
                aria-label="Allow microphone access"
              >
                Allow Microphone
              </button>
              <button
                type="button"
                onClick={() => setShowPrePrompt(false)}
                className="w-full py-3 rounded-2xl border border-white/30 text-white/80 font-medium
                  hover:bg-white/10 active:scale-95 transition-all min-h-[48px]"
                data-testid="cancel-mic-prompt"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
