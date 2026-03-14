import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaptionArea } from './CaptionArea';
import type { CaptionLine as CaptionLineType } from '@/types';

function makeLine(id: string, words: CaptionLineType['words']): CaptionLineType {
  return {
    id,
    words,
    isFinalized: true,
    gapFillerApplied: false,
  };
}

describe('CaptionArea', () => {
  const onFlagWord = vi.fn();

  it('renders caption area', () => {
    render(<CaptionArea captions={[]} currentInterim="" onFlagWord={onFlagWord} displayMode="lecture" />);
    expect(screen.getByTestId('caption-area')).toBeInTheDocument();
  });

  it('has aria-live polite for accessibility', () => {
    render(<CaptionArea captions={[]} currentInterim="" onFlagWord={onFlagWord} displayMode="lecture" />);
    const area = screen.getByTestId('caption-area');
    expect(area).toHaveAttribute('aria-live', 'polite');
  });

  it('renders caption lines', () => {
    const lines = [
      makeLine('l1', [{ text: 'Hello', type: 'confirmed', confidence: 1, flagged: false }]),
      makeLine('l2', [{ text: 'world', type: 'confirmed', confidence: 1, flagged: false }]),
    ];
    render(<CaptionArea captions={lines} currentInterim="" onFlagWord={onFlagWord} displayMode="lecture" />);
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText(/world/)).toBeInTheDocument();
    expect(screen.getAllByTestId('caption-line')).toHaveLength(2);
  });

  it('shows interim text with end punctuation applied (for iOS where finals may be rare)', () => {
    render(
      <CaptionArea
        captions={[]}
        currentInterim="listening now"
        onFlagWord={onFlagWord}
        displayMode="lecture"
      />
    );
    const interim = screen.getByTestId('interim-text');
    expect(interim).toHaveTextContent('listening now.');
  });

  it('applies question mark to interim questions', () => {
    render(
      <CaptionArea captions={[]} currentInterim="how are you" onFlagWord={onFlagWord} displayMode="lecture" />
    );
    expect(screen.getByTestId('interim-text')).toHaveTextContent('how are you?');
  });

  it('does not show interim element when empty', () => {
    render(<CaptionArea captions={[]} currentInterim="" onFlagWord={onFlagWord} displayMode="lecture" />);
    expect(screen.queryByTestId('interim-text')).not.toBeInTheDocument();
  });

  it('renders blinking cursor', () => {
    render(<CaptionArea captions={[]} currentInterim="" onFlagWord={onFlagWord} displayMode="lecture" />);
    expect(screen.getByTestId('caption-cursor')).toBeInTheDocument();
  });

  it('renders scroll anchor for auto-scroll to bottom', () => {
    render(<CaptionArea captions={[]} currentInterim="" onFlagWord={onFlagWord} displayMode="lecture" />);
    expect(screen.getByTestId('caption-area-bottom')).toBeInTheDocument();
  });
});
