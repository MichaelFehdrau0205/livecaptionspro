import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from './useSpeechRecognition';

// ─── Mock SpeechRecognition ───────────────────────────────────────────────────

function makeMockRecognition() {
  return {
    continuous: false,
    interimResults: false,
    lang: '',
    maxAlternatives: 1,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    onresult: null as ((e: unknown) => void) | null,
    onerror: null as ((e: unknown) => void) | null,
    onend: null as (() => void) | null,
  };
}

type MockRecognition = ReturnType<typeof makeMockRecognition>;

let mockInstance: MockRecognition;
// Must be a regular function (not arrow) so it can be used as a constructor
const MockSpeechRecognition = vi.fn(function () {
  mockInstance = makeMockRecognition();
  return mockInstance;
});

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(window, 'SpeechRecognition', {
    value: MockSpeechRecognition,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'webkitSpeechRecognition', {
    value: undefined,
    writable: true,
    configurable: true,
  });
  MockSpeechRecognition.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fireFinal(text: string, confidence = 0.95) {
  mockInstance.onresult?.({
    resultIndex: 0,
    results: [
      Object.assign([{ transcript: text, confidence }], { isFinal: true, length: 1 }),
    ],
  });
}

function fireInterim(text: string) {
  mockInstance.onresult?.({
    resultIndex: 0,
    results: [
      Object.assign([{ transcript: text, confidence: 0 }], { isFinal: false, length: 1 }),
    ],
  });
}

function fireError(error: string) {
  mockInstance.onerror?.({ error, message: error });
}

function fireEnd() {
  mockInstance.onend?.();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSpeechRecognition', () => {
  it('starts in idle status', () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn() })
    );
    expect(result.current.status).toBe('idle');
  });

  it('sets status to listening when start() is called', () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn() })
    );
    act(() => { result.current.start(); });
    expect(result.current.status).toBe('listening');
    expect(mockInstance.start).toHaveBeenCalledOnce();
  });

  it('calls onFinal when a final result is received', () => {
    const onFinal = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal })
    );
    act(() => { result.current.start(); });
    act(() => { fireFinal('hello world'); });
    expect(onFinal).toHaveBeenCalledWith('hello world.');
  });

  it('calls onInterim when an interim result is received', () => {
    const onInterim = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim, onFinal: vi.fn() })
    );
    act(() => { result.current.start(); });
    act(() => { fireInterim('hel'); });
    expect(onInterim).toHaveBeenCalledWith('hel');
  });

  it('does not call onFinal for interim results', () => {
    const onFinal = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal })
    );
    act(() => { result.current.start(); });
    act(() => { fireInterim('partial'); });
    expect(onFinal).not.toHaveBeenCalled();
  });

  it('auto-restarts on onend while still active (iOS Safari behavior)', () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn() })
    );
    act(() => { result.current.start(); });
    expect(mockInstance.start).toHaveBeenCalledTimes(1);

    act(() => { fireEnd(); });

    // Should restart recognition
    expect(mockInstance.start).toHaveBeenCalledTimes(2);
  });

  it('does not restart on onend after stop() is called', () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn() })
    );
    act(() => { result.current.start(); });
    act(() => { result.current.stop(); });
    act(() => { fireEnd(); });

    // start() called once on start, stop() called once — no second start
    expect(mockInstance.start).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('idle');
  });

  it('sets status to idle after stop()', () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn() })
    );
    act(() => { result.current.start(); });
    expect(result.current.status).toBe('listening');
    act(() => { result.current.stop(); });
    expect(result.current.status).toBe('idle');
    expect(mockInstance.stop).toHaveBeenCalled();
  });

  it('sets status to error and calls onError on not-allowed error', () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn(), onError })
    );
    act(() => { result.current.start(); });
    act(() => { fireError('not-allowed'); });
    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalledWith('not-allowed');
  });

  it('calls onError but does not set error status for non-fatal errors', () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn(), onError })
    );
    act(() => { result.current.start(); });
    act(() => { fireError('network'); });
    // network error should call onError but not permanently kill status
    expect(onError).toHaveBeenCalledWith('network');
    expect(result.current.status).not.toBe('error');
  });

  it('sets status to error when SpeechRecognition is not supported', () => {
    Object.defineProperty(window, 'SpeechRecognition', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn(), onError })
    );
    act(() => { result.current.start(); });
    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalledWith('SpeechRecognition not supported');
  });

  it('falls back to webkitSpeechRecognition when SpeechRecognition is unavailable', () => {
    Object.defineProperty(window, 'SpeechRecognition', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: MockSpeechRecognition,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn() })
    );
    act(() => { result.current.start(); });
    expect(result.current.status).toBe('listening');
    expect(MockSpeechRecognition).toHaveBeenCalled();
  });

  it('configures recognition with continuous and interimResults', () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn() })
    );
    act(() => { result.current.start(); });
    expect(mockInstance.continuous).toBe(true);
    expect(mockInstance.interimResults).toBe(true);
    expect(mockInstance.lang).toBe('en-US');
  });

  it('cleans up recognition on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn() })
    );
    act(() => { result.current.start(); });
    unmount();
    expect(mockInstance.stop).toHaveBeenCalled();
  });

  it('does not start a second instance if already listening', () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ onInterim: vi.fn(), onFinal: vi.fn() })
    );
    act(() => { result.current.start(); });
    act(() => { result.current.start(); }); // second call
    expect(MockSpeechRecognition).toHaveBeenCalledTimes(1);
  });
});
