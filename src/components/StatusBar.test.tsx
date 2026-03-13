import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  it('shows LISTENING when connected', () => {
    render(<StatusBar connectionStatus="connected" timer="00:00:05" gapFillerPaused={false} />);
    expect(screen.getByText(/listening/i)).toBeInTheDocument();
  });

  it('shows reconnecting state', () => {
    render(<StatusBar connectionStatus="reconnecting" timer="00:01:00" gapFillerPaused={false} />);
    expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
  });

  it('shows connection lost state', () => {
    render(<StatusBar connectionStatus="lost" timer="00:02:00" gapFillerPaused={false} />);
    expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
  });

  it('displays session timer', () => {
    render(<StatusBar connectionStatus="connected" timer="00:12:34" gapFillerPaused={false} />);
    expect(screen.getByText('00:12:34')).toBeInTheDocument();
  });

  it('does not show AI enhancement paused in status bar (label hidden)', () => {
    render(<StatusBar connectionStatus="connected" timer="00:00:00" gapFillerPaused={true} />);
    expect(screen.queryByText(/AI enhancement paused/i)).not.toBeInTheDocument();
  });
});
