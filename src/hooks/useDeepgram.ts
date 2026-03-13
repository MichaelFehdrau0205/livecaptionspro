'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CaptionWord } from '@/types';
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM, MAX_WORDS_PER_LINE } from '@/lib/constants';

export type DeepgramStatus = 'idle' | 'connecting' | 'listening' | 'error';

export interface DeepgramCallbacks {
  onInterim: (text: string) => void;
  onFinalWords: (words: CaptionWord[], speakerId: number) => void;
  onError?: (err: string) => void;
}

const PCM_WORKLET = '/deepgram-pcm-processor.js';

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
  speaker?: number;
}

function groupBySpeaker(words: DeepgramWord[]): Array<{ speakerId: number; words: DeepgramWord[] }> {
  if (!words.length) return [];
  const groups: Array<{ speakerId: number; words: DeepgramWord[] }> = [];
  let currentSpeaker = words[0].speaker ?? 0;
  let current: DeepgramWord[] = [];
  for (const word of words) {
    const speaker = word.speaker ?? 0;
    if (speaker !== currentSpeaker) {
      groups.push({ speakerId: currentSpeaker, words: current });
      current = [];
      currentSpeaker = speaker;
    }
    current.push(word);
  }
  if (current.length) groups.push({ speakerId: currentSpeaker, words: current });
  return groups;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

interface DeepgramResponse {
  is_final: boolean;
  speech_final?: boolean;
  channel: {
    alternatives: Array<{
      transcript: string;
      confidence: number;
      words: DeepgramWord[];
    }>;
  };
}

function float32ToInt16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

function mapWord(dg: DeepgramWord): CaptionWord {
  const conf = dg.confidence ?? 0;
  let type: CaptionWord['type'];
  if (conf >= CONFIDENCE_HIGH) type = 'confirmed';
  else if (conf >= CONFIDENCE_MEDIUM) type = 'uncertain';
  else type = 'predicted';
  return { text: dg.punctuated_word ?? dg.word, type, confidence: conf, flagged: false };
}

export function useDeepgram(callbacks: DeepgramCallbacks) {
  const [status, setStatus] = useState<DeepgramStatus>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const activeRef = useRef(false);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const stop = useCallback(() => {
    activeRef.current = false;

    workletRef.current?.disconnect();
    workletRef.current = null;

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try { wsRef.current.send(JSON.stringify({ type: 'CloseStream' })); } catch { /* ignore */ }
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('idle');
  }, []);

  const start = useCallback(async (apiKey: string) => {
    if (activeRef.current) return;
    activeRef.current = true;
    setStatus('connecting');

    // 1. Request mic within user gesture chain so browser shows permission dialog
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      callbacksRef.current.onError?.('Microphone access denied');
      setStatus('error');
      activeRef.current = false;
      return;
    }
    streamRef.current = stream;

    // 2. Create AudioContext now to read the actual device sample rate
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    const params = new URLSearchParams({
      model: 'nova-3',
      encoding: 'linear16',
      sample_rate: String(ctx.sampleRate),
      channels: '1',
      interim_results: 'true',
      punctuate: 'true',
      smart_format: 'true',
      language: 'en-US',
      diarize: 'true',
    });

    const ws = new WebSocket(
      `wss://api.deepgram.com/v1/listen?${params}`,
      ['token', apiKey]
    );
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = async () => {
      if (!activeRef.current) { ws.close(); return; }

      try {
        await ctx.audioWorklet.addModule(PCM_WORKLET, { type: 'module' } as WorkletOptions);
      } catch (err) {
        callbacksRef.current.onError?.('Failed to load audio processor');
        setStatus('error');
        activeRef.current = false;
        ws.close();
        return;
      }

      const source = ctx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(ctx, 'deepgram-pcm-processor');
      workletRef.current = worklet;

      worklet.port.onmessage = (e) => {
        if (!activeRef.current || ws.readyState !== WebSocket.OPEN) return;
        const int16 = float32ToInt16(e.data as Float32Array);
        ws.send(int16.buffer);
      };

      source.connect(worklet);
      worklet.connect(ctx.destination);

      setStatus('listening');
    };

    ws.onmessage = (event) => {
      if (!activeRef.current) return;
      try {
        const data: DeepgramResponse = JSON.parse(event.data as string);
        const alt = data.channel?.alternatives?.[0];
        if (!alt) return;

        const transcript = alt.transcript?.trim();
        if (!transcript) return;

        if (data.is_final) {
          const rawWords = alt.words ?? [];
          if (!rawWords.length) return;
          // Group by speaker, then chunk long runs into MAX_WORDS_PER_LINE lines
          for (const group of groupBySpeaker(rawWords)) {
            for (const chunk of chunkArray(group.words.map(mapWord), MAX_WORDS_PER_LINE)) {
              callbacksRef.current.onFinalWords(chunk, group.speakerId);
            }
          }
        } else {
          callbacksRef.current.onInterim(transcript);
        }
      } catch {
        // ignore parse errors (metadata frames etc.)
      }
    };

    ws.onerror = () => {
      if (!activeRef.current) return;
      callbacksRef.current.onError?.('Deepgram connection error');
      setStatus('error');
    };

    ws.onclose = (e) => {
      if (!activeRef.current) return;
      if (e.code !== 1000 && e.code !== 1001) {
        callbacksRef.current.onError?.(`Deepgram disconnected (${e.code})`);
        setStatus('error');
      }
    };
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { status, start, stop };
}
