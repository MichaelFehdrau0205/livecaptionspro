'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { StatusBar } from './StatusBar';
import { CaptionArea } from './CaptionArea';
import { ControlBar } from './ControlBar';
import { ConnectionBanner } from './ConnectionBanner';

function useShowIOSTip() {
  const [show] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let isStandalone = false;
    try {
      isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
    } catch {
      /* ignore */
    }
    return isIOS || isStandalone;
  });
  return show;
}

export function SessionScreen() {
  const { state, dispatch, endSession, restartSession, connectionStatus, gapFillerPaused, timer, speechError, isDeepgramActive } = useSession();
  const [displayMode, setDisplayMode] = useDisplayMode();
  const showIOSTip = useShowIOSTip();

  function handleFlagWord(lineId: string, wordIndex: number) {
    dispatch({ type: 'FLAG_WORD', payload: { lineId, wordIndex } });
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#1a1a2e] text-white overflow-x-hidden">
      <header className="sticky top-0 z-20 flex-shrink-0 w-full bg-[#1a1a2e]">
        <StatusBar connectionStatus={connectionStatus} timer={timer} gapFillerPaused={gapFillerPaused} isDeepgramActive={isDeepgramActive} />
        <div className="flex w-full justify-center items-center gap-3 px-4 py-3 min-h-[56px] border-b border-white/10 bg-[#1a1a2e]" role="group" aria-label="Caption mode">
        <button
          type="button"
          onClick={() => { if (displayMode !== 'lecture') { setDisplayMode('lecture'); restartSession(); } }}
          className={`min-h-[40px] min-w-[90px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${displayMode === 'lecture' ? 'bg-white/25 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
          aria-pressed={displayMode === 'lecture'}
          aria-label="Lecture: single style"
          data-testid="mode-lecture"
        >
          Lecture
        </button>
        <button
          type="button"
          onClick={() => { if (displayMode !== 'group') { setDisplayMode('group'); restartSession(); } }}
          className={`min-h-[40px] min-w-[90px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${displayMode === 'group' ? 'bg-white/25 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
          aria-pressed={displayMode === 'group'}
          aria-label="Group: color boxes"
          data-testid="mode-group"
        >
          Group
        </button>
        </div>
      </header>
      <ConnectionBanner status={connectionStatus} />
      {speechError && (
        <div className="px-4 py-3 bg-amber-500/20 border-b border-amber-500/40 text-amber-200 text-sm" role="alert">
          <p className="font-semibold">Speech recognition unavailable</p>
          <p className="mt-1">{speechError}</p>
          {showIOSTip && (
            <p className="mt-2 text-amber-200/90">
              On iPhone: open this page in <strong>Safari (browser tab)</strong>, not from Home Screen. Allow microphone and turn on Dictation in Settings → General → Keyboard.
            </p>
          )}
        </div>
      )}
      <CaptionArea
        captions={state.captions}
        currentInterim={state.currentInterim}
        onFlagWord={handleFlagWord}
        displayMode={displayMode}
      />
      <ControlBar onEndSession={endSession} connectionStatus={connectionStatus} />
    </div>
  );
}
