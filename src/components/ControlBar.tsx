'use client';

interface ControlBarProps {
  onEndSession: () => void;
  connectionStatus: 'connected' | 'reconnecting' | 'lost';
}

export function ControlBar({ onEndSession, connectionStatus }: ControlBarProps) {
  const isActive = connectionStatus === 'connected';

  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-4 border-t border-white/10 bg-[#1a1a2e]"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      data-testid="control-bar"
    >
      {/* Mic indicator */}
      <div className="flex items-center gap-2 min-w-[56px]" aria-label="Microphone status">
        <span
          className={`text-2xl ${isActive ? 'text-red-500' : 'text-gray-500'}`}
          aria-hidden="true"
        >
          {isActive ? '🔴' : '⭕'}
        </span>
        <span className="text-xs text-white/50 uppercase tracking-widest">
          {isActive ? 'Mic on' : 'Off'}
        </span>
      </div>

      {/* End session button */}
      <button
        onClick={onEndSession}
        data-testid="end-session-button"
        className="flex-1 py-4 rounded-2xl border-2 border-white/30 text-white font-bold tracking-wide
          hover:border-white/60 active:scale-95 transition-all min-h-[56px] text-base"
        aria-label="End captioning session"
      >
        END SESSION
      </button>
    </div>
  );
}
