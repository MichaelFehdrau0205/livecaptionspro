'use client';

import { useEffect, useRef } from 'react';
import { CaptionLine } from './CaptionLine';
import type { CaptionLine as CaptionLineType } from '@/types';

interface CaptionAreaProps {
  captions: CaptionLineType[];
  currentInterim: string;
  onFlagWord: (lineId: string, wordIndex: number) => void;
}

export function CaptionArea({ captions, currentInterim, onFlagWord }: CaptionAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest caption
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [captions, currentInterim]);

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 text-[20px] leading-relaxed md:text-[18px] lg:text-[22px]"
      aria-live="polite"
      aria-atomic="false"
      data-testid="caption-area"
    >
      <div className="max-w-[720px] mx-auto">
        {captions.map((line) => (
          <span key={line.id}>
            <CaptionLine line={line} onFlagWord={onFlagWord} />
          </span>
        ))}

        {/* Interim text — shown in lighter color */}
        {currentInterim && (
          <span className="text-white/50 italic">{currentInterim}</span>
        )}

        {/* Blinking cursor */}
        <span className="inline-block w-0.5 h-5 bg-white/70 animate-pulse ml-1" aria-hidden="true" />

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
