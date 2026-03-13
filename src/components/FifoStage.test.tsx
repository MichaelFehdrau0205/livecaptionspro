import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FifoStage } from './FifoStage';
import type { FifoLine } from '@/types';

function makeLine(id: string, speakerId: number, words: { text: string }[], interim = '', done = false): FifoLine {
  return { id, speakerId, words, interim, done };
}

describe('FifoStage', () => {
  it('renders empty stage', () => {
    render(<FifoStage lines={[]} />);
    expect(screen.getByTestId('fifo-stage')).toBeInTheDocument();
  });

  it('renders lines with data-lid for diff', () => {
    const lines: FifoLine[] = [
      makeLine('lid-1', 1, [{ text: 'Hello' }], '', true),
      makeLine('lid-2', 2, [{ text: 'world' }], ' now', false),
    ];
    render(<FifoStage lines={lines} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/world/)).toBeInTheDocument();
    expect(screen.getByText(/now/)).toBeInTheDocument();
    const nodes = document.querySelectorAll('[data-lid]');
    expect(nodes).toHaveLength(2);
    expect(nodes[0].getAttribute('data-lid')).toBe('lid-1');
    expect(nodes[1].getAttribute('data-lid')).toBe('lid-2');
  });

  it('applies slide-up animation class', () => {
    const lines: FifoLine[] = [makeLine('a', 1, [{ text: 'Hi' }], '', true)];
    render(<FifoStage lines={lines} />);
    const lineEl = document.querySelector('[data-lid="a"]');
    expect(lineEl?.className).toContain('animate-fifo-slide-up');
  });
});
