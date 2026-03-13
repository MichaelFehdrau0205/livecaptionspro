'use client';

import { useSession } from '@/context/SessionContext';
import { StatusBar } from './StatusBar';
import { CaptionArea } from './CaptionArea';
import { ControlBar } from './ControlBar';
import { ConnectionBanner } from './ConnectionBanner';

export function SessionScreen() {
  const { state, dispatch, endSession, connectionStatus, gapFillerPaused, timer, speechError, isDeepgramActive } = useSession();

  function handleFlagWord(lineId: string, wordIndex: number) {
    dispatch({ type: 'FLAG_WORD', payload: { lineId, wordIndex } });
  }

  return (
    <div className="flex flex-col h-screen bg-[#1a1a2e] text-white">
      <StatusBar
        connectionStatus={connectionStatus}
        timer={timer}
        gapFillerPaused={gapFillerPaused}
        isDeepgramActive={isDeepgramActive}
      />
      <ConnectionBanner status={connectionStatus} />
      {speechError && (
        <div className="px-4 py-3 bg-amber-500/20 border-b border-amber-500/40 text-amber-200 text-sm" role="alert">
          <p className="font-semibold">Speech recognition unavailable</p>
          <p className="mt-1">{speechError}</p>
          <p className="mt-2 text-amber-200/90">
            On iPhone: open this page in <strong>Safari (browser tab)</strong>, not from Home Screen. Allow microphone and turn on Dictation in Settings → General → Keyboard.
          </p>
        </div>
      )}
      <CaptionArea
        captions={state.captions}
        currentInterim={state.currentInterim}
        onFlagWord={handleFlagWord}
      />
      <ControlBar onEndSession={endSession} connectionStatus={connectionStatus} />
    </div>
  );
}
