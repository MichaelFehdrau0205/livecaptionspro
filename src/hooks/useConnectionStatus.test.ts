import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnectionStatus } from './useConnectionStatus';
import { RECONNECT_INTERVAL_MS } from '@/lib/constants';

describe('useConnectionStatus', () => {
  let listeners: Record<string, Array<() => void>>;

  beforeEach(() => {
    vi.useFakeTimers();
    listeners = { online: [], offline: [] };

    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    vi.spyOn(window, 'addEventListener').mockImplementation(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === 'online' || event === 'offline') {
          listeners[event].push(handler as () => void);
        }
      }
    );

    vi.spyOn(window, 'removeEventListener').mockImplementation(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === 'online' || event === 'offline') {
          listeners[event] = listeners[event].filter((h) => h !== handler);
        }
      }
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function fireEvent(name: 'online' | 'offline') {
    listeners[name].forEach((fn) => fn());
  }

  it('returns connected when navigator.onLine is true', () => {
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe('connected');
  });

  it('returns reconnecting when navigator.onLine is false initially', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe('reconnecting');
  });

  it('transitions to lost on offline event', () => {
    const { result } = renderHook(() => useConnectionStatus());

    act(() => {
      fireEvent('offline');
    });

    expect(result.current).toBe('lost');
  });

  it('transitions from lost to reconnecting after RECONNECT_INTERVAL_MS', () => {
    const { result } = renderHook(() => useConnectionStatus());

    act(() => {
      fireEvent('offline');
    });
    expect(result.current).toBe('lost');

    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });

    act(() => {
      vi.advanceTimersByTime(RECONNECT_INTERVAL_MS);
    });

    expect(result.current).toBe('reconnecting');
  });

  it('transitions back to connected on online event', () => {
    const { result } = renderHook(() => useConnectionStatus());

    act(() => {
      fireEvent('offline');
    });
    expect(result.current).toBe('lost');

    act(() => {
      fireEvent('online');
    });
    expect(result.current).toBe('connected');
  });

  it('transitions to connected via interval when navigator comes back online', () => {
    const { result } = renderHook(() => useConnectionStatus());

    act(() => {
      fireEvent('offline');
    });

    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    act(() => {
      vi.advanceTimersByTime(RECONNECT_INTERVAL_MS);
    });

    expect(result.current).toBe('connected');
  });

  it('clears intervals on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useConnectionStatus());

    act(() => {
      fireEvent('offline');
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
