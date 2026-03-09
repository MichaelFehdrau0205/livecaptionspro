'use client';

import { useSession } from '@/context/SessionContext';
import { StatusBar } from './StatusBar';
import { CaptionArea } from './CaptionArea';
import { ControlBar } from './ControlBar';
import { ConnectionBanner } from './ConnectionBanner';

export function SessionScreen() {
  const { state, dispatch, endSession, connectionStatus, gapFillerPaused, timer } = useSession();

  function handleFlagWord(lineId: string, wordIndex: number) {
    dispatch({ type: 'FLAG_WORD', payload: { lineId, wordIndex } });
  }

  return (
    <div className="flex flex-col h-screen bg-[#1a1a2e] text-white">
      <StatusBar
        connectionStatus={connectionStatus}
        timer={timer}
        gapFillerPaused={gapFillerPaused}
      />
      <ConnectionBanner status={connectionStatus} />
      <CaptionArea
        captions={state.captions}
        currentInterim={state.currentInterim}
        onFlagWord={handleFlagWord}
      />
      <ControlBar onEndSession={endSession} connectionStatus={connectionStatus} />
    </div>
  );
}
