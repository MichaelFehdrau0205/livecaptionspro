'use client';

import { DemoModeBadge } from './DemoModeBadge';

interface StatusBarProps {
  connectionStatus: 'connected' | 'reconnecting' | 'lost';
  timer: string;
  isDeepgramActive?: boolean;
}

export function StatusBar({ connectionStatus, timer, isDeepgramActive }: StatusBarProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 border-b border-white/10 bg-[#1a1a2e]"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      data-testid="status-bar"
    >
      <div className="flex items-center gap-3 flex-wrap">
        {!isDeepgramActive && <DemoModeBadge />}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono text-white/60" data-testid="session-timer">{timer}</span>
      </div>
    </div>
  );
}
