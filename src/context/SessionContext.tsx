'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { captionReducer, initialState, type SessionAction } from '@/lib/captionReducer';
import { addEndPunctuation } from '@/lib/punctuation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAudioPipeline } from '@/hooks/useAudioPipeline';
import { useDeepgram } from '@/hooks/useDeepgram';
import { useGapFiller } from '@/hooks/useGapFiller';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import type { SessionState, GapFillerResponse } from '@/types';

function getDeepgramKey(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('deepgram_api_key') ||
    process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ||
    null
  );
}

interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  startSession: () => Promise<void>;
  endSession: () => void;
  isDeepgramActive: boolean;
  giveFeedback: (choice: 'yes' | 'no') => void;
  connectionStatus: ReturnType<typeof useConnectionStatus>;
  gapFillerPaused: boolean;
  timer: string;
  audioError: string | null;
  speechError: string | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const SESSION_STORAGE_KEY = 'livecaptionspro_active';
const SESSION_STALE_MS = 30 * 60 * 1000; // 30 min — avoid treating active sessions as stale on remount (e.g. after 2 min)

export function SessionProvider({ children }: { children: ReactNode }) {
  // Always start with initialState to avoid SSR/client hydration mismatch.
  // Session restore from sessionStorage happens in a useEffect after mount.
  const [state, dispatch] = useReducer(captionReducer, initialState);
  const needsRestoreRef = useRef(false);
  const connectionStatus = useConnectionStatus();
  const timer = useSessionTimer(state.sessionStartTime, state.sessionEndTime);

  // Restore: read sessionStorage first (useLayoutEffect so it runs before any useEffect that might touch storage).
  // This way remounts (e.g. HMR, or when the tree updates after more captions) always get a chance to restore.
  useLayoutEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return;
      const { at } = JSON.parse(raw);
      if (Date.now() - at > SESSION_STALE_MS) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }
      needsRestoreRef.current = true;
    } catch { /* ignore */ }
  }, []);

  // Persist "session active" so a refresh/HMR doesn't drop user back to Start.
  // Only clear on 'ended' — do NOT clear on 'idle', or a remount would wipe storage before restore can read it.
  useEffect(() => {
    if (state.status === 'listening') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ at: Date.now() }));
    } else if (state.status === 'ended') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [state.status]);

  // Track which lineIds we've already sent to gap filler to avoid double-sending
  const submittedLineIds = useRef<Set<string>>(new Set());

  const onGapFillerResult = useCallback((lineId: string, response: GapFillerResponse) => {
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

  const { start: startAudio, stop: stopAudio, error: audioError } = useAudioPipeline();

  const [speechError, setSpeechError] = useState<string | null>(null);
  const lastSpeechErrorRef = useRef<string | null>(null);

  const handleSpeechError = useCallback((err: string | undefined) => {
    const raw = err && String(err).trim();
    if (raw === 'aborted') return;
    const message =
      !raw ? 'Speech recognition unavailable.'
      : raw === 'not-allowed' ? 'Speech recognition not allowed (mic permission or denied).'
      : raw === 'no-speech' ? 'Speech recognition heard no speech.'
      : raw === 'audio-capture' ? 'Speech recognition could not capture audio.'
      : raw === 'network' ? 'Speech recognition failed (network).'
      : raw === 'language-not-supported' ? 'Speech recognition language not supported.'
      : raw;
    lastSpeechErrorRef.current = raw ?? null;
    setSpeechError(message);
  }, []);

  const clearSpeechErrorOnSuccess = useCallback(() => {
    setSpeechError((prev) => (prev ? null : prev));
  }, []);

  const { start: startSTT, stop: stopSTT } = useSpeechRecognition({
    onInterim: (text) => {
      clearSpeechErrorOnSuccess();
      dispatch({ type: 'ADD_INTERIM', payload: text });
    },
    onFinal: (text) => {
      clearSpeechErrorOnSuccess();
      dispatch({ type: 'FINALIZE_LINE', payload: addEndPunctuation(String(text ?? '').trim()) });
    },
    onError: handleSpeechError,
  });

  const { start: startDG, stop: stopDG } = useDeepgram({
    onInterim: (text) => {
      clearSpeechErrorOnSuccess();
      dispatch({ type: 'ADD_INTERIM', payload: text });
    },
    onFinalWords: (words, speakerId) => dispatch({ type: 'FINALIZE_LINE_WITH_WORDS', payload: { words, speakerId } }),
    onError: handleSpeechError,
  });

  // Auto-retry speech once on transient errors so it can recover without user action
  const speechRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!speechError || state.status !== 'listening') return;
    if (lastSpeechErrorRef.current === 'not-allowed') return;
    if (speechRetryTimeoutRef.current) return;
    speechRetryTimeoutRef.current = setTimeout(() => {
      speechRetryTimeoutRef.current = null;
      const dgKey = getDeepgramKey();
      if (dgKey) {
        stopDG();
        setTimeout(() => startDG(dgKey), 400);
      } else {
        stopSTT();
        setTimeout(() => startSTT(), 400);
      }
    }, 2000);
    return () => {
      if (speechRetryTimeoutRef.current) clearTimeout(speechRetryTimeoutRef.current);
    };
  }, [speechError, state.status, startSTT, stopSTT, startDG, stopDG]);

  const isListening = state.status === 'listening';
  useWakeLock(isListening);

  // Auto-restart STT/Deepgram and flush gap filler queue on reconnect
  const prevConnectionStatusRef = useRef(connectionStatus);
  useEffect(() => {
    const prev = prevConnectionStatusRef.current;
    prevConnectionStatusRef.current = connectionStatus;

    if (state.status !== 'listening') return;

    const dgKey = getDeepgramKey();

    if (prev !== 'lost' && connectionStatus === 'lost') {
      if (dgKey) stopDG(); else stopSTT();
    }

    if (prev !== 'connected' && connectionStatus === 'connected') {
      if (dgKey) startDG(dgKey); else startSTT();
      flushQueue();
    }
  }, [connectionStatus, state.status, startSTT, stopSTT, startDG, stopDG, flushQueue]);

  const startSession = useCallback(async () => {
    submittedLineIds.current = new Set();
    setSpeechError(null);
    const dgKey = getDeepgramKey();
    if (dgKey) {
      // Deepgram manages its own mic + audio streaming
      dispatch({ type: 'START_SESSION' });
      startDG(dgKey);
    } else {
      // Web Speech API — needs RNNoise audio pipeline first
      const stream = await startAudio();
      if (!stream) return;
      dispatch({ type: 'START_SESSION' });
      startSTT();
    }
  }, [startAudio, startSTT, startDG]);

  // Re-start audio/STT after session restore (needsRestoreRef set by useLayoutEffect above)
  useEffect(() => {
    if (!needsRestoreRef.current) return;
    needsRestoreRef.current = false;
    dispatch({ type: 'START_SESSION' });
    const dgKey = getDeepgramKey();
    if (dgKey) {
      startDG(dgKey);
    } else {
      startAudio().then((stream) => { if (stream) startSTT(); });
    }
  }, [startAudio, startSTT, startDG]);

  const endSession = useCallback(() => {
    if (getDeepgramKey()) {
      stopDG();
    } else {
      stopSTT();
      stopAudio();
    }
    dispatch({ type: 'END_SESSION' });
  }, [stopSTT, stopAudio, stopDG]);

  const giveFeedback = useCallback((choice: 'yes' | 'no') => {
    dispatch({ type: 'GIVE_FEEDBACK', payload: choice });
  }, []);

  const value: SessionContextValue = {
    state,
    dispatch,
    startSession,
    endSession,
    giveFeedback,
    connectionStatus,
    gapFillerPaused,
    timer,
    audioError,
    speechError,
    isDeepgramActive: !!getDeepgramKey(),
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
