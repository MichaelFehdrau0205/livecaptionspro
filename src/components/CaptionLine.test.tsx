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
    render(<CaptionLine line={line} lineIndex={0} onFlagWord={vi.fn()} />);
    expect(screen.getByText(/hello/)).toBeInTheDocument();
    expect(screen.getByTestId('caption-line')).toBeInTheDocument();
  });

  it('calls onFlagWord when line is tapped', () => {
    const onFlagWord = vi.fn();
    const line = makeLine([{ text: 'hello', type: 'confirmed', confidence: 1.0, flagged: false }]);
    render(<CaptionLine line={line} lineIndex={0} onFlagWord={onFlagWord} />);
    fireEvent.click(screen.getByText(/hello/));
    expect(onFlagWord).toHaveBeenCalledWith('test-line-1', 0);
  });

  it('renders flagged line with red underline', () => {
    const line = makeLine([{ text: 'hello', type: 'confirmed', confidence: 1.0, flagged: true }]);
    const { container } = render(<CaptionLine line={line} lineIndex={0} onFlagWord={vi.fn()} />);
    expect(container.querySelector('.border-red-500')).toBeInTheDocument();
    expect(screen.getByText(/hello/)).toBeInTheDocument();
  });

  it('renders full sentence (wraps with others on row)', () => {
    const line = makeLine([
      { text: 'The', type: 'confirmed', confidence: 1.0, flagged: false },
      { text: 'executive', type: 'predicted', confidence: 0.5, flagged: false },
      { text: 'branch', type: 'uncertain', confidence: 0.8, flagged: false },
    ]);
    render(<CaptionLine line={line} lineIndex={0} onFlagWord={vi.fn()} />);
    expect(screen.getByText(/The executive branch/)).toBeInTheDocument();
  });
});
