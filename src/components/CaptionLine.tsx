'use client';

import type { CaptionLine as CaptionLineType } from '@/types';

interface CaptionLineProps {
  line: CaptionLineType;
  onFlagWord: (lineId: string, wordIndex: number) => void;
}

export function CaptionLine({ line, onFlagWord }: CaptionLineProps) {
  return (
    <span className="inline" data-testid="caption-line">
      {line.words.map((word, i) => {
        let wordClass = 'text-white';
        if (word.flagged) {
          wordClass = 'text-white border-b-2 border-red-500';
        } else if (word.type === 'predicted') {
          wordClass =
            'text-white bg-blue-500/25 underline decoration-blue-400 decoration-2 rounded px-0.5';
        } else if (word.type === 'uncertain') {
          wordClass = 'text-amber-400';
        }

        return (
          <span
            key={`${line.id}-${i}`}
            className={`inline-flex items-center cursor-pointer select-none min-h-[44px] py-2 px-1.5 -my-1 rounded ${wordClass}`}
            data-testid={`word-${word.type}`}
            onClick={() => onFlagWord(line.id, i)}
            role="button"
            aria-label={`${word.text} — tap to flag as misheard`}
          >
            {word.text}{' '}
          </span>
        );
      })}
    </span>
  );
}
