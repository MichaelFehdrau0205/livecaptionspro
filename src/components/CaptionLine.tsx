'use client';

import { getSpeakerProfile } from '@/lib/speakers';
import type { CaptionLine as CaptionLineType } from '@/types';
import type { DisplayMode } from '@/lib/constants';

/**
 * Lecture = white text, no block.
 * Group = colored block + black text only for speakers 2–4; speaker 1 = white text, no box.
 * DO NOT add a color vertical line (e.g. borderLeft) before the sentence — use colored blocks or plain text only.
 */
interface CaptionLineProps {
  line: CaptionLineType;
  lineIndex: number;
  onFlagWord: (lineId: string, wordIndex: number) => void;
  tokenSizeClass?: string;
  displayMode?: DisplayMode;
}

function stableRandomSpeakerId(lineId: string): number {
  let h = 0;
  for (let i = 0; i < lineId.length; i++) h = (h * 31 + lineId.charCodeAt(i)) >>> 0;
  return (h % 4) + 1;
}

function wordConfidenceColor(type: string, flagged: boolean): string {
  if (flagged) return 'text-white border-b-2 border-red-500';
  if (type === 'predicted') return 'text-white bg-blue-500/25 underline decoration-blue-400';
  if (type === 'uncertain') return 'text-amber-400';
  return 'text-white';
}

export function CaptionLine({ line, lineIndex, onFlagWord, tokenSizeClass, displayMode = 'group' }: CaptionLineProps) {
  const speakerId = line.speakerId ?? stableRandomSpeakerId(line.id);
  const speaker = getSpeakerProfile(speakerId);
  const sentence = line.words.map((w) => (w.text ?? '').trim()).filter(Boolean).join(' ');
  const isLecture = displayMode === 'lecture';
  const blockBg = isLecture ? undefined : (speaker.id === 1 ? undefined : speaker.bgColor);

  // Group mode — each line is block-level, clearly attributed to one speaker
  if (!isLecture) {
    const textColor = speaker.id === 1 ? '#ffffff' : speaker.textColor;
    return (
      <div className="mb-3" data-testid="caption-line">
        <span
          className={`caption-line-text ${tokenSizeClass ?? 'text-[24px]'} ${blockBg ? 'font-semibold rounded-lg px-2 py-0.5' : ''}`}
          style={{ color: textColor, ...(blockBg ? { backgroundColor: blockBg } : {}) }}
          onClick={() => onFlagWord(line.id, 0)}
          role="button"
          aria-label={`${sentence} — tap to flag as misheard`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlagWord(line.id, 0); } }}
          tabIndex={0}
        >
          {sentence}
        </span>
      </div>
    );
  }

  // Lecture mode — inline flowing text with per-word confidence colors
  return (
    <span data-testid="caption-line">
      {line.words.map((word, i) => (
        <span
          key={i}
          className={`${tokenSizeClass ?? 'text-[24px]'} ${wordConfidenceColor(word.type, word.flagged)}`}
          onClick={() => onFlagWord(line.id, i)}
          role="button"
          aria-label={`${word.text} — tap to flag`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlagWord(line.id, i); } }}
          tabIndex={0}
        >
          {word.text}{' '}
        </span>
      ))}
    </span>
  );
}
