// Confidence thresholds
export const CONFIDENCE_HIGH = 0.9;
export const CONFIDENCE_MEDIUM = 0.7;

// Colors (used as Tailwind class references and raw hex for CSS)
export const COLOR_BG = '#1a1a2e';
export const COLOR_TEXT = '#ffffff';
export const COLOR_PREDICTED_BG = 'rgba(59, 130, 246, 0.3)'; // blue-500 30%
export const COLOR_UNCERTAIN_TEXT = '#f59e0b'; // amber-400
export const COLOR_FLAGGED_BORDER = '#ef4444'; // red-500

// Session config
export const SILENCE_RESTART_MS = 5000; // iOS STT auto-restart after silence
export const RECONNECT_INTERVAL_MS = 2000;
export const GAP_FILLER_RATE_LIMIT_PAUSE_MS = 60000;

// Gap Filler context window (number of previous sentences sent to Gemini)
export const GAP_FILLER_CONTEXT_SIZE = 5;

// FIFO caption stage (Week 2 multi-speaker)
export const MAX_LINES = 8;
export const MAX_WORDS_PER_LINE = 8;

// Cap in-session caption lines so state doesn't grow unbounded (reduces remount/chop risk)
export const MAX_CAPTION_LINES = 150;

// Display mode: lecture (one style, flowing) vs group (color boxes per speaker)
export const DISPLAY_MODE_KEY = 'livecaptionspro_display_mode';
export type DisplayMode = 'lecture' | 'group';
