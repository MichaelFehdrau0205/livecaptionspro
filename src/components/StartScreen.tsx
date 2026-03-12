'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';

export function StartScreen() {
  const { startSession, audioError } = useSession();
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const lastActivationRef = useRef(0);
  const lastAllowRef = useRef(0);
  const lastCancelRef = useRef(0);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const openModal = useCallback(() => {
    setShowPrePrompt(true);
  }, []);

  // Safari often ignores React's onClick/onTouchEnd. Use native DOM listeners so both Chrome and Safari get the tap.
  const runOpenModal = useCallback(() => {
    const now = Date.now();
    if (now - lastActivationRef.current < 500) return;
    lastActivationRef.current = now;
    openModal();
  }, [openModal]);

  useEffect(() => {
    const el = startButtonRef.current;
    if (!el) return;

    const handle = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      runOpenModal();
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      requestAnimationFrame(() => runOpenModal());
    };

    el.addEventListener('click', handle, { capture: false });
    el.addEventListener('touchend', handleTouch, { capture: false, passive: false });

    return () => {
      el.removeEventListener('click', handle);
      el.removeEventListener('touchend', handleTouch);
    };
  }, [runOpenModal]);

  const handleAllowMicrophone = useCallback(() => {
    const now = Date.now();
    if (now - lastAllowRef.current < 400) return;
    lastAllowRef.current = now;
    startSession();
  }, [startSession]);

  const handleCancelPrompt = useCallback(() => {
    const now = Date.now();
    if (now - lastCancelRef.current < 400) return;
    lastCancelRef.current = now;
    setShowPrePrompt(false);
  }, []);

  return (
    <div
      className="start-screen-fit flex flex-col items-center justify-center bg-[#1a1a2e] px-6 py-6 text-white relative overflow-y-auto"
      data-tap-targets
      suppressHydrationWarning
    >
      <div className="flex flex-col items-center gap-6 max-w-sm w-full flex-1 justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Live Captions Pro</h1>
          <p className="mt-3 text-lg text-white/70 leading-relaxed">
            Real-time captions with zero lost meaning.
          </p>
        </div>

        <button
          ref={startButtonRef}
          type="button"
          data-testid="start-button"
          className="w-full py-5 rounded-2xl bg-white text-[#1a1a2e] text-xl font-bold tracking-wide
            hover:bg-white/90 active:scale-95 transition-all min-h-[56px] touch-manipulation cursor-pointer"
          aria-label="Start captioning session"
          suppressHydrationWarning
        >
          START CAPTIONING
        </button>

        <span className="text-sm text-white/50 tracking-widest uppercase">Education Mode</span>
      </div>

      {showPrePrompt && (
        <div
          className="mic-prompt-overlay-fit fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mic-prompt-title"
          data-testid="mic-permission-prompt"
        >
          <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-xl my-auto" data-tap-targets>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAllowMicrophone();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  requestAnimationFrame(() => handleAllowMicrophone());
                }}
                data-testid="allow-mic-button"
                className="w-full py-4 rounded-2xl bg-white text-[#1a1a2e] font-bold
                  hover:bg-white/90 active:scale-95 transition-all min-h-[56px] cursor-pointer touch-manipulation"
                aria-label="Allow microphone access"
              >
                Allow Microphone
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelPrompt();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  requestAnimationFrame(() => handleCancelPrompt());
                }}
                className="w-full py-3 rounded-2xl border border-white/30 text-white/80 font-medium
                  hover:bg-white/10 active:scale-95 transition-all min-h-[48px] cursor-pointer touch-manipulation"
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
