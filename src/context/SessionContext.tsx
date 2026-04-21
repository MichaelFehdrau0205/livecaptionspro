'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  useRef,
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
import { DISPLAY_MODE_KEY } from '@/lib/constants';
import type { SessionState, GapFillerResponse, SessionStatus } from '@/types';

function getDeepgramKey(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('deepgram_api_key') ||
    process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ||
    null
  );
}

export type MicStatus = 'READY' | 'LISTENING' | 'WAITING' | 'ERROR';

/** Lecture = single speaker (no 1–4 selector). Group = multi-speaker with selector. */
export type DisplayMode = 'lecture' | 'group';

interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  startSession: () => Promise<void>;
  endSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  restartSession: () => Promise<void>;
  isDeepgramActive: boolean;
  giveFeedback: (choice: 'yes' | 'no') => void;
  connectionStatus: ReturnType<typeof useConnectionStatus>;
  gapFillerPaused: boolean;
  timer: string;
  audioError: string | null;
  speechError: string | null;
  micStatus: MicStatus;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function getInitialState(initialStatus?: SessionStatus): SessionState {
  const base = { ...initialState };
  if (initialStatus != null) {
    base.status = initialStatus;
    base.sessionEndTime = initialStatus === 'ended' ? Date.now() : null;
  }
  return base;
}

export interface SessionProviderProps {
  children: ReactNode;
  /** When 'ended', shows SessionEndScreen immediately (e.g. /end-session page). */
  initialStatus?: SessionStatus;
}

function getStoredDisplayMode(): DisplayMode {
  if (typeof window === 'undefined') return 'lecture';
  try {
    const value = localStorage.getItem(DISPLAY_MODE_KEY);
    if (value === 'lecture' || value === 'group') return value;
  } catch {
    /* ignore */
  }
  return 'lecture';
}

export function SessionProvider({ children, initialStatus }: SessionProviderProps) {
  const [state, dispatch] = useReducer(captionReducer, getInitialState(initialStatus));
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(getStoredDisplayMode);
  const connectionStatus = useConnectionStatus();
  const timer = useSessionTimer(state.sessionStartTime, state.sessionEndTime);
  const acceptRecognitionRef = useRef(false);
  const acceptRecognitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayModeState(mode);
    try {
      localStorage.setItem(DISPLAY_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  // Hide static "Loading…" fallback once app has mounted (Safari + all browsers)
  useEffect(() => {
    document.body.classList.add('app-mounted');
    return () => document.body.classList.remove('app-mounted');
  }, []);

  const blockRecognition = useCallback(() => {
    acceptRecognitionRef.current = false;
    if (acceptRecognitionTimerRef.current) {
      clearTimeout(acceptRecognitionTimerRef.current);
      acceptRecognitionTimerRef.current = null;
    }
  }, []);

  const allowRecognitionSoon = useCallback((delayMs = 250) => {
    if (acceptRecognitionTimerRef.current) clearTimeout(acceptRecognitionTimerRef.current);
    acceptRecognitionTimerRef.current = setTimeout(() => {
      acceptRecognitionRef.current = true;
      acceptRecognitionTimerRef.current = null;
    }, delayMs);
  }, []);

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
      if (!acceptRecognitionRef.current) return;
      clearSpeechErrorOnSuccess();
      dispatch({ type: 'ADD_INTERIM', payload: text });
    },
    onFinal: (text) => {
      if (!acceptRecognitionRef.current) return;
      clearSpeechErrorOnSuccess();
      dispatch({ type: 'FINALIZE_LINE', payload: addEndPunctuation(String(text ?? '').trim()) });
    },
    onError: handleSpeechError,
  });

  const { start: startDG, stop: stopDG } = useDeepgram({
    onInterim: (text) => {
      if (!acceptRecognitionRef.current) return;
      clearSpeechErrorOnSuccess();
      dispatch({ type: 'ADD_INTERIM', payload: text });
    },
    onFinalWords: (words, diarizationSpeakerId) => {
      if (!acceptRecognitionRef.current) return;
      dispatch({ type: 'FINALIZE_LINE_WITH_WORDS', payload: { words, speakerId: diarizationSpeakerId } });
    },
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
    blockRecognition();
    const dgKey = getDeepgramKey();
    if (dgKey) {
      dispatch({ type: 'START_SESSION' });
      startDG(dgKey);
      allowRecognitionSoon();
    } else {
      // Web Speech API: start STT in same user-gesture turn (desktop Chrome requires it).
      // Start session and STT synchronously; init audio pipeline in background (optional for RNNoise).
      dispatch({ type: 'START_SESSION' });
      startSTT();
      allowRecognitionSoon();
      const stream = await startAudio();
      if (!stream) {
        // Mic failed but STT may still work (browser uses its own capture). No need to abort session.
      }
    }
  }, [allowRecognitionSoon, blockRecognition, startAudio, startSTT, startDG]);

  const endSession = useCallback(() => {
    blockRecognition();
    if (getDeepgramKey()) {
      stopDG();
    } else {
      stopSTT();
      stopAudio();
    }
    dispatch({ type: 'END_SESSION' });
  }, [blockRecognition, stopSTT, stopAudio, stopDG]);

  const pauseSession = useCallback(() => {
    if (state.status !== 'listening') return;
    blockRecognition();
    if (getDeepgramKey()) { stopDG(); } else { stopSTT(); }
    dispatch({ type: 'PAUSE_SESSION' });
  }, [blockRecognition, state.status, stopDG, stopSTT]);

  const resumeSession = useCallback(() => {
    if (state.status !== 'paused') return;
    const dgKey = getDeepgramKey();
    dispatch({ type: 'SET_STATUS', payload: 'listening' });
    blockRecognition();
    if (dgKey) {
      startDG(dgKey);
    } else {
      startSTT();
    }
    allowRecognitionSoon();
  }, [allowRecognitionSoon, blockRecognition, state.status, startDG, startSTT]);

  // Clears captions and restarts transcription — used when switching display modes
  const restartSession = useCallback(async () => {
    if (state.status !== 'listening') return;
    blockRecognition();
    const dgKey = getDeepgramKey();
    if (dgKey) {
      stopDG();
    } else {
      stopSTT();
      stopAudio();
    }
    submittedLineIds.current = new Set();
    setSpeechError(null);
    dispatch({ type: 'START_SESSION' });
    if (dgKey) {
      startDG(dgKey);
      allowRecognitionSoon();
    } else {
      const stream = await startAudio();
      if (!stream) return;
      startSTT();
      allowRecognitionSoon();
    }
  }, [allowRecognitionSoon, blockRecognition, state.status, stopDG, stopSTT, stopAudio, startDG, startSTT, startAudio]);

  const giveFeedback = useCallback((choice: 'yes' | 'no') => {
    dispatch({ type: 'GIVE_FEEDBACK', payload: choice });
  }, []);

  useEffect(() => {
    return () => {
      if (acceptRecognitionTimerRef.current) clearTimeout(acceptRecognitionTimerRef.current);
    };
  }, []);

  const micStatus: MicStatus =
    state.status === 'idle' || state.status === 'ended' ? 'READY'
    : state.status === 'listening' && connectionStatus === 'connected' && !speechError ? 'LISTENING'
    : state.status === 'listening' && connectionStatus === 'reconnecting' ? 'WAITING'
    : state.status === 'listening' && connectionStatus === 'lost' ? 'WAITING'
    : speechError || connectionStatus === 'lost' ? 'ERROR'
    : 'WAITING';

  const value: SessionContextValue = {
    state,
    dispatch,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    restartSession,
    giveFeedback,
    connectionStatus,
    gapFillerPaused,
    timer,
    audioError,
    speechError,
    isDeepgramActive: !!getDeepgramKey(),
    micStatus,
    displayMode,
    setDisplayMode,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
