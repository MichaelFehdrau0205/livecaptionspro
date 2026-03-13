import { MAX_LINES } from './constants';
import type { FifoLine } from '@/types';

/**
 * Push a line onto the FIFO; trim from the top so length <= MAX_LINES.
 */
export function pushLine(lines: FifoLine[], line: FifoLine): FifoLine[] {
  const next = [...lines, line];
  if (next.length <= MAX_LINES) return next;
  return next.slice(-MAX_LINES);
}

/**
 * Opacity decay by index (oldest = lowest). Index 0 = oldest, length-1 = newest.
 * Returns a value in (0, 1] so the newest line is 1 and older lines fade.
 */
export function getLineOpacity(index: number, total: number): number {
  if (total <= 0) return 1;
  if (total === 1) return 1;
  // Linear decay: newest (last index) = 1, oldest (0) = min opacity
  const minOpacity = 0.4;
  const p = index / (total - 1);
  return minOpacity + (1 - minOpacity) * p;
}
