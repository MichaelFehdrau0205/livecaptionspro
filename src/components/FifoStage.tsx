'use client';

import type { FifoLine } from '@/types';
import { getLineOpacity } from '@/lib/fifoModel';

interface FifoStageProps {
  lines: FifoLine[];
}

/**
 * Renders FIFO caption stage: bottom-anchored flex layout, diff by data-lid,
 * slideUp entry animation, opacity decay for older lines.
 */
export function FifoStage({ lines }: FifoStageProps) {
  return (
    <div
      className="flex flex-1 flex-col justify-end min-h-0 px-4 py-6 text-[20px] leading-relaxed md:text-[18px] lg:text-[22px]"
      aria-live="polite"
      aria-atomic="false"
      data-testid="fifo-stage"
    >
      <div className="flex flex-col justify-end gap-2 max-w-[720px] mx-auto w-full">
        {lines.map((line, index) => {
          const opacity = getLineOpacity(index, lines.length);
          const text = line.words.map((w) => w.text).join(' ');
          const interim = line.interim ? ` ${line.interim}` : '';
          return (
            <div
              key={line.id}
              data-lid={line.id}
              className="animate-fifo-slide-up rounded-lg px-3 py-2 transition-opacity duration-200"
              style={{ opacity }}
            >
              <span className="text-white">
                {text}
                {interim && <span className="text-white/70 italic">{interim}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
