import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWakeLock } from './useWakeLock';

const mockRelease = vi.fn().mockResolvedValue(undefined);
const mockSentinel = { release: mockRelease };
const mockRequest = vi.fn().mockResolvedValue(mockSentinel);

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'wakeLock', {
    value: { request: mockRequest },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useWakeLock', () => {
  it('requests wake lock when active is true', async () => {
    renderHook(() => useWakeLock(true));
    await vi.waitFor(() => expect(mockRequest).toHaveBeenCalledWith('screen'));
  });

  it('does not request wake lock when active is false', async () => {
    renderHook(() => useWakeLock(false));
    await new Promise((r) => setTimeout(r, 50));
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('releases wake lock when active becomes false', async () => {
    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    });
    await vi.waitFor(() => expect(mockRequest).toHaveBeenCalled());
    rerender({ active: false });
    await vi.waitFor(() => expect(mockRelease).toHaveBeenCalled());
  });

  it('releases wake lock on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock(true));
    await vi.waitFor(() => expect(mockRequest).toHaveBeenCalled());
    unmount();
    await vi.waitFor(() => expect(mockRelease).toHaveBeenCalled());
  });

  it('re-acquires wake lock on visibility change when active', async () => {
    renderHook(() => useWakeLock(true));
    await vi.waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));

    // Simulate page becoming visible again
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(2));
  });

  it('does not re-acquire on visibility change when not active', async () => {
    renderHook(() => useWakeLock(false));
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r, 50));
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('does not throw when wakeLock is not supported', async () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });

  it('does not throw when wakeLock.request rejects', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Permission denied'));
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
    await new Promise((r) => setTimeout(r, 50));
  });
});
