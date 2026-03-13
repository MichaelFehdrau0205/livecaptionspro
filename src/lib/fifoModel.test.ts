import { describe, it, expect } from 'vitest';
import { pushLine, getLineOpacity } from './fifoModel';
import type { FifoLine } from '@/types';
import { MAX_LINES } from './constants';

function makeLine(id: string, speakerId: number, words: { text: string }[], interim = '', done = false): FifoLine {
  return { id, speakerId, words, interim, done };
}

describe('fifoModel', () => {
  describe('pushLine', () => {
    it('empty queue: adds one line', () => {
      const lines: FifoLine[] = [];
      const line = makeLine('a', 1, [{ text: 'Hi' }], '', true);
      const result = pushLine(lines, line);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('exactly MAX_LINES: keeps all', () => {
      const lines: FifoLine[] = Array.from({ length: MAX_LINES }, (_, i) =>
        makeLine(`id-${i}`, 1, [{ text: `word-${i}` }], '', true)
      );
      const line = makeLine('new', 1, [{ text: 'new' }], '', true);
      const result = pushLine(lines, line);
      expect(result).toHaveLength(MAX_LINES);
      expect(result[result.length - 1].id).toBe('new');
      expect(result[0].id).toBe('id-1');
    });

    it('overflow by 1: trims oldest', () => {
      const lines: FifoLine[] = Array.from({ length: MAX_LINES }, (_, i) =>
        makeLine(`id-${i}`, 1, [{ text: `w-${i}` }], '', true)
      );
      const added = makeLine('extra', 1, [{ text: 'extra' }], '', true);
      const result = pushLine(lines, added);
      expect(result).toHaveLength(MAX_LINES);
      expect(result[0].id).toBe('id-1');
      expect(result[result.length - 1].id).toBe('extra');
    });

    it('overflow by 3: trims three oldest', () => {
      const lines: FifoLine[] = Array.from({ length: MAX_LINES }, (_, i) =>
        makeLine(`id-${i}`, 1, [{ text: `w-${i}` }], '', true)
      );
      const a = makeLine('a', 1, [{ text: 'a' }], '', true);
      const b = makeLine('b', 1, [{ text: 'b' }], '', true);
      const c = makeLine('c', 1, [{ text: 'c' }], '', true);
      let result = pushLine(lines, a);
      result = pushLine(result, b);
      result = pushLine(result, c);
      expect(result).toHaveLength(MAX_LINES);
      expect(result[0].id).toBe('id-3');
      expect(result[result.length - 3].id).toBe('a');
      expect(result[result.length - 2].id).toBe('b');
      expect(result[result.length - 1].id).toBe('c');
    });
  });

  describe('getLineOpacity', () => {
    it('single line: opacity 1', () => {
      expect(getLineOpacity(0, 1)).toBe(1);
    });

    it('two lines: oldest 0.4, newest 1', () => {
      expect(getLineOpacity(0, 2)).toBe(0.4);
      expect(getLineOpacity(1, 2)).toBe(1);
    });

    it('several lines: linear decay from oldest to newest', () => {
      const total = 5;
      const opacities = Array.from({ length: total }, (_, i) => getLineOpacity(i, total));
      expect(opacities[0]).toBeCloseTo(0.4);
      expect(opacities[total - 1]).toBe(1);
      for (let i = 0; i < total - 1; i++) {
        expect(opacities[i]).toBeLessThanOrEqual(opacities[i + 1]);
      }
    });
  });
});
