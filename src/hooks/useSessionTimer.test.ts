import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimer } from './useSessionTimer';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSessionTimer', () => {
  it('returns 00:00:00 when startTime is null', () => {
    const { result } = renderHook(() => useSessionTimer(null));
    expect(result.current).toBe('00:00:00');
  });

  it('returns 00:00:00 immediately after session starts', () => {
    const start = Date.now();
    const { result } = renderHook(() => useSessionTimer(start));
    expect(result.current).toBe('00:00:00');
  });

  it('increments every second', () => {
    const start = Date.now();
    const { result } = renderHook(() => useSessionTimer(start));

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current).toBe('00:00:01');

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current).toBe('00:00:02');
  });

  it('formats seconds correctly', () => {
    const start = Date.now();
    const { result } = renderHook(() => useSessionTimer(start));

    act(() => { vi.advanceTimersByTime(59000); });
    expect(result.current).toBe('00:00:59');
  });

  it('rolls over to minutes correctly', () => {
    const start = Date.now();
    const { result } = renderHook(() => useSessionTimer(start));

    act(() => { vi.advanceTimersByTime(60000); });
    expect(result.current).toBe('00:01:00');
  });

  it('formats minutes and seconds correctly', () => {
    const start = Date.now();
    const { result } = renderHook(() => useSessionTimer(start));

    act(() => { vi.advanceTimersByTime(5 * 60 * 1000 + 30000); }); // 5:30
    expect(result.current).toBe('00:05:30');
  });

  it('rolls over to hours correctly', () => {
    const start = Date.now();
    const { result } = renderHook(() => useSessionTimer(start));

    act(() => { vi.advanceTimersByTime(60 * 60 * 1000); }); // 1 hour
    expect(result.current).toBe('01:00:00');
  });

  it('formats a long session correctly', () => {
    const start = Date.now();
    const { result } = renderHook(() => useSessionTimer(start));

    act(() => { vi.advanceTimersByTime((1 * 3600 + 23 * 60 + 45) * 1000); }); // 1:23:45
    expect(result.current).toBe('01:23:45');
  });

  it('resets to 00:00:00 when startTime becomes null', () => {
    const start = Date.now();
    const { result, rerender } = renderHook(
      ({ startTime }) => useSessionTimer(startTime),
      { initialProps: { startTime: start as number | null } }
    );

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current).toBe('00:00:05');

    rerender({ startTime: null });
    expect(result.current).toBe('00:00:00');
  });

  it('clears the interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useSessionTimer(Date.now()));
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('pads single-digit values with leading zeros', () => {
    const start = Date.now();
    const { result } = renderHook(() => useSessionTimer(start));

    act(() => { vi.advanceTimersByTime(1000); }); // 0:00:01
    expect(result.current).toBe('00:00:01');
  });
});
