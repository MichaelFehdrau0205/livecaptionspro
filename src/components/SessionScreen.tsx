'use client';

import { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useGroupSpeakerCount } from '@/hooks/useGroupSpeakerCount';
import { printTranscript } from '@/lib/transcriptExport';
import { StatusBar } from './StatusBar';
import { CaptionArea } from './CaptionArea';
import { ControlBar } from './ControlBar';
import { ConnectionBanner } from './ConnectionBanner';
import { GroupSessionTools } from './GroupSessionTools';

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
  const {
    state,
    dispatch,
    endSession,
    pauseSession,
    resumeSession,
    restartSession,
    connectionStatus,
    timer,
    speechError,
    isDeepgramActive,
    displayMode,
    setDisplayMode,
  } = useSession();
  const [expectedSpeakerCount, setExpectedSpeakerCount] = useGroupSpeakerCount();
  const showIOSTip = useShowIOSTip();

  function handleFlagWord(lineId: string, wordIndex: number) {
    dispatch({ type: 'FLAG_WORD', payload: { lineId, wordIndex } });
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#1a1a2e] text-white overflow-x-hidden">
      <header className="sticky top-0 z-20 flex-shrink-0 w-full bg-[#1a1a2e]">
        <StatusBar connectionStatus={connectionStatus} timer={timer} isDeepgramActive={isDeepgramActive} />
        <div className="flex w-full items-center gap-2 px-4 py-3 min-h-[56px] border-b border-white/10 bg-[#1a1a2e]">
          {/* Mode toggle */}
          <div className="flex flex-1 justify-center gap-2" role="group" aria-label="Caption mode">
            <button
              type="button"
              onClick={() => { if (displayMode !== 'lecture') { setDisplayMode('lecture'); restartSession(); } }}
              className={`min-h-[40px] min-w-[80px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${displayMode === 'lecture' ? 'bg-white/25 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              aria-pressed={displayMode === 'lecture'}
              aria-label="Lecture: single style"
              data-testid="mode-lecture"
            >
              Lecture
            </button>
            <button
              type="button"
              onClick={() => { if (displayMode !== 'group') { setDisplayMode('group'); restartSession(); } }}
              className={`min-h-[40px] min-w-[80px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation ${displayMode === 'group' ? 'bg-white/25 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              aria-pressed={displayMode === 'group'}
              aria-label="Group: color boxes"
              data-testid="mode-group"
            >
              Group
            </button>
          </div>
          {/* Save transcript — available during session so user can save before switching modes */}
          {state.captions.length > 0 && state.sessionStartTime && (
            <button
              type="button"
              onClick={() => printTranscript({
                captions: state.captions,
                sessionStartTime: state.sessionStartTime!,
                sessionEndTime: state.sessionEndTime ?? Date.now(),
                mode: displayMode,
              })}
              className="text-white/40 hover:text-white/80 transition-colors p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Save transcript as PDF"
              data-testid="save-pdf-session-button"
              title="Save transcript as PDF"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          )}
        </div>
      </header>
      {displayMode === 'group' && (
        <GroupSessionTools
          expectedSpeakerCount={expectedSpeakerCount}
          onExpectedSpeakerCountChange={setExpectedSpeakerCount}
        />
      )}
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
        expectedSpeakerCount={expectedSpeakerCount}
      />
      <ControlBar
        onEndSession={endSession}
        onPause={pauseSession}
        onResume={resumeSession}
        connectionStatus={connectionStatus}
        sessionStatus={state.status as 'listening' | 'paused' | 'reconnecting'}
      />
    </div>
  );
}
