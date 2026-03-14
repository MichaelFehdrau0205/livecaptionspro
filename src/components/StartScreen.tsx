'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { ApiKeySettings } from './ApiKeySettings';

/** Renders only after mount to avoid hydration mismatch (navigator/window differ on server). */
function IOSTip() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let isStandalone = false;
    try {
      if (typeof window.matchMedia === 'function') {
        isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      }
      if (!isStandalone && (navigator as { standalone?: boolean }).standalone === true) isStandalone = true;
    } catch {
      // ignore
    }
    setShow(isIOS || isStandalone);
  }, []);
  if (!show) return null;
  return (
    <p className="text-xs text-white/60 text-center max-w-[280px]">
      On iPhone: open this page in <strong>Safari (browser tab)</strong>, not from Home Screen, for speech recognition.
    </p>
  );
}

/** Same root on server and client so hydration matches; content only after mount. */
const START_ROOT_CLASS = 'start-screen-fit bg-[#0f0f1a] min-h-screen';

export function StartScreen() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={START_ROOT_CLASS}
      style={{ minHeight: '100vh', height: '100vh' }}
      data-tap-targets
      suppressHydrationWarning
    >
      {mounted ? <StartScreenContent /> : null}
    </div>
  );
}

function StartScreenContent() {
  const { startSession, audioError } = useSession();
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const lastActivationRef = useRef(0);
  const lastAllowRef = useRef(0);
  const lastCancelRef = useRef(0);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const openModal = useCallback(() => {
    setShowPrePrompt(true);
  }, []);

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
      className="start-screen-fit flex flex-col items-center justify-center bg-[#0f0f1a] px-6 py-6 text-white relative overflow-y-auto"
      style={{ minHeight: '100vh', height: '100vh' }}
      data-tap-targets
    >
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        className="absolute top-4 right-4 z-10 p-2 text-white/60 transition-colors hover:text-white"
        aria-label="Open settings"
        data-testid="settings-button"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {showSettings && <ApiKeySettings onClose={() => setShowSettings(false)} />}

      <div
        className="start-screen-card-wrapper flex flex-col items-center justify-center gap-6 rounded-2xl border border-white/10 px-6 py-8 shadow-xl"
        style={{
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          WebkitTransform: 'translate(-50%, -50%)',
        }}
      >
        <div className="text-center flex-shrink-0">
          <h1 className="text-3xl font-bold tracking-tight text-white">Live Captions Pro</h1>
          <p className="mt-3 text-lg text-white/90 leading-relaxed">
            Real-time captions with zero lost meaning.
          </p>
        </div>

        <button
          ref={startButtonRef}
          type="button"
          data-testid="start-button"
          className="w-full py-5 rounded-2xl bg-white text-[#1a1a2e] text-xl font-bold tracking-wide
            hover:bg-white/90 active:scale-95 transition-all min-h-[56px] touch-manipulation cursor-pointer flex-shrink-0 relative z-10"
          aria-label="Start captioning session"
          onClick={(e) => {
            e.preventDefault();
            runOpenModal();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            runOpenModal();
          }}
        >
          START CAPTIONING
        </button>

        <span className="text-sm text-white/70 tracking-widest uppercase flex-shrink-0">Education Mode</span>

        <IOSTip />
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
                  : audioError.includes('HTTPS') || audioError.includes('production URL')
                    ? 'Voice capture needs a secure connection. On iPhone, open the app using the production link (https://…) in Safari, not a local address.'
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
                aria-label="Cancel and stay on start screen"
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
