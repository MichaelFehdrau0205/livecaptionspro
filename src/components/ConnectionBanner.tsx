'use client';

interface ConnectionBannerProps {
  status: 'connected' | 'reconnecting' | 'lost';
}

export function ConnectionBanner({ status }: ConnectionBannerProps) {
  if (status === 'connected') return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border-b border-amber-500/40 text-amber-300 text-sm"
      role="alert"
      data-testid="connection-banner"
    >
      <span aria-hidden="true">⚠</span>
      <span>
        {status === 'reconnecting'
          ? 'Connection lost — reconnecting...'
          : 'Connection lost'}
      </span>
    </div>
  );
}
