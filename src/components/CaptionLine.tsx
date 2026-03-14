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

export function CaptionLine({ line, lineIndex, onFlagWord, tokenSizeClass, displayMode = 'group' }: CaptionLineProps) {
  const speakerId = line.speakerId ?? stableRandomSpeakerId(line.id);
  const speaker = getSpeakerProfile(speakerId);
  const sentence = line.words.map((w) => (w.text ?? '').trim()).filter(Boolean).join(' ');
  const hasFlagged = line.words.some((w) => w.flagged);
  const isLecture = displayMode === 'lecture';

  const textColor = isLecture ? '#ffffff' : speaker.textColor;
  const blockBg = isLecture ? undefined : (speaker.id === 1 ? undefined : speaker.bgColor);

  /* LOCK: No vertical colored line (no borderLeft). User requested many times: use colored blocks only, never a bar before the sentence. */
  const wrapperStyle = { ['--line-color' as string]: textColor, ['--line-bg' as string]: blockBg };
  const innerStyle = {
    color: 'var(--line-color)',
    ...(blockBg ? { backgroundColor: blockBg, padding: '0.2rem 0.45rem' } : {}),
  };

  /* Color box: small gap to next (box next to box). White text: 2 spaces after; 2 spaces before only when not first. */
  const spacingClass = blockBg
    ? 'mr-2'
    : `mr-[2em] ${lineIndex > 0 ? 'ml-[2em]' : ''}`;

  return (
    <span
      className={`inline-block mb-2 align-baseline ${spacingClass}`}
      data-testid="caption-line"
      style={wrapperStyle}
    >
      <span
        className={`caption-line-text inline ${hasFlagged ? 'border-b-2 border-red-500' : ''} ${tokenSizeClass ?? 'text-[24px]'} ${blockBg ? 'font-semibold' : ''}`}
        style={innerStyle}
        onClick={() => onFlagWord(line.id, 0)}
        role="button"
        aria-label={`${sentence} — tap to flag as misheard`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFlagWord(line.id, 0);
          }
        }}
        tabIndex={0}
      >
        {sentence}
      </span>
    </span>
  );
}
