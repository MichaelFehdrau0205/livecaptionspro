'use client';

/**
 * Static HTML fallback so Safari shows something before React paints.
 * Uses CSS classes only (no inline styles) to avoid server/client hydration mismatch.
 * START CAPTIONING links to /new-session (microphone page), then Allow → live session → end session page.
 */
export function StaticStartFallback() {
  return (
    <div
      id="static-start-fallback"
      className="static-start-fallback absolute inset-0 z-[5] min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] text-white px-6 py-8 text-center"
      aria-hidden="true"
    >
      <div className="static-start-fallback-inner">
        <h1 className="static-start-fallback-title">Live Captions Pro</h1>
        <p className="static-start-fallback-tagline">
          Real-time captions with zero lost meaning.
        </p>
        <a
          href="/new-session"
          data-testid="start-button"
          className="static-start-fallback-btn"
        >
          START CAPTIONING
        </a>
      </div>
    </div>
  );
}
