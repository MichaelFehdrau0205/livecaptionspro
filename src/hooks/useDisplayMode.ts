'use client';

import { useState, useCallback, useEffect } from 'react';
import { DISPLAY_MODE_KEY, type DisplayMode } from '@/lib/constants';

function getStored(): DisplayMode {
  if (typeof window === 'undefined') return 'group';
  try {
    const v = localStorage.getItem(DISPLAY_MODE_KEY);
    if (v === 'lecture' || v === 'group') return v;
  } catch {
    /* ignore */
  }
  return 'group';
}

export function useDisplayMode(): [DisplayMode, (mode: DisplayMode) => void] {
  const [mode, setModeState] = useState<DisplayMode>('group');

  useEffect(() => {
    setModeState(getStored());
  }, []);

  const setMode = useCallback((next: DisplayMode) => {
    setModeState(next);
    try {
      localStorage.setItem(DISPLAY_MODE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return [mode, setMode];
}
