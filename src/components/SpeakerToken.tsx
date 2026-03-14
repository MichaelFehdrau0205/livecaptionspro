'use client';

import type { FifoWord } from '@/types';
import type { SpeakerProfile } from '@/lib/speakers';

interface SpeakerTokenProps {
  word: FifoWord;
  speaker: SpeakerProfile;
  isInterim?: boolean;
  showCursor?: boolean;
  /** Optional: override font size (e.g. text-xl for size demo). */
  className?: string;
}

/**
 * Single word token for multi-speaker view.
 * Uses speaker background/text colors; interim tokens are ghosted with a dashed border.
 */
export function SpeakerToken({ word, speaker, isInterim = false, showCursor = false, className }: SpeakerTokenProps) {
  const baseClasses =
    'inline-flex items-center px-3 py-1 min-h-[32px]';
  const sizeClasses = className ?? 'text-sm md:text-base lg:text-lg';

  const style = {
    backgroundColor: isInterim ? 'transparent' : speaker.bgColor,
    color: speaker.textColor,
    border: isInterim ? `1px dashed ${speaker.bgColor}` : 'none',
    borderRadius: 0,
    opacity: isInterim ? 0.7 : 1,
    fontWeight: isInterim ? 'normal' : 'bold',
    boxShadow: 'none',
    outline: 'none',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses} whitespace-normal`} style={style} data-testid={isInterim ? 'speaker-token-interim' : 'speaker-token'}>
      <span className="whitespace-normal">{word.text}</span>
      {showCursor && <span className="ml-1 inline-block w-0.5 h-4 bg-white/80 animate-pulse align-middle" />}
    </span>
  );
}

