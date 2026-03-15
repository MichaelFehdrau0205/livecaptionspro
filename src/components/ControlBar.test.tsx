import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlBar } from './ControlBar';

const defaultProps = {
  onEndSession: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  connectionStatus: 'connected' as const,
  sessionStatus: 'listening' as const,
};

describe('ControlBar', () => {
  it('renders control bar', () => {
    render(<ControlBar {...defaultProps} />);
    expect(screen.getByTestId('control-bar')).toBeInTheDocument();
  });

  it('shows mic on when connected and listening', () => {
    render(<ControlBar {...defaultProps} connectionStatus="connected" sessionStatus="listening" />);
    expect(screen.getByText(/Mic on/i)).toBeInTheDocument();
  });

  it('shows mic off when not connected', () => {
    render(<ControlBar {...defaultProps} connectionStatus="lost" />);
    expect(screen.getByText(/Off/)).toBeInTheDocument();
  });

  it('calls onEndSession when end session button is clicked', () => {
    const onEndSession = vi.fn();
    render(<ControlBar {...defaultProps} onEndSession={onEndSession} />);
    fireEvent.click(screen.getByTestId('end-session-button'));
    expect(onEndSession).toHaveBeenCalledTimes(1);
  });

  it('end session button has accessible label', () => {
    render(<ControlBar {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /End captioning session/i });
    expect(btn).toBeInTheDocument();
  });

  it('mic indicator has adequate touch target', () => {
    render(<ControlBar {...defaultProps} />);
    const endBtn = screen.getByTestId('end-session-button');
    expect(endBtn).toHaveClass('min-h-[56px]');
  });

  it('shows PAUSE button when listening', () => {
    render(<ControlBar {...defaultProps} sessionStatus="listening" />);
    expect(screen.getByTestId('pause-button')).toBeInTheDocument();
    expect(screen.getByTestId('pause-button')).toHaveTextContent('PAUSE');
  });

  it('shows RESUME button when paused', () => {
    render(<ControlBar {...defaultProps} sessionStatus="paused" />);
    expect(screen.getByTestId('resume-button')).toBeInTheDocument();
    expect(screen.getByTestId('resume-button')).toHaveTextContent('RESUME');
  });

  it('calls onPause when PAUSE button is clicked', () => {
    const onPause = vi.fn();
    render(<ControlBar {...defaultProps} onPause={onPause} sessionStatus="listening" />);
    fireEvent.click(screen.getByTestId('pause-button'));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('calls onResume when RESUME button is clicked', () => {
    const onResume = vi.fn();
    render(<ControlBar {...defaultProps} onResume={onResume} sessionStatus="paused" />);
    fireEvent.click(screen.getByTestId('resume-button'));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('mic indicator shows Paused when session is paused', () => {
    render(<ControlBar {...defaultProps} sessionStatus="paused" />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('end session button is always present regardless of session status', () => {
    const { rerender } = render(<ControlBar {...defaultProps} sessionStatus="listening" />);
    expect(screen.getByTestId('end-session-button')).toBeInTheDocument();
    rerender(<ControlBar {...defaultProps} sessionStatus="paused" />);
    expect(screen.getByTestId('end-session-button')).toBeInTheDocument();
  });
});
