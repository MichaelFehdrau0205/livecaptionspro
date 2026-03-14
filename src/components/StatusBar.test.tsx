import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  it('displays session timer', () => {
    render(<StatusBar connectionStatus="connected" timer="00:12:34" />);
    expect(screen.getByText('00:12:34')).toBeInTheDocument();
  });

  it('shows Demo badge when not Deepgram', () => {
    render(<StatusBar connectionStatus="connected" timer="00:00:00" isDeepgramActive={false} />);
    expect(screen.getByTestId('demo-mode-badge')).toBeInTheDocument();
  });

  it('hides Demo badge when Deepgram active', () => {
    render(<StatusBar connectionStatus="connected" timer="00:00:00" isDeepgramActive={true} />);
    expect(screen.queryByTestId('demo-mode-badge')).not.toBeInTheDocument();
  });

  it('renders status bar with test id', () => {
    render(<StatusBar connectionStatus="connected" timer="00:00:00" />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });
});
