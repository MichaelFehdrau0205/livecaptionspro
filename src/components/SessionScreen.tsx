'use client';

import { useSession } from '@/context/SessionContext';
import { StatusBar } from './StatusBar';
import { CaptionArea } from './CaptionArea';
import { ControlBar } from './ControlBar';
import { ConnectionBanner } from './ConnectionBanner';

export function SessionScreen() {
  const { state, dispatch, endSession, connectionStatus, timer, speechError, isDeepgramActive, displayMode, setDisplayMode } = useSession();

  function handleFlagWord(lineId: string, wordIndex: number) {
    dispatch({ type: 'FLAG_WORD', payload: { lineId, wordIndex } });
  }

  return (
    <div className="flex flex-col min-h-[100dvh] min-h-screen bg-[#1a1a2e] text-white overflow-x-hidden">
      <header className="sticky top-0 z-20 flex-shrink-0 w-full bg-[#1a1a2e]">
        <StatusBar connectionStatus={connectionStatus} timer={timer} isDeepgramActive={isDeepgramActive} />
      {/* Mode: Lecture | Group — centered strip so it’s always visible below the status bar. */}
        <div
          className="flex w-full justify-center items-center gap-3 px-4 py-3 min-h-[56px] border-b-2 border-white/20 bg-[#0f0f1f]"
          role="group"
          aria-label="Session mode"
        >
          <span className="text-sm font-semibold text-white/80 uppercase tracking-wider mr-2">Mode</span>
        <button
          type="button"
          onClick={() => setDisplayMode('lecture')}
          className={`no-underline px-5 py-3 text-base font-semibold transition-all touch-manipulation min-h-[48px] ${displayMode === 'lecture' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
          aria-pressed={displayMode === 'lecture'}
          aria-label="Lecture — single speaker, white text only"
          data-testid="mode-lecture"
        >
          Lecture
        </button>
        <button
          type="button"
          onClick={() => setDisplayMode('group')}
          className={`no-underline px-5 py-3 text-base font-semibold transition-all touch-manipulation min-h-[48px] ${displayMode === 'group' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
          aria-pressed={displayMode === 'group'}
          aria-label="Group — multiple speakers with colors"
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
        </div>
      )}
      <CaptionArea
        captions={state.captions}
        currentInterim={state.currentInterim}
        onFlagWord={handleFlagWord}
        showSpeakerColors={displayMode === 'group'}
      />
      <ControlBar onEndSession={endSession} connectionStatus={connectionStatus} />
    </div>
  );
}
