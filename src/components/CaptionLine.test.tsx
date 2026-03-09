import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaptionLine } from './CaptionLine';
import type { CaptionLine as CaptionLineType } from '@/types';

function makeLine(words: CaptionLineType['words']): CaptionLineType {
  return {
    id: 'test-line-1',
    words,
    isFinalized: true,
    gapFillerApplied: false,
  };
}

describe('CaptionLine', () => {
  it('renders confirmed words in default style', () => {
    const line = makeLine([{ text: 'hello', type: 'confirmed', confidence: 1.0, flagged: false }]);
    render(<CaptionLine line={line} onFlagWord={vi.fn()} />);
    const word = screen.getByText(/hello/);
    expect(word).toBeInTheDocument();
    expect(word.className).toContain('text-white');
    expect(word.className).not.toContain('amber');
    expect(word.className).not.toContain('blue');
  });

  it('renders predicted words with highlight background', () => {
    const line = makeLine([{ text: 'executive', type: 'predicted', confidence: 0.5, flagged: false }]);
    render(<CaptionLine line={line} onFlagWord={vi.fn()} />);
    const word = screen.getByTestId('word-predicted');
    expect(word.className).toContain('blue');
    expect(word.className).toContain('underline');
  });

  it('renders uncertain words in orange', () => {
    const line = makeLine([{ text: 'branch', type: 'uncertain', confidence: 0.75, flagged: false }]);
    render(<CaptionLine line={line} onFlagWord={vi.fn()} />);
    const word = screen.getByTestId('word-uncertain');
    expect(word.className).toContain('amber');
  });

  it('calls onFlagWord when a word is tapped', () => {
    const onFlagWord = vi.fn();
    const line = makeLine([{ text: 'hello', type: 'confirmed', confidence: 1.0, flagged: false }]);
    render(<CaptionLine line={line} onFlagWord={onFlagWord} />);
    fireEvent.click(screen.getByText(/hello/));
    expect(onFlagWord).toHaveBeenCalledWith('test-line-1', 0);
  });

  it('renders flagged words with red underline', () => {
    const line = makeLine([{ text: 'hello', type: 'confirmed', confidence: 1.0, flagged: true }]);
    render(<CaptionLine line={line} onFlagWord={vi.fn()} />);
    const word = screen.getByText(/hello/);
    expect(word.className).toContain('border-red');
  });

  it('renders multiple words', () => {
    const line = makeLine([
      { text: 'The', type: 'confirmed', confidence: 1.0, flagged: false },
      { text: 'executive', type: 'predicted', confidence: 0.5, flagged: false },
      { text: 'branch', type: 'uncertain', confidence: 0.8, flagged: false },
    ]);
    render(<CaptionLine line={line} onFlagWord={vi.fn()} />);
    expect(screen.getByText(/The/)).toBeInTheDocument();
    expect(screen.getByTestId('word-predicted')).toBeInTheDocument();
    expect(screen.getByTestId('word-uncertain')).toBeInTheDocument();
  });
});
