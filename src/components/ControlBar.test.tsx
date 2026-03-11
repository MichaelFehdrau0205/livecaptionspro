import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlBar } from './ControlBar';

describe('ControlBar', () => {
  it('renders control bar', () => {
    render(<ControlBar onEndSession={vi.fn()} connectionStatus="connected" />);
    expect(screen.getByTestId('control-bar')).toBeInTheDocument();
  });

  it('shows mic on when connected', () => {
    render(<ControlBar onEndSession={vi.fn()} connectionStatus="connected" />);
    expect(screen.getByText(/Mic on/i)).toBeInTheDocument();
  });

  it('shows mic off when not connected', () => {
    render(<ControlBar onEndSession={vi.fn()} connectionStatus="lost" />);
    expect(screen.getByText(/Off/)).toBeInTheDocument();
  });

  it('calls onEndSession when end session button is clicked', () => {
    const onEndSession = vi.fn();
    render(<ControlBar onEndSession={onEndSession} connectionStatus="connected" />);
    fireEvent.click(screen.getByTestId('end-session-button'));
    expect(onEndSession).toHaveBeenCalledTimes(1);
  });

  it('end session button has accessible label', () => {
    render(<ControlBar onEndSession={vi.fn()} connectionStatus="connected" />);
    const btn = screen.getByRole('button', { name: /End captioning session/i });
    expect(btn).toBeInTheDocument();
  });

  it('mic indicator has adequate touch target', () => {
    render(<ControlBar onEndSession={vi.fn()} connectionStatus="connected" />);
    const endBtn = screen.getByTestId('end-session-button');
    expect(endBtn).toHaveClass('min-h-[56px]');
  });
});
