import { describe, it, expect } from 'vitest';
import { segmentWords } from './segmentWords';

describe('segmentWords', () => {
  it('inserts spaces in run-together text', () => {
    expect(segmentWords('Hellohowareyou')).toBe('hello how are you');
  });

  it('preserves text that already has spaces', () => {
    expect(segmentWords('Hello how are you')).toBe('Hello how are you');
  });

  it('handles punctuation and run-together segments', () => {
    const out = segmentWords("Hellohowareyou.What'sup?No!No!");
    expect(out).toContain('hello how are you');
    expect(out).toContain('what\'s up');
    expect(out).toMatch(/no!\s*no!/i);
  });

  it('returns empty string for empty input', () => {
    expect(segmentWords('')).toBe('');
    expect(segmentWords('   ')).toBe('');
  });
});
