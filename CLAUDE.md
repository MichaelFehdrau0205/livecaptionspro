# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Unit tests (Vitest, run once)
npm run test:watch   # Unit tests in watch mode
npm run test:e2e     # Playwright E2E (auto-starts dev server)
```

**Run a single test file:**
```bash
npx vitest run src/hooks/useGapFiller.test.ts
```

**Run a single E2E test:**
```bash
npx playwright test e2e/session.spec.ts
```

**Required env var for local dev:** `GEMINI_API_KEY` in `.env.local`. Without it, the Gap Filler falls back to pass-through (all words marked `confirmed`, no color corrections).

## Architecture

### Session State Flow

All session state lives in `src/context/SessionContext.tsx` via `useReducer` + `captionReducer`. The context wires together 6 hooks and exposes `startSession` / `endSession` to components.

```
User taps Start
  → useAudioPipeline (getUserMedia → AudioContext → RNNoise AudioWorklet)
  → useSpeechRecognition (Web Speech API)
      → interim results → dispatch ADD_INTERIM
      → final results   → dispatch FINALIZE_LINE
                        → useGapFiller (async POST /api/gap-filler)
                            → dispatch APPLY_GAP_FILLER (updates word colors)
```

`useConnectionStatus` watches `navigator.onLine`. When connection drops, `SessionContext` stops STT; on reconnect, it restarts STT and calls `useGapFiller.flushQueue()` to retry any sentences that failed offline.

### Caption State Shape

```typescript
// src/types/index.ts
SessionState → captions: CaptionLine[]
CaptionLine  → words: CaptionWord[] + interim: string + isFinalized + gapFillerApplied
CaptionWord  → text + type ('confirmed'|'predicted'|'uncertain') + confidence + flagged
```

Word `type` drives the color rendering in `CaptionLine.tsx`. Thresholds are in `src/lib/constants.ts` (`CONFIDENCE_HIGH = 0.9`, `CONFIDENCE_MEDIUM = 0.7`).

### Gap Filler Pipeline

`POST /api/gap-filler` is the only server-side endpoint. It:
1. Calls Gemini 2.5 Flash with the finalized sentence + last 5 sentences of context
2. Returns `{ correctedSentence, words[] }` with confidence scores
3. Has a 15s timeout, rate-limit (429) detection, and one JSON-parse retry
4. Falls back to returning the original sentence as all-`confirmed` on any failure

The Gemini prompt template is in `src/lib/geminiPrompt.ts`. Parsing is in `src/lib/gapFillerParser.ts`.

### Audio Pipeline & RNNoise

`public/audio-processor.js` is an ES module AudioWorklet. It imports `public/rnnoise-sync.js` (emscripten glue from `@jitsi/rnnoise-wasm`) which loads `public/rnnoise.wasm`. The worklet buffers 128-sample Web Audio blocks into 480-sample RNNoise frames, processes them, and falls back to pass-through if WASM fails.

`useAudioPipeline.ts` loads the worklet with `{ type: 'module' }` — this is required.

### PWA / Service Worker

`public/sw.js` uses three caching strategies:
- `/_next/static/*` → cache-first (content-hashed filenames)
- HTML navigation → network-first
- `/api/*` → network only (never cached)

Cache version is `livecaptionspro-v2`. Bump the version string in `sw.js` when deploying breaking changes.

## File Ownership (two-person team)

**Michael** owns: `src/components/*`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `e2e/*`, `public/splash/`, `public/manifest.json`

**Luba** owns: `src/hooks/*`, `src/app/api/*`, `src/context/*`, `src/lib/*`, `public/sw.js`, `public/audio-processor.js`, `.github/*`

**Shared** (coordinate before editing): `src/types/index.ts`, `package.json`

## Testing Notes

- Unit tests use `jsdom` environment and are colocated with source files (`*.test.ts` / `*.test.tsx`)
- `@` path alias resolves to `src/` in both app code and tests
- When mocking constructors (e.g. `SpeechRecognition`, `AudioContext`), use `vi.fn(function() { ... })` — arrow functions are not constructable
- When using `vi.useFakeTimers()`, avoid `waitFor` for async state that resolves via promises; use `vi.useRealTimers()` inside those specific tests instead
- `mockReturnValueOnce` doesn't override constructor return values — use `mockImplementationOnce(function() { return obj; })` instead
- E2E tests run against a live dev server; Playwright auto-starts it via `webServer` config

## Key Constants

`src/lib/constants.ts`:
- `SILENCE_RESTART_MS = 5000` — iOS STT auto-restart after silence
- `RECONNECT_INTERVAL_MS = 2000` — connection retry interval
- `GAP_FILLER_RATE_LIMIT_PAUSE_MS = 60000` — pause after Gemini 429

## Hook Return Values

| Hook | Returns |
|------|---------|
| `useSpeechRecognition(callbacks)` | `{ status: 'idle'\|'listening'\|'error', start(), stop() }` |
| `useAudioPipeline()` | `{ status: 'idle'\|'initializing'\|'active'\|'error', error: string\|null, start(), stop() }` |
| `useGapFiller({ onResult })` | `{ fill(lineId, sentence), paused: boolean, flushQueue() }` |
| `useConnectionStatus()` | `'connected'\|'reconnecting'\|'lost'` |
| `useWakeLock(active: boolean)` | `void` — side-effect only |
| `useSessionTimer(startTime: number\|null)` | `string` — formatted `'HH:MM:SS'` |

**Type note:** `SpeechRecognitionStatus` (`'idle'|'listening'|'error'`) from `useSpeechRecognition` is intentionally separate from `SessionStatus` (`'idle'|'listening'|'paused'|'reconnecting'|'ended'`) in the reducer. The hook has a simpler state machine; `SessionContext` maps between them.

## Caption Reducer Actions

Defined in `src/lib/captionReducer.ts`, dispatched via `SessionContext`:

| Action | What it does |
|--------|--------------|
| `START_SESSION` | Sets status to `'listening'`, records `sessionStartTime`, clears captions |
| `ADD_INTERIM` | Updates `currentInterim` (live gray text, not yet a line) |
| `FINALIZE_LINE` | Converts `currentInterim` into a new `CaptionLine` with all words as `'confirmed'`, clears interim |
| `APPLY_GAP_FILLER` | Replaces words on a finalized line with Gemini-corrected words (updates `type` + `confidence`), sets `gapFillerApplied: true` |
| `FLAG_WORD` | Toggles `flagged: true` on a specific word (drives red underline) |
| `END_SESSION` | Sets status to `'ended'`, preserves captions and stats for SessionEndScreen |
