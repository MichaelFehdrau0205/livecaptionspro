'use client';

interface ControlBarProps {
  onEndSession: () => void;
  onPause: () => void;
  onResume: () => void;
  connectionStatus: 'connected' | 'reconnecting' | 'lost';
  sessionStatus: 'listening' | 'paused' | 'reconnecting';
}

export function ControlBar({ onEndSession, onPause, onResume, connectionStatus, sessionStatus }: ControlBarProps) {
  const isActive = connectionStatus === 'connected';
  const isPaused = sessionStatus === 'paused';

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-4 border-t border-white/10 bg-[#1a1a2e]"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      data-testid="control-bar"
    >
      {/* Mic indicator */}
      <div className="flex items-center gap-2 min-w-[56px]" aria-label="Microphone status">
        <span
          className={`text-2xl ${isActive && !isPaused ? 'text-red-500' : 'text-gray-500'}`}
          aria-hidden="true"
        >
          {isActive && !isPaused ? '🔴' : '⭕'}
        </span>
        <span className="text-xs text-white/50 uppercase tracking-widest">
          {isPaused ? 'Paused' : isActive ? 'Mic on' : 'Off'}
        </span>
      </div>

      {/* Pause / Resume */}
      <button
        onClick={isPaused ? onResume : onPause}
        data-testid={isPaused ? 'resume-button' : 'pause-button'}
        className="flex-1 py-4 rounded-2xl border-2 border-white/30 text-white font-bold tracking-wide
          hover:border-white/60 active:scale-95 transition-all min-h-[56px] text-base"
        aria-label={isPaused ? 'Resume captioning' : 'Pause captioning'}
      >
        {isPaused ? 'RESUME' : 'PAUSE'}
      </button>

      {/* End session */}
      <button
        onClick={onEndSession}
        data-testid="end-session-button"
        className="flex-1 py-4 rounded-2xl border-2 border-white/20 text-white/60 font-bold tracking-wide
          hover:border-white/40 hover:text-white/80 active:scale-95 transition-all min-h-[56px] text-base"
        aria-label="End captioning session"
      >
        END
      </button>
    </div>
  );
}
