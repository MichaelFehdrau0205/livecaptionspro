'use client';

import { useEffect, useRef } from 'react';
import { CaptionLine } from './CaptionLine';
import type { CaptionLine as CaptionLineType } from '@/types';
import { addEndPunctuation } from '@/lib/punctuation';

interface CaptionAreaProps {
  captions: CaptionLineType[];
  currentInterim: string;
  onFlagWord: (lineId: string, wordIndex: number) => void;
  showSpeakerColors?: boolean;
}

export function CaptionArea({ captions, currentInterim, onFlagWord, showSpeakerColors = false }: CaptionAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest caption
  useEffect(() => {
    const el = bottomRef.current;
    if (el?.scrollIntoView && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' });
    }
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
            <CaptionLine line={line} onFlagWord={onFlagWord} showSpeakerColor={showSpeakerColors} />
          </span>
        ))}

        {/* Interim text — add punctuation so iOS (which may rarely send final results) still shows ? ! . */}
        {currentInterim && (
          <span className="text-white/70 italic" data-testid="interim-text">{addEndPunctuation(currentInterim)}</span>
        )}

        {/* Subtle blinking cursor at end of live text */}
        <span className="inline-block w-0.5 h-5 bg-white/60 animate-pulse ml-1 align-middle" aria-hidden="true" data-testid="caption-cursor" />

        <div ref={bottomRef} data-testid="caption-area-bottom" aria-hidden="true" />
      </div>
    </div>
  );
}
