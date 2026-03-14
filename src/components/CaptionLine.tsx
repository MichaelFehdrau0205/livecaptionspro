'use client';

import type { CaptionLine as CaptionLineType } from '@/types';
import { getSpeakerProfile } from '@/lib/speakers';

interface CaptionLineProps {
  line: CaptionLineType;
  onFlagWord: (lineId: string, wordIndex: number) => void;
  /** Lecture = white text only. Group = multi-color by speaker + outline per sentence. */
  showSpeakerColor?: boolean;
}

/** Group mode: text color per speaker. Outline = left border so each sentence is easy to read. */
const SPEAKER_TEXT_CLASS: Record<number, string> = {
  1: 'text-white',
  2: 'text-green-400',
  3: 'text-yellow-300',
  4: 'text-orange-400',
};

export function CaptionLine({ line, onFlagWord, showSpeakerColor = false }: CaptionLineProps) {
  const speakerId = line.speakerId ?? 0;
  const effectiveId = Math.max(1, Math.min(4, Math.round(speakerId))) as 1 | 2 | 3 | 4;
  const speaker = showSpeakerColor && effectiveId >= 1 && effectiveId <= 4 ? getSpeakerProfile(effectiveId) : null;
  const wordColorClass = speaker ? SPEAKER_TEXT_CLASS[effectiveId] ?? 'text-white' : 'text-white';
  const outlineStyle = speaker
    ? { borderLeft: `4px solid ${speaker.bgColor}`, paddingLeft: '8px', marginLeft: '2px', marginBottom: '4px' }
    : undefined;

  return (
    <span
      className="inline-block"
      data-testid="caption-line"
      style={outlineStyle}
    >
      {line.words.map((word, i) => {
        let wordClass = wordColorClass;
        if (word.flagged) {
          wordClass = `${wordColorClass} border-b-2 border-red-500`;
        } else if (word.type === 'predicted') {
          wordClass =
            wordColorClass === 'text-white'
              ? 'text-white bg-blue-500/25 underline decoration-blue-400 decoration-2 rounded px-0.5'
              : `${wordColorClass} bg-black/20 underline decoration-2 rounded px-0.5`;
        } else if (word.type === 'uncertain') {
          wordClass = wordColorClass === 'text-white' ? 'text-amber-400' : `${wordColorClass} opacity-90`;
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
