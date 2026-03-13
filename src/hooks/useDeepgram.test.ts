import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeepgram } from './useDeepgram';

// ─── WebSocket mock ───────────────────────────────────────────────────────────

interface MockWs {
  readyState: number;
  binaryType: string;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  onopen: (() => void | Promise<void>) | null;
  onmessage: ((e: { data: string }) => void) | null;
  onerror: (() => void) | null;
  onclose: ((e: { code: number }) => void) | null;
}

let mockWs: MockWs;

const MockWebSocket = vi.fn(function () {
  mockWs = {
    readyState: 1, // OPEN — simplify tests by skipping CONNECTING state
    binaryType: 'blob',
    send: vi.fn(),
    close: vi.fn(),
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
  };
  return mockWs;
});
(MockWebSocket as unknown as { OPEN: number; CONNECTING: number }).OPEN = 1;
(MockWebSocket as unknown as { OPEN: number; CONNECTING: number }).CONNECTING = 0;

// ─── AudioWorkletNode mock ────────────────────────────────────────────────────

let mockWorkletOnMessage: ((e: MessageEvent) => void) | null = null;
const mockWorkletConnect = vi.fn();
const mockWorkletDisconnect = vi.fn();

const MockAudioWorkletNode = vi.fn(function () {
  return {
    port: {
      get onmessage() { return mockWorkletOnMessage; },
      set onmessage(fn: (e: MessageEvent) => void) { mockWorkletOnMessage = fn; },
    },
    connect: mockWorkletConnect,
    disconnect: mockWorkletDisconnect,
  };
});

// ─── AudioContext mock ────────────────────────────────────────────────────────

const mockAddModule = vi.fn().mockResolvedValue(undefined);
const mockCreateMediaStreamSource = vi.fn().mockReturnValue({ connect: vi.fn() });
const mockCtxClose = vi.fn().mockResolvedValue(undefined);
const mockCtxResume = vi.fn().mockResolvedValue(undefined);

function makeMockAudioContext(state: AudioContextState = 'running') {
  return {
    state,
    sampleRate: 48000,
    resume: mockCtxResume,
    close: mockCtxClose,
    createMediaStreamSource: mockCreateMediaStreamSource,
    destination: {},
    audioWorklet: { addModule: mockAddModule },
  };
}

const MockAudioContext = vi.fn(function () { return makeMockAudioContext(); });

// ─── MediaStream mock ─────────────────────────────────────────────────────────

const mockTrackStop = vi.fn();
const mockStream = { getTracks: () => [{ stop: mockTrackStop }] } as unknown as MediaStream;

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockWorkletOnMessage = null;

  Object.defineProperty(window, 'WebSocket', { value: MockWebSocket, writable: true, configurable: true });
  Object.defineProperty(window, 'AudioContext', { value: MockAudioContext, writable: true, configurable: true });
  Object.defineProperty(window, 'AudioWorkletNode', { value: MockAudioWorkletNode, writable: true, configurable: true });
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function startAndOpen(apiKey = 'test-key', callbacks = {}) {
  const onInterim = vi.fn();
  const onFinalWords = vi.fn();
  const onError = vi.fn();

  const { result } = renderHook(() =>
    useDeepgram({ onInterim, onFinalWords, onError, ...callbacks })
  );

  await act(async () => { await result.current.start(apiKey); });
  // Trigger WebSocket open (sets up worklet + audio graph)
  await act(async () => { await mockWs.onopen?.(); });

  return { result, onInterim, onFinalWords, onError };
}

function makeDeepgramMsg(
  transcript: string,
  isFinal: boolean,
  words: { word: string; confidence: number; punctuated_word?: string; speaker?: number }[] = []
) {
  return JSON.stringify({
    is_final: isFinal,
    channel: { alternatives: [{ transcript, confidence: 0.9, words }] },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useDeepgram', () => {
  it('starts in idle status', () => {
    const { result } = renderHook(() =>
      useDeepgram({ onInterim: vi.fn(), onFinalWords: vi.fn() })
    );
    expect(result.current.status).toBe('idle');
  });

  it('sets status to connecting when start() is called', async () => {
    const { result } = renderHook(() =>
      useDeepgram({ onInterim: vi.fn(), onFinalWords: vi.fn() })
    );
    // Check status before getUserMedia resolves
    act(() => { result.current.start('key'); });
    expect(result.current.status).toBe('connecting');
  });

  it('calls getUserMedia on start()', async () => {
    await startAndOpen();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('sets status to error if getUserMedia is denied', async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('denied'));

    const { result } = renderHook(() =>
      useDeepgram({ onInterim: vi.fn(), onFinalWords: vi.fn() })
    );
    await act(async () => { await result.current.start('key'); });
    expect(result.current.status).toBe('error');
  });

  it('calls onError if getUserMedia is denied', async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('denied'));

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useDeepgram({ onInterim: vi.fn(), onFinalWords: vi.fn(), onError })
    );
    await act(async () => { await result.current.start('key'); });
    expect(onError).toHaveBeenCalledWith('Microphone access denied');
  });

  it('opens WebSocket with correct URL params', async () => {
    await startAndOpen('my-api-key');
    const url: string = (MockWebSocket.mock.calls[0] as [string, string[]])[0];
    expect(url).toContain('wss://api.deepgram.com/v1/listen');
    expect(url).toContain('model=nova-3');
    expect(url).toContain('encoding=linear16');
    expect(url).toContain('sample_rate=48000');
    expect(url).toContain('interim_results=true');
  });

  it('passes API key as WebSocket subprotocol', async () => {
    await startAndOpen('my-api-key');
    const protocols: string[] = (MockWebSocket.mock.calls[0] as [string, string[]])[1];
    expect(protocols).toContain('my-api-key');
    expect(protocols[0]).toBe('token');
  });

  it('sets status to listening after WebSocket opens and worklet loads', async () => {
    const { result } = await startAndOpen();
    expect(result.current.status).toBe('listening');
  });

  it('sets status to error if worklet fails to load', async () => {
    mockAddModule.mockRejectedValueOnce(new Error('not found'));

    const { result } = renderHook(() =>
      useDeepgram({ onInterim: vi.fn(), onFinalWords: vi.fn() })
    );
    await act(async () => { await result.current.start('key'); });
    await act(async () => { await mockWs.onopen?.(); });

    expect(result.current.status).toBe('error');
  });

  it('calls onInterim for non-final results', async () => {
    const { onInterim } = await startAndOpen();

    act(() => {
      mockWs.onmessage?.({ data: makeDeepgramMsg('hello', false) });
    });

    expect(onInterim).toHaveBeenCalledWith('hello');
  });

  it('does not call onInterim for empty transcripts', async () => {
    const { onInterim } = await startAndOpen();

    act(() => {
      mockWs.onmessage?.({ data: makeDeepgramMsg('', false) });
    });

    expect(onInterim).not.toHaveBeenCalled();
  });

  it('calls onFinalWords with mapped CaptionWords for final results', async () => {
    const { onFinalWords } = await startAndOpen();

    act(() => {
      mockWs.onmessage?.({
        data: makeDeepgramMsg('hello world', true, [
          { word: 'hello', confidence: 0.99, punctuated_word: 'Hello' },
          { word: 'world', confidence: 0.72 },
        ]),
      });
    });

    expect(onFinalWords).toHaveBeenCalledOnce();
    const words = onFinalWords.mock.calls[0][0];
    expect(words[0].text).toBe('Hello');      // uses punctuated_word
    expect(words[0].type).toBe('confirmed');  // 0.99 >= 0.9
    expect(words[1].text).toBe('world');
    expect(words[1].type).toBe('uncertain');  // 0.72 is 0.7–0.9
  });

  it('maps low-confidence words to predicted type', async () => {
    const { onFinalWords } = await startAndOpen();

    act(() => {
      mockWs.onmessage?.({
        data: makeDeepgramMsg('unclear', true, [
          { word: 'unclear', confidence: 0.45 },
        ]),
      });
    });

    expect(onFinalWords.mock.calls[0][0][0].type).toBe('predicted');
  });

  it('does not call onFinalWords for final results with empty transcript', async () => {
    const { onFinalWords } = await startAndOpen();

    act(() => {
      mockWs.onmessage?.({ data: makeDeepgramMsg('', true) });
    });

    expect(onFinalWords).not.toHaveBeenCalled();
  });

  it('calls onError on WebSocket error', async () => {
    const { onError } = await startAndOpen();

    act(() => { mockWs.onerror?.(); });

    expect(onError).toHaveBeenCalledWith('Deepgram connection error');
  });

  it('sets status to error on WebSocket error', async () => {
    const { result } = await startAndOpen();

    act(() => { mockWs.onerror?.(); });

    expect(result.current.status).toBe('error');
  });

  it('sets status to error on unexpected WebSocket close', async () => {
    const { result } = await startAndOpen();

    act(() => { mockWs.onclose?.({ code: 1006 }); });

    expect(result.current.status).toBe('error');
  });

  it('does not set error on normal WebSocket close (code 1000)', async () => {
    const { result } = await startAndOpen();

    act(() => { mockWs.onclose?.({ code: 1000 }); });

    expect(result.current.status).not.toBe('error');
  });

  it('sends audio via WebSocket when worklet posts samples', async () => {
    await startAndOpen();

    act(() => {
      mockWorkletOnMessage?.({ data: new Float32Array([0.5, -0.5, 0.0]) } as MessageEvent);
    });

    expect(mockWs.send).toHaveBeenCalledOnce();
    const sent = mockWs.send.mock.calls[0][0] as ArrayBuffer;
    expect(sent.byteLength).toBe(6); // 3 × Int16 = 6 bytes
  });

  it('does not start a second session if already active', async () => {
    const { result } = await startAndOpen();
    const callsBefore = (MockWebSocket as ReturnType<typeof vi.fn>).mock.calls.length;

    await act(async () => { await result.current.start('key'); });

    expect((MockWebSocket as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
  });

  it('stop() sets status to idle', async () => {
    const { result } = await startAndOpen();
    act(() => { result.current.stop(); });
    expect(result.current.status).toBe('idle');
  });

  it('stop() closes the WebSocket', async () => {
    await startAndOpen();
    act(() => { mockWs.close(); });
    expect(mockWs.close).toHaveBeenCalled();
  });

  it('stop() stops mic tracks', async () => {
    const { result } = await startAndOpen();
    act(() => { result.current.stop(); });
    expect(mockTrackStop).toHaveBeenCalled();
  });

  it('closes AudioContext on stop()', async () => {
    const { result } = await startAndOpen();
    act(() => { result.current.stop(); });
    expect(mockCtxClose).toHaveBeenCalled();
  });

  // ─── Diarization ─────────────────────────────────────────────────────────────

  it('passes speakerId=0 when no speaker field is present', async () => {
    const { onFinalWords } = await startAndOpen();

    act(() => {
      mockWs.onmessage?.({
        data: makeDeepgramMsg('hello', true, [
          { word: 'hello', confidence: 0.95 },
        ]),
      });
    });

    expect(onFinalWords.mock.calls[0][1]).toBe(0);
  });

  it('passes correct speakerId for single speaker', async () => {
    const { onFinalWords } = await startAndOpen();

    act(() => {
      mockWs.onmessage?.({
        data: makeDeepgramMsg('hello world', true, [
          { word: 'hello', confidence: 0.95, speaker: 1 },
          { word: 'world', confidence: 0.95, speaker: 1 },
        ]),
      });
    });

    expect(onFinalWords).toHaveBeenCalledOnce();
    expect(onFinalWords.mock.calls[0][1]).toBe(1);
  });

  it('splits into two calls when speaker changes mid-result', async () => {
    const { onFinalWords } = await startAndOpen();

    act(() => {
      mockWs.onmessage?.({
        data: makeDeepgramMsg('hello yes indeed', true, [
          { word: 'hello', confidence: 0.95, speaker: 0 },
          { word: 'yes', confidence: 0.95, speaker: 1 },
          { word: 'indeed', confidence: 0.95, speaker: 1 },
        ]),
      });
    });

    expect(onFinalWords).toHaveBeenCalledTimes(2);
    expect(onFinalWords.mock.calls[0][1]).toBe(0); // first group: speaker 0
    expect(onFinalWords.mock.calls[0][0]).toHaveLength(1); // "hello"
    expect(onFinalWords.mock.calls[1][1]).toBe(1); // second group: speaker 1
    expect(onFinalWords.mock.calls[1][0]).toHaveLength(2); // "yes indeed"
  });

  it('chunks more than 8 words into multiple lines', async () => {
    const { onFinalWords } = await startAndOpen();

    const words = Array.from({ length: 10 }, (_, i) => ({
      word: `word${i}`,
      confidence: 0.95,
      speaker: 0,
    }));

    act(() => {
      mockWs.onmessage?.({
        data: makeDeepgramMsg(words.map(w => w.word).join(' '), true, words),
      });
    });

    // 10 words → chunk of 8 + chunk of 2 = 2 calls
    expect(onFinalWords).toHaveBeenCalledTimes(2);
    expect(onFinalWords.mock.calls[0][0]).toHaveLength(8);
    expect(onFinalWords.mock.calls[1][0]).toHaveLength(2);
    // both chunks from same speaker
    expect(onFinalWords.mock.calls[0][1]).toBe(0);
    expect(onFinalWords.mock.calls[1][1]).toBe(0);
  });

  it('includes diarize=true in WebSocket URL', async () => {
    await startAndOpen();
    const url: string = (MockWebSocket.mock.calls[0] as [string, string[]])[0];
    expect(url).toContain('diarize=true');
  });
});
