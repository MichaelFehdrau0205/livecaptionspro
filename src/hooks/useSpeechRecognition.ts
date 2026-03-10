'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SILENCE_RESTART_MS } from '@/lib/constants';

interface SpeechRecognitionCallbacks {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (error: string) => void;
}

type SpeechRecognitionStatus = 'idle' | 'listening' | 'error';

// Minimal types for cross-browser SpeechRecognition
interface ISpeechAlt {
  transcript: string;
  confidence: number;
}

interface ISpeechResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: ISpeechAlt;
}

interface ISpeechResultList {
  readonly length: number;
  readonly resultIndex: number;
  results: ISpeechResult[];
  [index: number]: ISpeechResult;
}

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ISpeechResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

function getSpeechRecognitionCtor(): ISpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as { SpeechRecognition?: ISpeechRecognitionConstructor }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: ISpeechRecognitionConstructor }).webkitSpeechRecognition ||
    null
  );
}

export function useSpeechRecognition(callbacks: SpeechRecognitionCallbacks) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const activeRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacksRef = useRef(callbacks);
  useEffect(() => { callbacksRef.current = callbacks; }, [callbacks]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (activeRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    }, SILENCE_RESTART_MS);
  }, []);

  const createRecognition = useCallback((): ISpeechRecognition | null => {
    const SR = getSpeechRecognitionCtor();
    if (!SR) return null;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      resetSilenceTimer();
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          callbacksRef.current.onFinal(result[0].transcript);
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      if (interimTranscript) {
        callbacksRef.current.onInterim(interimTranscript);
      }
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      callbacksRef.current.onError?.(event.error);
      if (event.error === 'not-allowed') {
        setStatus('error');
        activeRef.current = false;
      }
    };

    recognition.onend = () => {
      // Auto-restart if still active (iOS Safari stops after silence)
      if (activeRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore if already starting
        }
      } else {
        setStatus('idle');
      }
    };

    return recognition;
  }, [resetSilenceTimer]);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setStatus('listening');

    const recognition = createRecognition();
    if (!recognition) {
      setStatus('error');
      callbacksRef.current.onError?.('SpeechRecognition not supported');
      return;
    }
    recognitionRef.current = recognition;
    try {
      recognition.start();
      resetSilenceTimer();
    } catch (err) {
      callbacksRef.current.onError?.(String(err));
    }
  }, [createRecognition, resetSilenceTimer]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  return { status, start, stop };
}
