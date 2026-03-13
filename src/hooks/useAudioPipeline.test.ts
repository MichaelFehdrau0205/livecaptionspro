import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioPipeline } from './useAudioPipeline';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockTrackStop = vi.fn();
const mockStream = {
  getTracks: () => [{ stop: mockTrackStop }],
} as unknown as MediaStream;

const mockSourceDisconnect = vi.fn();
const mockSourceConnect = vi.fn();
const mockSource = { disconnect: mockSourceDisconnect, connect: mockSourceConnect };

const mockWorkletAddModule = vi.fn().mockResolvedValue(undefined);
const mockAudioWorkletNode = vi.fn();

const mockContextClose = vi.fn().mockResolvedValue(undefined);
const mockCreateMediaStreamSource = vi.fn().mockReturnValue(mockSource);

function makeMockAudioContext(state: AudioContextState = 'running') {
  return {
    state,
    resume: vi.fn().mockResolvedValue(undefined),
    close: mockContextClose,
    createMediaStreamSource: mockCreateMediaStreamSource,
    audioWorklet: { addModule: mockWorkletAddModule },
  };
}

let MockAudioContext: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();

  // Secure context so the pipeline does not short-circuit with HTTPS error (e.g. in jsdom)
  Object.defineProperty(window, 'isSecureContext', { value: true, writable: true, configurable: true });

  // Must be a regular function (not arrow) so it can be used as a constructor
  MockAudioContext = vi.fn(function () { return makeMockAudioContext(); });

  Object.defineProperty(window, 'AudioContext', {
    value: MockAudioContext,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'AudioWorkletNode', {
    value: mockAudioWorkletNode,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAudioPipeline', () => {
  it('starts in idle status with no error', () => {
    const { result } = renderHook(() => useAudioPipeline());
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('calls getUserMedia with audio constraints on start()', async () => {
    const { result } = renderHook(() => useAudioPipeline());
    await act(async () => { await result.current.start(); });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: expect.objectContaining({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }),
    });
  });

  it('sets status to active after successful start()', async () => {
    const { result } = renderHook(() => useAudioPipeline());
    await act(async () => { await result.current.start(); });
    expect(result.current.status).toBe('active');
  });

  it('returns the media stream on success', async () => {
    const { result } = renderHook(() => useAudioPipeline());
    let stream: MediaStream | null = null;
    await act(async () => { stream = await result.current.start(); });
    expect(stream).toBe(mockStream);
  });

  it('creates AudioContext and connects source on start()', async () => {
    const { result } = renderHook(() => useAudioPipeline());
    await act(async () => { await result.current.start(); });
    expect(MockAudioContext).toHaveBeenCalledOnce();
    expect(mockCreateMediaStreamSource).toHaveBeenCalledWith(mockStream);
  });

  it('resumes AudioContext if it starts in suspended state', async () => {
    const suspendedCtx = makeMockAudioContext('suspended');
    MockAudioContext.mockImplementationOnce(function () { return suspendedCtx; });

    const { result } = renderHook(() => useAudioPipeline());
    await act(async () => { await result.current.start(); });

    expect(suspendedCtx.resume).toHaveBeenCalled();
  });

  it('does not call resume if AudioContext is already running', async () => {
    const runningCtx = makeMockAudioContext('running');
    MockAudioContext.mockImplementationOnce(function () { return runningCtx; });

    const { result } = renderHook(() => useAudioPipeline());
    await act(async () => { await result.current.start(); });

    expect(runningCtx.resume).not.toHaveBeenCalled();
  });

  it('sets status to error and returns null when getUserMedia is denied', async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Permission denied'));

    const { result } = renderHook(() => useAudioPipeline());
    let stream: MediaStream | null = null;
    await act(async () => { stream = await result.current.start(); });

    expect(stream).toBeNull();
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Permission denied');
  });

  it('sets a generic error message when error has no message', async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce('denied');

    const { result } = renderHook(() => useAudioPipeline());
    await act(async () => { await result.current.start(); });

    expect(result.current.error).toBe('Microphone access denied');
  });

  it('still returns stream and sets active status if AudioWorklet fails to load', async () => {
    mockWorkletAddModule.mockRejectedValueOnce(new Error('worklet not found'));

    const { result } = renderHook(() => useAudioPipeline());
    let stream: MediaStream | null = null;
    await act(async () => { stream = await result.current.start(); });

    // Graceful fallback — still active
    expect(stream).toBe(mockStream);
    expect(result.current.status).toBe('active');
    expect(result.current.error).toBeNull();
  });

  it('stops all tracks and closes AudioContext on stop()', async () => {
    const { result } = renderHook(() => useAudioPipeline());
    await act(async () => { await result.current.start(); });
    act(() => { result.current.stop(); });

    expect(mockTrackStop).toHaveBeenCalled();
    expect(mockSourceDisconnect).toHaveBeenCalled();
    expect(mockContextClose).toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('sets status back to idle after stop()', async () => {
    const { result } = renderHook(() => useAudioPipeline());
    await act(async () => { await result.current.start(); });
    expect(result.current.status).toBe('active');
    act(() => { result.current.stop(); });
    expect(result.current.status).toBe('idle');
  });
});
