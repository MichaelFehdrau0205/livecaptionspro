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
  it('renders sentence with caption line', () => {
    const line = makeLine([{ text: 'hello', type: 'confirmed', confidence: 1.0, flagged: false }]);
    render(<CaptionLine line={line} onFlagWord={vi.fn()} />);
    expect(screen.getByText(/hello/)).toBeInTheDocument();
    expect(screen.getByTestId('caption-line')).toBeInTheDocument();
  });

  it('calls onFlagWord when line is tapped', () => {
    const onFlagWord = vi.fn();
    const line = makeLine([{ text: 'hello', type: 'confirmed', confidence: 1.0, flagged: false }]);
    render(<CaptionLine line={line} onFlagWord={onFlagWord} />);
    fireEvent.click(screen.getByText(/hello/));
    expect(onFlagWord).toHaveBeenCalledWith('test-line-1', 0);
  });

  it('renders flagged word with red underline in lecture mode', () => {
    const line = makeLine([{ text: 'hello', type: 'confirmed', confidence: 1.0, flagged: true }]);
    const { container } = render(<CaptionLine line={line} onFlagWord={vi.fn()} displayMode="lecture" />);
    expect(container.querySelector('.border-red-500')).toBeInTheDocument();
    expect(screen.getByText(/hello/)).toBeInTheDocument();
  });

  it('renders all words in lecture mode', () => {
    const line = makeLine([
      { text: 'The', type: 'confirmed', confidence: 1.0, flagged: false },
      { text: 'executive', type: 'predicted', confidence: 0.5, flagged: false },
      { text: 'branch', type: 'uncertain', confidence: 0.8, flagged: false },
    ]);
    render(<CaptionLine line={line} onFlagWord={vi.fn()} displayMode="lecture" />);
    expect(screen.getByText(/The/)).toBeInTheDocument();
    expect(screen.getByText(/executive/)).toBeInTheDocument();
    expect(screen.getByText(/branch/)).toBeInTheDocument();
  });
});
