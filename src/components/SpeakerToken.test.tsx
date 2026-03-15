import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpeakerToken } from './SpeakerToken';
import type { FifoWord } from '@/types';
import type { SpeakerProfile } from '@/lib/speakers';

const WORD: FifoWord = { text: 'hello' };
const SPEAKER: SpeakerProfile = {
  id: 1,
  name: 'Host',
  role: 'Host',
  bgColor: '#1d4ed8',
  textColor: '#ffffff',
};

describe('SpeakerToken', () => {
  it('renders confirmed token with speaker colors', () => {
    render(<SpeakerToken word={WORD} speaker={SPEAKER} />);
    const token = screen.getByTestId('speaker-token');
    expect(token).toBeInTheDocument();
    expect(token.textContent).toContain('hello');
  });

  it('renders interim token with dashed border and reduced opacity', () => {
    render(<SpeakerToken word={WORD} speaker={SPEAKER} isInterim />);
    const token = screen.getByTestId('speaker-token-interim');
    expect(token).toBeInTheDocument();
  });

  it('shows blinking cursor when showCursor is true', () => {
    render(<SpeakerToken word={WORD} speaker={SPEAKER} showCursor />);
    const token = screen.getByTestId('speaker-token');
    const cursor = token.querySelector('.animate-pulse');
    expect(cursor).not.toBeNull();
  });
});

