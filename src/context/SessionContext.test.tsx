import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider, useSession } from './SessionContext';

// Mock all hooks used by SessionContext
const startAudio = vi.fn();
const stopAudio = vi.fn();
const startSTT = vi.fn();
const stopSTT = vi.fn();
const fillGap = vi.fn();
const flushQueue = vi.fn();

vi.mock('@/hooks/useAudioPipeline', () => ({
  useAudioPipeline: () => ({
    start: startAudio,
    stop: stopAudio,
    error: null,
    status: 'idle',
  }),
}));

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    start: startSTT,
    stop: stopSTT,
    status: 'idle',
  }),
}));

vi.mock('@/hooks/useGapFiller', () => ({
  useGapFiller: () => ({
    fill: fillGap,
    paused: false,
    flushQueue,
  }),
}));

vi.mock('@/hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => 'connected',
}));

vi.mock('@/hooks/useWakeLock', () => ({
  useWakeLock: () => {},
}));

vi.mock('@/hooks/useSessionTimer', () => ({
  useSessionTimer: () => '00:00:00',
}));

function TestChild() {
  const { state, dispatch, startSession, endSession } = useSession();
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <button onClick={() => startSession()} data-testid="start-btn">Start</button>
      <button onClick={() => endSession()} data-testid="end-btn">End</button>
      <button
        onClick={() => dispatch({ type: 'FINALIZE_LINE', payload: 'Hello world' })}
        data-testid="finalize-btn"
      >
        Finalize line
      </button>
    </div>
  );
}

describe('SessionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startAudio.mockResolvedValue({} as MediaStream); // simulate granted mic
  });

  it('provides initial idle state', () => {
    render(
      <SessionProvider>
        <TestChild />
      </SessionProvider>
    );
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('startSession dispatches START_SESSION and starts audio + STT', async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider>
        <TestChild />
      </SessionProvider>
    );

    await user.click(screen.getByTestId('start-btn'));

    await waitFor(() => {
      expect(startAudio).toHaveBeenCalled();
    });
    expect(startSTT).toHaveBeenCalled();
    expect(screen.getByTestId('status')).toHaveTextContent('listening');
  });

  it('endSession stops STT and audio and dispatches END_SESSION', async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider>
        <TestChild />
      </SessionProvider>
    );

    await user.click(screen.getByTestId('start-btn'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('listening'));

    await user.click(screen.getByTestId('end-btn'));

    expect(stopSTT).toHaveBeenCalled();
    expect(stopAudio).toHaveBeenCalled();
    expect(screen.getByTestId('status')).toHaveTextContent('ended');
  });

  it('dispatches finalized lines to gap filler', async () => {
    const user = userEvent.setup();
    render(
      <SessionProvider>
        <TestChild />
      </SessionProvider>
    );

    await user.click(screen.getByTestId('start-btn'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('listening'));

    await user.click(screen.getByTestId('finalize-btn'));

    await waitFor(() => {
      expect(fillGap).toHaveBeenCalled();
    });
    expect(fillGap).toHaveBeenCalledWith(
      expect.any(String),
      'Hello world'
    );
  });
});
