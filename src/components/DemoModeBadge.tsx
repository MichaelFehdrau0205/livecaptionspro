'use client';

/**
 * Shown in the session UI when no Deepgram key is set and the app
 * falls back to Web Speech API (no real-time per-word confidence).
 */
export function DemoModeBadge() {
  return (
    <span
      className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border border-white/20 text-white/40"
      title="Using Web Speech API — add a Deepgram key in Settings for real-time confidence"
      data-testid="demo-mode-badge"
    >
      Demo
    </span>
  );
}
