'use client';

import { useEffect, useRef } from 'react';
import { CaptionLine } from './CaptionLine';
import type { CaptionLine as CaptionLineType } from '@/types';
import type { DisplayMode } from '@/lib/constants';
import { addEndPunctuation } from '@/lib/punctuation';

interface CaptionAreaProps {
  captions: CaptionLineType[];
  currentInterim: string;
  onFlagWord: (lineId: string, wordIndex: number) => void;
  displayMode: DisplayMode;
}

export function CaptionArea({ captions, currentInterim, onFlagWord, displayMode }: CaptionAreaProps) {
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
      className="caption-area flex-1 overflow-y-auto px-4 py-6 text-[24px] leading-relaxed md:text-[22px] lg:text-[24px]"
      aria-live="polite"
      aria-atomic="false"
      data-testid="caption-area"
    >
      <div className="max-w-[720px] mx-auto leading-relaxed">
        {captions.map((line, index) => (
          <CaptionLine
            key={line.id}
            line={line}
            lineIndex={index}
            onFlagWord={onFlagWord}
            tokenSizeClass="text-[24px]"
            displayMode={displayMode}
          />
        ))}

        {/* Interim: same weight as final (no italic) so it doesn't feel like a second delay before "normal" text. */}
        {currentInterim && (
          <>
            <span className="text-white/95 font-medium" data-testid="interim-text">{addEndPunctuation(currentInterim)}</span>
            <span className="inline-block w-0.5 h-5 bg-white/80 animate-pulse ml-0.5 align-middle" aria-hidden="true" data-testid="interim-cursor" />
          </>
        )}

        {/* Cursor when no interim (shows end of final text) */}
        {!currentInterim && (
          <span className="inline-block w-0.5 h-5 bg-white/60 animate-pulse ml-1 align-middle" aria-hidden="true" data-testid="caption-cursor" />
        )}

        <div ref={bottomRef} data-testid="caption-area-bottom" aria-hidden="true" />
      </div>
    </div>
  );
}
