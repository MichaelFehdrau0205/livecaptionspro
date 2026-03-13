'use client';

import { useCallback, useRef, useState } from 'react';

type AudioPipelineStatus = 'idle' | 'initializing' | 'active' | 'error';

/**
 * Manages getUserMedia → AudioContext → (optional RNNoise AudioWorklet) pipeline.
 * AudioContext is created on first user gesture to comply with iOS Safari policy.
 */
export function useAudioPipeline() {
  const [status, setStatus] = useState<AudioPipelineStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const start = useCallback(async (): Promise<MediaStream | null> => {
    setStatus('initializing');
    setError(null);

    // iOS Safari (and all browsers) require HTTPS for getUserMedia and speech recognition
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('Microphone requires HTTPS. On iPhone, use the production URL in Safari (not http:// or a local address).');
      setStatus('error');
      return null;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Microphone not supported in this browser. Use a modern browser on a secure connection.');
      setStatus('error');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Create AudioContext on user gesture (required by iOS Safari)
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      // Resume if suspended (iOS quirk)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Create source node — attach worklet if RNNoise is available
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Attempt to load RNNoise AudioWorklet (gracefully skipped if unavailable)
      try {
        // type: 'module' is supported at runtime; TS lib WorkletOptions doesn't include it yet
        await ctx.audioWorklet.addModule('/audio-processor.js', { type: 'module' } as WorkletOptions);
        const workletNode = new AudioWorkletNode(ctx, 'rnnoise-processor');
        source.connect(workletNode);
        // workletNode output is consumed by the worklet itself; Web Speech API
        // uses the raw stream, so noise suppression is additive via browser echoCancellation.
      } catch {
        // RNNoise worklet not available — proceed with browser noise suppression only
      }

      setStatus('active');
      return stream;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied';
      setError(msg);
      setStatus('error');
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setStatus('idle');
  }, []);

  return { status, error, start, stop };
}
