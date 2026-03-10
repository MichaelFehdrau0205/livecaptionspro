'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { captionReducer, initialState, type SessionAction } from '@/lib/captionReducer';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAudioPipeline } from '@/hooks/useAudioPipeline';
import { useGapFiller } from '@/hooks/useGapFiller';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import type { SessionState, GapFillerResponse } from '@/types';

interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  startSession: () => Promise<void>;
  endSession: () => void;
  connectionStatus: ReturnType<typeof useConnectionStatus>;
  gapFillerPaused: boolean;
  timer: string;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(captionReducer, initialState);
  const connectionStatus = useConnectionStatus();
  const timer = useSessionTimer(state.sessionStartTime);

  // Track which lineIds we've already sent to gap filler to avoid double-sending
  const submittedLineIds = useRef<Set<string>>(new Set());

  const onGapFillerResult = useCallback((lineId: string, response: GapFillerResponse) => {
    console.log('[gap-filler] lineId:', lineId, 'correctedSentence:', response.correctedSentence);
    console.log('[gap-filler] words:', JSON.stringify(response.words));
    const words = response.words.map((w) => ({ ...w, flagged: false }));
    dispatch({
      type: 'APPLY_GAP_FILLER',
      payload: { lineId, words },
    });
  }, []);

  const { fill: fillGap, paused: gapFillerPaused, flushQueue } = useGapFiller({ onResult: onGapFillerResult });

  // Watch for new finalized lines and send them to gap filler
  useEffect(() => {
    if (state.status !== 'listening' && state.status !== 'paused') return;
    state.captions.forEach((line) => {
      if (line.isFinalized && !line.gapFillerApplied && !submittedLineIds.current.has(line.id)) {
        submittedLineIds.current.add(line.id);
        const sentence = line.words.map((w) => w.text).join(' ');
        fillGap(line.id, sentence);
      }
    });
  }, [state.captions, state.status, fillGap]);

  const { start: startAudio, stop: stopAudio } = useAudioPipeline();

  const { start: startSTT, stop: stopSTT } = useSpeechRecognition({
    onInterim: (text) => dispatch({ type: 'ADD_INTERIM', payload: text }),
    onFinal: (text) => dispatch({ type: 'FINALIZE_LINE', payload: text }),
  });

  const isListening = state.status === 'listening';
  useWakeLock(isListening);

  // Auto-restart STT and flush gap filler queue on reconnect
  const prevConnectionStatusRef = useRef(connectionStatus);
  useEffect(() => {
    const prev = prevConnectionStatusRef.current;
    prevConnectionStatusRef.current = connectionStatus;

    if (state.status !== 'listening') return;

    if (prev !== 'lost' && connectionStatus === 'lost') {
      stopSTT();
    }

    if (prev !== 'connected' && connectionStatus === 'connected') {
      startSTT();
      flushQueue();
    }
  }, [connectionStatus, state.status, startSTT, stopSTT, flushQueue]);

  const startSession = useCallback(async () => {
    submittedLineIds.current = new Set();
    dispatch({ type: 'START_SESSION' });
    await startAudio();
    startSTT();
  }, [startAudio, startSTT]);

  const endSession = useCallback(() => {
    stopSTT();
    stopAudio();
    dispatch({ type: 'END_SESSION' });
  }, [stopSTT, stopAudio]);

  const value: SessionContextValue = {
    state,
    dispatch,
    startSession,
    endSession,
    connectionStatus,
    gapFillerPaused,
    timer,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
