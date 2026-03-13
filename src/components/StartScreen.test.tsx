import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StartScreen } from './StartScreen';

const startSessionMock = vi.hoisted(() => vi.fn());
vi.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    state: {
      status: 'idle',
      captions: [],
      currentInterim: '',
      sessionStartTime: null,
      sessionEndTime: null,
      stats: { wordCount: 0, aiCorrections: 0 },
      feedbackGiven: null,
    },
    startSession: startSessionMock,
    endSession: vi.fn(),
    dispatch: vi.fn(),
    connectionStatus: 'connected',
    gapFillerPaused: false,
    timer: '00:00:00',
    audioError: null,
    speechError: null,
  }),
}));

describe('StartScreen', () => {
  beforeEach(() => {
    startSessionMock.mockClear();
  });

  it('renders the app title', () => {
    render(<StartScreen />);
    expect(screen.getByText('Live Captions Pro')).toBeInTheDocument();
  });

  it('renders the start button', async () => {
    render(<StartScreen />);
    await waitFor(() => expect(screen.getByTestId('start-button')).toBeInTheDocument());
    expect(screen.getByText('START CAPTIONING')).toBeInTheDocument();
  });

  it('renders education mode label', () => {
    render(<StartScreen />);
    expect(screen.getByText(/education mode/i)).toBeInTheDocument();
  });

  it('shows mic permission prompt when start is clicked', async () => {
    render(<StartScreen />);
    const startBtn = await screen.findByTestId('start-button');
    fireEvent.click(startBtn);
    expect(screen.getByTestId('mic-permission-prompt')).toBeInTheDocument();
    expect(screen.getByText(/Your audio is processed locally/)).toBeInTheDocument();
    expect(screen.getByTestId('allow-mic-button')).toBeInTheDocument();
  });

  it('calls startSession when Allow Microphone is clicked', async () => {
    render(<StartScreen />);
    const startBtn = await screen.findByTestId('start-button');
    fireEvent.click(startBtn);
    fireEvent.click(screen.getByTestId('allow-mic-button'));
    expect(startSessionMock).toHaveBeenCalledTimes(1);
  });

  it('closes modal when Cancel is clicked', async () => {
    render(<StartScreen />);
    const startBtn = await screen.findByTestId('start-button');
    fireEvent.click(startBtn);
    expect(screen.getByTestId('mic-permission-prompt')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('cancel-mic-prompt'));
    expect(screen.queryByTestId('mic-permission-prompt')).not.toBeInTheDocument();
  });

  it('start button has adequate touch target size', async () => {
    render(<StartScreen />);
    const btn = await screen.findByTestId('start-button');
    expect(btn).toHaveClass('min-h-[56px]');
  });
});
