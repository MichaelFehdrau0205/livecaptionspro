import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionEndScreen } from './SessionEndScreen';

const printTranscriptMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/transcriptExport', () => ({
  printTranscript: printTranscriptMock,
}));

const useSessionMock = vi.hoisted(() => vi.fn());
vi.mock('@/context/SessionContext', () => ({
  useSession: () => useSessionMock(),
}));

const defaultState = {
  status: 'ended' as const,
  captions: [],
  currentInterim: '',
  sessionStartTime: Date.now() - 125000, // ~2 min ago
  sessionEndTime: Date.now() - 125000 + 125000, // frozen at 125s = 00:02:05
  stats: { wordCount: 42, aiCorrections: 3 },
  feedbackGiven: null as 'yes' | 'no' | null,
};

function renderWithMock(giveFeedback = vi.fn(), state = defaultState) {
  useSessionMock.mockReturnValue({
    state,
    startSession: vi.fn(),
    giveFeedback,
    endSession: vi.fn(),
    dispatch: vi.fn(),
    connectionStatus: 'connected',
    gapFillerPaused: false,
    timer: '00:02:05',
    audioError: null,
    speechError: null,
    displayMode: 'lecture' as const,
    setDisplayMode: vi.fn(),
  });
  return render(<SessionEndScreen />);
}

describe('SessionEndScreen', () => {
  beforeEach(() => {
    printTranscriptMock.mockClear();
    useSessionMock.mockReturnValue({
      state: defaultState,
      startSession: vi.fn(),
      giveFeedback: vi.fn(),
      endSession: vi.fn(),
      dispatch: vi.fn(),
      connectionStatus: 'connected',
      gapFillerPaused: false,
      timer: '00:02:05',
      audioError: null,
      speechError: null,
      displayMode: 'lecture' as const,
      setDisplayMode: vi.fn(),
    });
  });

  it('renders session ended title', () => {
    render(<SessionEndScreen />);
    expect(screen.getByText('SESSION ENDED')).toBeInTheDocument();
  });

  it('renders session stats with frozen duration', () => {
    render(<SessionEndScreen />);
    expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    expect(screen.getByText('00:02:05')).toBeInTheDocument();
    expect(screen.getByText(/Words captured:/)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/AI corrections:/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders feedback prompt when feedbackGiven is null', () => {
    render(<SessionEndScreen />);
    expect(screen.getByText(/Did you miss anything important?/)).toBeInTheDocument();
    expect(screen.getByTestId('feedback-yes')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-no')).toBeInTheDocument();
  });

  it('calls giveFeedback("yes") when YES is clicked', () => {
    const giveFeedback = vi.fn();
    renderWithMock(giveFeedback);
    fireEvent.click(screen.getByTestId('feedback-yes'));
    expect(giveFeedback).toHaveBeenCalledWith('yes');
  });

  it('calls giveFeedback("no") when NO is clicked', () => {
    const giveFeedback = vi.fn();
    renderWithMock(giveFeedback);
    fireEvent.click(screen.getByTestId('feedback-no'));
    expect(giveFeedback).toHaveBeenCalledWith('no');
  });

  it('shows thanks message after YES', () => {
    renderWithMock(vi.fn(), { ...defaultState, feedbackGiven: 'yes' });
    expect(screen.getByTestId('feedback-thanks')).toHaveTextContent(/Thanks for your feedback!/);
  });

  it('shows great message after NO', () => {
    renderWithMock(vi.fn(), { ...defaultState, feedbackGiven: 'no' });
    expect(screen.getByTestId('feedback-great')).toHaveTextContent(/Great!/);
  });

  it('renders Lecture and Group for next session with highlight on selection', () => {
    render(<SessionEndScreen />);
    expect(screen.getByTestId('end-mode-lecture')).toHaveTextContent('Lecture');
    expect(screen.getByTestId('end-mode-group')).toHaveTextContent('Group');
  });

  it('renders new session button and calls startSession when clicked', () => {
    const startSession = vi.fn();
    useSessionMock.mockReturnValue({
      state: defaultState,
      startSession,
      giveFeedback: vi.fn(),
      endSession: vi.fn(),
      dispatch: vi.fn(),
      connectionStatus: 'connected',
      gapFillerPaused: false,
      timer: '00:00:00',
      audioError: null,
      speechError: null,
      displayMode: 'lecture' as const,
      setDisplayMode: vi.fn(),
    });
    render(<SessionEndScreen />);
    const btn = screen.getByTestId('new-session-button');
    expect(btn).toHaveTextContent(/NEW SESSION/);
    fireEvent.click(btn);
    expect(startSession).toHaveBeenCalled();
  });

  it('does not show Save as PDF button when there are no captions', () => {
    // defaultState already has captions: []
    render(<SessionEndScreen />);
    expect(screen.queryByTestId('save-pdf-button')).not.toBeInTheDocument();
  });

  it('does not show Save as PDF button when sessionEndTime is missing', () => {
    useSessionMock.mockReturnValue({
      state: { ...defaultState, captions: [
        {
          id: 'line1',
          words: [{ text: 'Hello.', type: 'confirmed' as const, confidence: 1.0, flagged: false }],
          isFinalized: true,
          gapFillerApplied: false,
        },
      ], sessionEndTime: null },
      startSession: vi.fn(),
      giveFeedback: vi.fn(),
      endSession: vi.fn(),
      dispatch: vi.fn(),
      connectionStatus: 'connected',
      gapFillerPaused: false,
      timer: '00:00:00',
      audioError: null,
      speechError: null,
      displayMode: 'lecture' as const,
      setDisplayMode: vi.fn(),
    });
    render(<SessionEndScreen />);
    expect(screen.queryByTestId('save-pdf-button')).not.toBeInTheDocument();
  });

  it('shows Save as PDF button when session has captions and start/end times', () => {
    const captionLine = {
      id: 'line1',
      words: [{ text: 'Hello.', type: 'confirmed' as const, confidence: 1.0, flagged: false }],
      isFinalized: true,
      gapFillerApplied: false,
    };
    useSessionMock.mockReturnValue({
      state: {
        ...defaultState,
        captions: [captionLine],
        sessionStartTime: Date.now() - 60000,
        sessionEndTime: Date.now(),
      },
      startSession: vi.fn(),
      giveFeedback: vi.fn(),
      endSession: vi.fn(),
      dispatch: vi.fn(),
      connectionStatus: 'connected',
      gapFillerPaused: false,
      timer: '00:01:00',
      audioError: null,
      speechError: null,
      displayMode: 'lecture' as const,
      setDisplayMode: vi.fn(),
    });
    render(<SessionEndScreen />);
    expect(screen.getByTestId('save-pdf-button')).toBeInTheDocument();
  });

  it('calls printTranscript when Save as PDF button is clicked', () => {
    const sessionStartTime = Date.now() - 60000;
    const sessionEndTime = Date.now();
    const captionLine = {
      id: 'line1',
      words: [{ text: 'Hello.', type: 'confirmed' as const, confidence: 1.0, flagged: false }],
      isFinalized: true,
      gapFillerApplied: false,
    };
    useSessionMock.mockReturnValue({
      state: {
        ...defaultState,
        captions: [captionLine],
        sessionStartTime,
        sessionEndTime,
      },
      startSession: vi.fn(),
      giveFeedback: vi.fn(),
      endSession: vi.fn(),
      dispatch: vi.fn(),
      connectionStatus: 'connected',
      gapFillerPaused: false,
      timer: '00:01:00',
      audioError: null,
      speechError: null,
      displayMode: 'lecture' as const,
      setDisplayMode: vi.fn(),
    });
    render(<SessionEndScreen />);
    fireEvent.click(screen.getByTestId('save-pdf-button'));
    expect(printTranscriptMock).toHaveBeenCalledTimes(1);
    expect(printTranscriptMock).toHaveBeenCalledWith({
      captions: [captionLine],
      sessionStartTime,
      sessionEndTime,
    });
  });
});
