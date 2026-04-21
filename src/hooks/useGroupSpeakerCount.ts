'use client';

import { useCallback, useState } from 'react';
import { GROUP_SPEAKER_COUNT_KEY } from '@/lib/constants';

export type GroupSpeakerCount = 2 | 3 | 4;

function getStored(): GroupSpeakerCount {
  if (typeof window === 'undefined') return 3;
  try {
    const value = Number(localStorage.getItem(GROUP_SPEAKER_COUNT_KEY));
    if (value === 2 || value === 3 || value === 4) return value;
  } catch {
    /* ignore */
  }
  return 3;
}

export function useGroupSpeakerCount(): [GroupSpeakerCount, (count: GroupSpeakerCount) => void] {
  const [count, setCountState] = useState<GroupSpeakerCount>(getStored);

  const setCount = useCallback((next: GroupSpeakerCount) => {
    setCountState(next);
    try {
      localStorage.setItem(GROUP_SPEAKER_COUNT_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  return [count, setCount];
}
