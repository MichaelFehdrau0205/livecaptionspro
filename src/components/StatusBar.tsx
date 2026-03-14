'use client';

import { DemoModeBadge } from './DemoModeBadge';

interface StatusBarProps {
  connectionStatus: 'connected' | 'reconnecting' | 'lost';
  timer: string;
  /** Not shown in UI — AI enhancement paused state is intentionally hidden. */
  gapFillerPaused?: boolean;
  isDeepgramActive?: boolean;
}

export function StatusBar({ connectionStatus, timer, isDeepgramActive }: StatusBarProps) {
  const isConnected = connectionStatus === 'connected';

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1a1a2e]"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      data-testid="status-bar"
    >
      {/* Listening indicator */}
      <div className="flex items-center gap-2" data-testid="listening-indicator" aria-live="polite" aria-label={connectionStatus === 'connected' ? 'Listening' : connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Connection lost'}>
        <span
          className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}
          aria-hidden="true"
        />
        <span className="text-sm font-semibold tracking-widest text-white/80 uppercase">
          {connectionStatus === 'connected'
            ? 'Listening'
            : connectionStatus === 'reconnecting'
              ? 'Reconnecting...'
              : 'Connection Lost'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!isDeepgramActive && <DemoModeBadge />}
        {/* Timer */}
        <span className="text-sm font-mono text-white/60" data-testid="session-timer">
          {timer}
        </span>
      </div>
    </div>
  );
}
