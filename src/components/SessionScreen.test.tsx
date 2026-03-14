import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionScreen } from './SessionScreen';
import type { CaptionLine as CaptionLineType } from '@/types';

function makeLine(id: string, words: CaptionLineType['words']): CaptionLineType {
  return {
    id,
    words,
    isFinalized: true,
    gapFillerApplied: false,
  };
}

const dispatch = vi.fn();
const endSession = vi.fn();
const mockDisplayMode = vi.hoisted(() => ({ value: 'group' as 'lecture' | 'group' }));

vi.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    state: {
      status: 'listening',
      captions: [
        makeLine('line-1', [
          { text: 'Hello', type: 'confirmed', confidence: 1, flagged: false },
          { text: 'world', type: 'confirmed', confidence: 1, flagged: false },
        ]),
      ],
      currentInterim: '',
      sessionStartTime: Date.now(),
      stats: { wordCount: 2, aiCorrections: 0 },
      feedbackGiven: null,
    },
    dispatch,
    endSession,
    connectionStatus: 'connected' as const,
    timer: '00:00:05',
    displayMode: mockDisplayMode.value,
    setDisplayMode: vi.fn(),
    startSession: vi.fn(),
    giveFeedback: vi.fn(),
    audioError: null,
    speechError: null,
    isDeepgramActive: true,
  }),
}));

describe('SessionScreen', () => {
  beforeEach(() => {
    dispatch.mockClear();
    endSession.mockClear();
    mockDisplayMode.value = 'group';
  });

  it('renders status bar', () => {
    render(<SessionScreen />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('renders Lecture/Group toggle on listening page', () => {
    render(<SessionScreen />);
    expect(screen.getByTestId('mode-lecture')).toBeInTheDocument();
    expect(screen.getByTestId('mode-group')).toBeInTheDocument();
  });

  it('renders caption area', () => {
    render(<SessionScreen />);
    expect(screen.getByTestId('caption-area')).toBeInTheDocument();
  });

  it('renders control bar', () => {
    render(<SessionScreen />);
    expect(screen.getByTestId('control-bar')).toBeInTheDocument();
  });

  it('renders caption lines from state', () => {
    render(<SessionScreen />);
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText(/world/)).toBeInTheDocument();
  });

  it('dispatches FLAG_WORD when a word is tapped', () => {
    render(<SessionScreen />);
    fireEvent.click(screen.getByText(/Hello/));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'FLAG_WORD',
      payload: { lineId: 'line-1', wordIndex: 0 },
    });
  });

  it('calls endSession when end session button is clicked', () => {
    render(<SessionScreen />);
    fireEvent.click(screen.getByTestId('end-session-button'));
    expect(endSession).toHaveBeenCalledTimes(1);
  });
});
