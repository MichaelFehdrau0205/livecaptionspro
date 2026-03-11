# Live Captions Pro — 2-Week Sprint Plan (Luba & Michael)

**Branch:** `lubaPlan`
**Start Date:** March 10, 2026
**Reference:** TDD.md, PRD2.md, PRD3.md
**Week 1 = MVP. Ship here if time runs short. Week 2 = V2 features.**

---

## Current Status Audit

### What's DONE (scaffolding + basic wiring)
| Area | Status | Details |
|------|--------|---------|
| Project scaffold | Done | Next.js 16, TypeScript, Tailwind 4, Vitest, Playwright |
| PWA manifest + icons | Done | manifest.json, icons (192 + 512), register-sw.js |
| CI/CD pipeline | Done | `.github/workflows/ci.yml` — lint + unit + e2e |
| Types + constants | Done | `src/types/index.ts`, `src/lib/constants.ts` |
| Caption reducer | Done | `captionReducer.ts` + 11 tests |
| Gap filler parser | Done | `gapFillerParser.ts` + 9 tests |
| Gemini prompt template | Done | `geminiPrompt.ts` |
| API route shell | Done | `POST /api/gap-filler` — basic Gemini call + fallback |
| SessionContext wiring | Done | Connects reducer + hooks |
| 6 custom hooks (basic) | Done | All exist with basic logic |
| Component shells | Done | All components render, basic layout works |
| 5 test files | Done | 37 tests passing (CaptionLine, StartScreen, StatusBar, captionReducer, gapFillerParser) |
| E2E test shells | Done | session.spec.ts + mobile.spec.ts exist |

### What's BROKEN or INCOMPLETE (P0 features from PRD)

| # | Gap | What's wrong | PRD requirement |
|---|-----|-------------|-----------------|
| 1 | **RNNoise is a placeholder** | `audio-processor.js` is a pass-through — does zero noise suppression | "RNNoise WASM for noise suppression" |
| 2 | **STT doesn't restart on reconnect** | `useConnectionStatus` detects online/offline, but `SessionContext` never reacts | "Captions auto-resume on reconnection" |
| 3 | **Gap Filler doesn't queue offline** | If offline when a sentence finalizes, sentence is lost forever | "Gap Filler queues unsent sentences and processes them on reconnection" |
| 4 | **Feedback buttons do nothing** | SessionEndScreen YES/NO buttons have no `onClick` | "End-of-session 'Did you miss anything?' prompt" |
| 5 | **No mic permission pre-prompt** | `startSession` calls `getUserMedia` directly with no explanation UI | "Show pre-prompt UI explaining why mic is needed" |
| 6 | **domain param unused** | API route destructures `domain` but never passes it to Gemini prompt | "Education/lecture domain hints" |
| 7 | **Service worker is minimal** | Only caches `/` and `/manifest.json` | "Service worker caches app shell for instant repeat loads" |
| 8 | **No iOS splash screens** | `public/splash/` directory doesn't exist | TDD specifies splash screens for iOS |
| 9 | **Not deployed** | No Vercel deployment, no env vars set, no production URL | "Deploy to Vercel" |
| 10 | **8 test files missing** | TDD specifies test files that don't exist | Testing strategy in TDD |
| 11 | **No accessibility audit done** | Components have some aria-labels but no systematic audit | "WCAG AA, Lighthouse > 90" |

---

## Work Split Strategy

**Michael = UI / Components / UX / E2E / Accessibility / Real Device Testing**
**Luba = Hooks / API / Audio Pipeline / Infra / Deployment / Backend Tests**

This keeps each person in separate files to minimize merge conflicts.

| Owner | Files they own |
|-------|---------------|
| **Michael** | `src/components/*`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `e2e/*`, `public/splash/`, `public/manifest.json` |
| **Luba** | `src/hooks/*`, `src/app/api/*`, `src/context/*`, `src/lib/*`, `public/sw.js`, `public/audio-processor.js`, `.github/*`, Vercel config, `server/*` (Week 2) |

**Shared** (coordinate before editing): `src/types/index.ts`, `package.json`

---

## Sync Points — When You Need to Coordinate

| Day | Sync needed | Why | How long |
|-----|------------|-----|----------|
| Day 1 start | Types sync | Both touching `src/types/index.ts` | 10 min chat — Luba commits types first, Michael adds `feedbackGiven` after |
| Day 3 start | Michael pulls Luba's branch | Michael writes `SessionContext.test.tsx` but Luba has been modifying `SessionContext.tsx` | Pull before writing tests |
| Day 4 start | Luba merges Days 1–3 PRs | Michael's E2E tests need STT reconnect + gap filler queue to actually work | Luba merges by end of Day 3 |
| Day 9 start | API contract for session server | Michael builds viewer app, needs to know WebSocket message format | 30 min — agree on message schema before Day 8 |
| Day 10 | Integration day | Deepgram + FIFO + viewer all working together | Work together, not in parallel |

**Day-to-day: 90% parallel.** File ownership is the protection.

---

## Pre-Requisite: Gemini API Key

The Gap Filler requires a Google Gemini API key. Without it, every word shows as plain white — no corrections, no colors.

**How to get it (free):**
1. Go to Google AI Studio (aistudio.google.com)
2. Sign in → "Get API Key" → "Create API key"
3. Free tier: Gemini 2.5 Flash — 250 requests/day, 10 requests/minute

**Where to set it:**
- **Local dev**: `.env.local` → `GEMINI_API_KEY=your_key_here`
- **Vercel (Day 4)**: Settings → Environment Variables → add `GEMINI_API_KEY`

`.env.local` is already in `.gitignore` — never commit API keys.

---

## Color-Coded Confidence Highlighting

| Word Type | Color | When |
|-----------|-------|------|
| **Confirmed** (>90%) | White | Gemini agrees the word is correct |
| **Uncertain** (70–90%) | Amber/orange | Gemini thinks the word might be wrong |
| **Predicted** (<70% or AI-filled) | Blue bg + blue underline | Gemini added or replaced a word |
| **Flagged** (user tapped) | Red underline | User tapped a word to flag it |

Code: `gapFillerParser.ts:11-28` (classification), `CaptionLine.tsx:14-20` (rendering), `constants.ts:2-3` (thresholds).

---

---

# WEEK 1 — MVP (Days 1–5)
### Stop here if time runs short. This ships a working, deployed app.

---

### Day 1 (Tue, Mar 10) — Fix Critical Feature Gaps

> **Sync at start of day:** Luba commits type changes to `src/types/index.ts` first, then Michael adds `feedbackGiven`.

**Michael — Mic Permission UX + Feedback Buttons + Component Tests**
- [ ] **Build mic permission pre-prompt modal** in `StartScreen.tsx`
  - Before calling `startSession`, show dialog: "Live Captions Pro needs microphone access. Your audio is processed locally — no audio is sent to our servers."
  - "Allow Microphone" button → calls `startSession` → triggers `getUserMedia`
  - Handle denial gracefully (show error message, let user retry)
  - Auto-detect previously granted permission via `navigator.permissions`
- [ ] **Wire up feedback buttons** in `SessionEndScreen.tsx`
  - YES button: show "Thanks for your feedback!", track in session stats
  - NO button: show "Great!", track in session stats
  - Add `feedbackGiven: 'yes' | 'no' | null` to `SessionState`
- [ ] **Write `SessionEndScreen.test.tsx`** — renders stats, buttons work, feedback flow
- [ ] **Write `ControlBar.test.tsx`** — mic indicator states, end session fires

**Luba — STT Auto-Reconnect + Gap Filler Queue**
- [ ] **Implement STT auto-restart on reconnect** in `SessionContext.tsx`
  - Watch `connectionStatus` — when it transitions 'lost'/'reconnecting' → 'connected', call `startSTT()` again
  - When it transitions to 'lost', call `stopSTT()`
  - Show status transitions in StatusBar automatically
- [ ] **Implement Gap Filler offline queue** in `useGapFiller.ts`
  - When fetch fails due to network, push `{ lineId, sentence }` to a queue (ref)
  - Expose a `flushQueue()` function
  - In `SessionContext`, call `flushQueue()` when connection restores
- [ ] **Fix domain param** in `route.ts` — pass it into `buildGeminiPrompt()` or remove destructure
- [ ] **Write `useConnectionStatus.test.ts`** — online/offline transitions, reconnect timer

---

### Day 2 (Wed, Mar 11) — PWA Polish + Caption UX + Core Tests

**Michael — Caption UX Polish + iOS Splash + Component Tests**
- [ ] **Add iOS splash screen images** to `public/splash/`
  - Generate splash screens for iPhone SE, 13/14/15, iPad
  - Add `<link rel="apple-touch-startup-image">` tags to `layout.tsx`
- [ ] **Polish caption display UX**
  - Is interim text (gray/italic) readable? Adjust opacity/style if needed
  - Is the blinking cursor helpful or distracting? Tune or remove
  - Does auto-scroll feel natural? Test with rapid speech
  - Is predicted word highlight (blue bg + underline) clear but not overwhelming?
- [ ] **Write `CaptionArea.test.tsx`** — renders lines, shows interim text, auto-scroll
- [ ] **Write `SessionScreen.test.tsx`** — renders StatusBar/CaptionArea/ControlBar, flag word works

**Luba — RNNoise + Service Worker + Hook Tests**
- [x] **Integrate real RNNoise WASM** into `public/audio-processor.js`
  - Uses `@jitsi/rnnoise-wasm` — `rnnoise-sync.js` + `rnnoise.wasm` copied to `public/`
  - AudioWorklet loads as ES module (`{ type: 'module' }`), processes 480-sample frames
  - Falls back to pass-through if WASM unavailable
- [ ] **Enhance service worker** (`public/sw.js`)
  - Cache all static assets (JS bundles, CSS, fonts, icons)
  - Network-first for API routes, cache-first for static assets
  - Add version bump mechanism for cache invalidation
- [ ] **Write `useSpeechRecognition.test.ts`**
  - Mock SpeechRecognition constructor
  - Test onInterim/onFinal callbacks, auto-restart on unexpected end (iOS), unsupported browser
- [ ] **Write `useAudioPipeline.test.ts`**
  - Mock getUserMedia + AudioContext
  - Test start/stop lifecycle + cleanup, permission denied error handling

---

### Day 3 (Thu, Mar 12) — Accessibility + Integration Tests + Polish

> **Sync at start of day:** Michael pulls Luba's branch before writing `SessionContext.test.tsx`.

**Michael — Accessibility Audit + UI Polish**
- [ ] **Full accessibility audit** on all components
  - Verify `aria-live="polite"` on CaptionArea
  - Verify all buttons have `aria-label`
  - Verify color contrast WCAG AA: 4.5:1 for body text, 3:1 for large text
  - Predicted words: verify both underline AND highlight
  - Uncertain/orange words: verify contrast against dark background
- [ ] **Touch target audit** — all interactive elements min 44×44px
  - CaptionLine words: currently `inline` spans — may be too small. Add padding.
  - ControlBar, Start/End buttons: currently min-h-[56px] ✓
- [ ] **Safe area insets** — verify `env(safe-area-inset-bottom)` on ControlBar, add `env(safe-area-inset-top)` to StatusBar
- [ ] **Run Lighthouse audit**, fix issues (target: PWA > 90, Accessibility > 90)
- [ ] **Write `SessionContext.test.tsx`** — full integration: start/end session, gap filler dispatch

**Luba — API Integration Tests + Gap Filler Hardening**
- [ ] **Write `route.integration.test.ts`** for `/api/gap-filler`
  - Mock GoogleGenerativeAI — test correct Gemini call
  - Test timeout (>5s → fallback), rate limit (429 → fallback + rateLimited flag)
  - Test malformed JSON → retry once → fallback, missing sentence → 400, missing API key → graceful fallback
- [ ] **Write `useGapFiller.test.ts`**
  - Test fetch call, onResult callback, rate limit pause, offline queue + flush
- [ ] **Write `useWakeLock.test.ts`** + **`useSessionTimer.test.ts`**
- [ ] **Harden gap filler error messages** — better logging for production debugging

---

### Day 4 (Fri, Mar 13) — E2E Tests + Deployment

> **Sync at start of day:** Luba merges Days 1–3 PRs so Michael's E2E tests run against real features.

**Michael — E2E Test Suite**
- [ ] **Expand `e2e/session.spec.ts`**
  - Full happy path: start → mic permission prompt → captions stream → gap filler highlights → end → stats
  - Test connection lost banner (mock offline event)
  - Test session timer increments
  - Test tap-to-flag word turns red
- [ ] **Expand `e2e/mobile.spec.ts`**
  - iPhone viewport (375×812): all touch targets >= 44px
  - Caption area scrolls to bottom on new text
  - ControlBar is in thumb-reachable zone
  - Verify safe area padding renders
- [ ] **Add `e2e/pwa.spec.ts`**
  - PWA manifest detected, service worker registers and activates
  - App shell loads from cache on repeat visit
- [ ] **Test mic pre-prompt dialog** in E2E — dialog shows, buttons work

**Luba — Vercel Deployment + Production Setup**
- [ ] **Deploy to Vercel**
  - Connect GitHub repo to Vercel
  - Set `GEMINI_API_KEY` in Vercel environment variables (production + preview)
  - Verify build succeeds
- [ ] **Test production deployment**
  - Verify `/api/gap-filler` works with real Gemini API
  - Verify PWA installs from production URL
  - Verify service worker caches correctly
- [ ] **Test preview deploys** — push a PR branch, verify Vercel preview URL works
- [ ] **Verify CI pipeline** — push a PR, confirm GitHub Actions runs lint + test + e2e

---

### Day 5 (Sat, Mar 14) — Real Device Testing + Bug Fixes + Launch

**Michael — Real Device Testing (most critical day)**
- [ ] **Test on real iPhone (Safari)** — full end-to-end:
  - Mic permission pre-prompt → does the explanation feel trustworthy?
  - AudioContext resume on tap (iOS requires user gesture)
  - STT auto-restart on silence (iOS stops after ~5s)
  - PWA "Add to Home Screen" → standalone mode
  - Caption display readability, auto-scroll, safe area insets
  - Tap-to-flag words, session end → stats
  - Gap filler corrections — do they improve comprehension?
- [ ] **Test with real speech** — sample lecture content:
  - Captions appear in < 1 second
  - Confidence highlighting readable at a glance
- [ ] **Test on iPad Safari** — portrait + landscape
- [ ] **Fix any UX bugs found** — prioritize reading experience
- [ ] **Run final Lighthouse PWA audit** — target score > 90

**Luba — Android Testing + Final Deploy + README**
- [ ] **Test on real Android device (Chrome)**
  - Mic permission flow, caption display, PWA install + standalone
  - Wake lock prevents screen dimming
  - Connection drop → banner → reconnect → STT resumes
- [ ] **Run full test suite** — fix any failures
- [ ] **Final production deploy**
- [ ] **Update README.md** — live URL, setup instructions, GEMINI_API_KEY setup, browser compatibility

---

### ✅ MVP DONE — Ship point. Everything below is Week 2.

---

---

# WEEK 2 — V2 Features (Days 6–10)
### Multi-speaker captions, Deepgram integration, shared session viewer.

> **Pre-Week 2 sync (30 min):** Agree on WebSocket message schema for session server before Day 8. Michael needs it for Day 9 viewer app.

---

### Day 6 (Mon, Mar 17) — FIFO Display + Deepgram Setup

**Michael — FIFO Data Model + DOM Renderer**
- [ ] **Define FIFO data model** in `src/types/index.ts`
  - `lines[]` array: `{ id, speakerId, words[], interim, done }`
  - `pushLine()` with MAX_LINES trim logic
  - `getLineOpacity()` decay function
  - Unit tests: empty queue, exactly MAX_LINES, overflow by 1, overflow by 3
- [ ] **Build `renderStage()`** with diff logic (add/remove by `data-lid`)
  - Bottom-anchored flex layout
  - `slideUp` entry animation
  - Test on iPhone SE (375px), iPhone 14 Pro (393px), iPad (768px), iPad Pro (1024px)

**Luba — Deepgram API Key Settings + WebSocket Connection**
- [ ] **Build API key settings panel** in a new settings component
  - Deepgram API key entry, masked after input (`••••••••xxxx`)
  - Persist key in `localStorage`, clear/reset button
  - Display estimated cost: `$0.0043/min`
- [ ] **Build `connectDeepgram(apiKey)`** in `src/hooks/useDeepgram.ts`
  - WebSocket connection with correct URL params
  - `onopen`, `onmessage`, `onerror`, `onclose` handlers
  - Show connection status in mic status bar

---

### Day 7 (Tue, Mar 18) — Word Tokens + Audio Pipeline

**Michael — Word Token Component + Speaker Profiles**
- [ ] **Build word token component**
  - Colored block token: speaker background + text color
  - Ghost/interim token: dashed border, reduced opacity
  - Blinking cursor token for active line end
  - Test word wrapping at narrow screen widths
- [ ] **Build speaker profiles**
  - Define 4 speaker objects: name, role, bg color, text color
  - Speaker selector buttons with active state styling
  - Wire speaker selection to `activeSpeakerId` state

**Luba — Audio Streaming Pipeline**
- [ ] **Implement PCM audio streaming** in `useDeepgram.ts`
  - `AudioContext` + `AudioWorkletNode` (or `ScriptProcessorNode`)
  - Float32 → Int16 PCM conversion
  - Send raw PCM chunks over WebSocket
- [ ] **Line break logic** — auto-break lines exceeding 8 words
  - Preserve readability at `clamp(20px, 4.5vw, 42px)` font size
  - Test with fast talkers and long sentences

---

### Day 8 (Wed, Mar 19) — Diarization + Session Server

> **Sync at end of day:** Confirm WebSocket message schema so Michael can build viewer on Day 9.

**Michael — Speaker Switching + Line Break UX**
- [ ] **Wire speaker switching** during live session
  - Tap speaker button → `currentLineId = null` → new caption line
  - New line immediately adopts new speaker color
  - Test rapid switching between speakers mid-sentence
- [ ] **Mic status indicators** — READY / LISTENING / WAITING / ERROR states
  - Show interim text in status bar as ghost preview
  - Show LIVE badge with pulsing dot while session is active
- [ ] **M2 QA pass** — test FIFO + speaker profiles end-to-end on device

**Luba — Diarization Mapping + Session Server**
- [ ] **Parse Deepgram diarization** in `useDeepgram.ts`
  - Parse `words[]` array with `speaker` field
  - Group consecutive same-speaker words into caption line segments
  - Map `speaker 0–3` → `speakerId 1–4`
  - Handle mid-sentence speaker change (flush buffer, start new line)
- [ ] **Deepgram reconnection** — exponential backoff: 1s → 2s → 4s
  - Show "RECONNECTING" status, reset retry delay on success
  - If no API key in localStorage → fallback to Web Speech V1 silently
  - Show "DEMO MODE" badge when using V1 fallback
- [ ] **Build WebSocket session server** in `server/`
  - Node.js + `ws` library
  - Session Map: `sessionId → Set<WebSocket>`
  - `CAPTION` broadcast to all session subscribers
  - `SESSION_END` cleanup after 30min inactivity
  - `USER_COUNT` broadcast on connect/disconnect

---

### Day 9 (Thu, Mar 20) — Shared Session + Viewer App

> Michael mocks session server locally if Luba's server isn't merged yet. Integrate Day 10.

**Michael — Viewer App + Share Session UI**
- [ ] **Build `/s/[sessionId]` viewer route** — user-facing, read-only
  - Connect to session WebSocket on page load
  - Render FIFO caption display (no mic controls)
  - Font size toggle: SM / MD / LG / XL
  - Pinch-to-zoom on caption text
- [ ] **Viewer reconnection**
  - Detect WebSocket `onclose` while session active
  - Show "Reconnecting…" overlay with spinner
  - Exponential backoff retry
  - Show "Session Ended" screen on `SESSION_END` event
- [ ] **WakeLock for viewer** — request on session join, re-request on `visibilitychange`, release on end

**Luba — Session Creation + Deploy Session Server**
- [ ] **"Share Session" button** on operator dashboard
  - Generate `crypto.randomUUID()` session ID on click
  - Display session URL: `https://procaptions.app/s/[id]`
  - Generate + display QR code using qrcode.js
  - Show live user count badge
- [ ] **Deploy session server** to Railway / Fly.io / Render
  - Set up environment variables, HTTPS, smoke test
- [ ] **Performance baseline** — measure caption render time (target < 100ms)

---

### Day 10 (Fri, Mar 21) — Integration + QA + Final Deploy

> **Work together today.** This is the integration day.

**Michael + Luba — Integration Testing**
- [ ] **Full operator → user flow**
  - Operator starts session → generates QR → user scans → captions appear
  - Verify latency: speech to user screen < 500ms on same WiFi
  - Test with 3 simultaneous user devices
- [ ] **Deepgram end-to-end**
  - Full: mic → PCM stream → Deepgram → diarization → FIFO display
  - Test 2 speakers alternating at 6 ft, 3 speakers with interruptions
  - Measure diarization accuracy (target ≥ 90%)

**Michael — PWA + Cross-Device Matrix**
- [ ] **PWA install test**
  - iOS: Safari → Share → Add to Home Screen → verify standalone launch, icon, splash
  - Verify WakeLock holds for 30min session
- [ ] **Cross-device matrix**
  - iPhone 13, iPhone SE, iPhone 15 Pro
  - iPad Air, iPad Pro
  - MacBook Chrome (desktop operator view)
- [ ] **Accessibility pass on new screens** — settings panel, viewer app, share button

**Luba — Performance + Bundle + Final Deploy**
- [ ] **JS bundle audit** — keep viewer app under 50KB gzipped
- [ ] **PWA load time on LTE** — target < 3s
- [ ] **Run full test suite** — fix any failures
- [ ] **Final production deploy** — both session server + Vercel PWA
- [ ] **Smoke test production URLs** — operator flow, viewer, QR scan

---

## Feature Completion Tracker

### Week 1 — MVP
| P0 Requirement | Status | Owner | Day |
|----------------|--------|-------|-----|
| One-tap session start | Done | — | — |
| Real-time captions via Web Speech API | Done | — | — |
| Gap Filler via Gemini API | Done | — | — |
| Confidence highlighting (color-coded) | Done | — | — |
| "Listening" status indicator | Done | — | — |
| One-tap session end | Done | — | — |
| Tap-to-flag misheard word | Done | — | — |
| Installable PWA (manifest + SW) | Done | — | — |
| **Mic permission pre-prompt UI** | TODO | Michael | 1 |
| **Feedback buttons (YES/NO) functional** | TODO | Michael | 1 |
| **STT auto-restart on reconnect** | TODO | Luba | 1 |
| **Gap Filler offline queue** | TODO | Luba | 1 |
| **domain param used in Gemini prompt** | TODO | Luba | 1 |
| **iOS splash screens** | TODO | Michael | 2 |
| **RNNoise WASM noise suppression** | TODO | Luba | 2 |
| **Service worker caches app shell** | TODO | Luba | 2 |
| **Accessibility: WCAG AA compliant** | TODO | Michael | 3 |
| **Touch targets >= 44px** | TODO | Michael | 3 |
| **Vercel production deploy** | TODO | Luba | 4 |
| **Real device testing: iOS** | TODO | Michael | 5 |
| **Real device testing: Android** | TODO | Luba | 5 |

### Week 2 — V2 Features
| Feature | Status | Owner | Day |
|---------|--------|-------|-----|
| **FIFO data model + DOM renderer** | TODO | Michael | 6 |
| **Word token component** | TODO | Michael | 7 |
| **Speaker profiles + selector UI** | TODO | Michael | 7 |
| **Speaker switching mid-session** | TODO | Michael | 8 |
| **Mic status indicators (LIVE badge)** | TODO | Michael | 8 |
| **Viewer app `/s/[sessionId]`** | TODO | Michael | 9 |
| **Share Session + QR code** | TODO | Luba | 9 |
| **Deepgram API key settings panel** | TODO | Luba | 6 |
| **Deepgram WebSocket connection** | TODO | Luba | 6 |
| **PCM audio streaming pipeline** | TODO | Luba | 7 |
| **Diarization mapping** | TODO | Luba | 8 |
| **Deepgram reconnection + fallback** | TODO | Luba | 8 |
| **WebSocket session server** | TODO | Luba | 8 |
| **Session server deploy** | TODO | Luba | 9 |
| **Full integration testing** | TODO | Both | 10 |
| **Performance: < 100ms render, < 50KB bundle** | TODO | Luba | 10 |

---

## Test Coverage Tracker

| Test File | Status | Owner | Day |
|-----------|--------|-------|-----|
| captionReducer.test.ts | Done (11) | — | — |
| gapFillerParser.test.ts | Done (9) | — | — |
| StartScreen.test.tsx | Done (5) | — | — |
| CaptionLine.test.tsx | Done (6) | — | — |
| StatusBar.test.tsx | Done (6) | — | — |
| SessionEndScreen.test.tsx | TODO | Michael | 1 |
| ControlBar.test.tsx | TODO | Michael | 1 |
| useConnectionStatus.test.ts | TODO | Luba | 1 |
| CaptionArea.test.tsx | TODO | Michael | 2 |
| SessionScreen.test.tsx | TODO | Michael | 2 |
| useSpeechRecognition.test.ts | TODO | Luba | 2 |
| useAudioPipeline.test.ts | TODO | Luba | 2 |
| SessionContext.test.tsx | TODO | Michael | 3 |
| route.integration.test.ts | TODO | Luba | 3 |
| useGapFiller.test.ts | TODO | Luba | 3 |
| useWakeLock.test.ts | TODO | Luba | 3 |
| useSessionTimer.test.ts | TODO | Luba | 3 |
| **Total W1** | **37 done + ~50 new** | | |
| useDeepgram.test.ts | TODO | Luba | 7 |
| fifoModel.test.ts | TODO | Michael | 6 |
| viewer.spec.ts (E2E) | TODO | Michael | 9 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| iOS Safari kills recognition after 60s | High | High | Auto-restart on `onend` — already implemented |
| Deepgram diarization misidentifies speaker | Medium | Medium | Allow manual override tap during session |
| WebSocket drops on WiFi → LTE switch | Medium | High | Exponential backoff reconnect |
| RNNoise WASM integration breaks AudioWorklet | Medium | High | Keep pass-through as fallback |
| Week 2 scope bleeds into Week 1 | Medium | High | Hard stop: Day 5 = ship point regardless |
| Deepgram API cost surprise for long sessions | Low | Medium | Show cost estimate in UI; add optional session time limit |

---

## Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | Should Deepgram API key be stored client-side or proxied through backend? | Michael | Day 6 |
| 2 | What is the max number of simultaneous viewers per session? | Michael | Day 8 |
| 3 | Should viewer session require a PIN for private events? | Michael | Day 8 |
| 4 | Session server: self-hosted (Railway/Fly.io) or managed? | Luba | Day 8 |

---

## Merge Conflict Prevention Rules

1. **Stick to your files** — Michael owns `src/components/` + `e2e/`, Luba owns `src/hooks/` + `src/app/api/` + `src/context/` + `src/lib/` + `server/`
2. **Coordinate on shared files** — `src/types/index.ts`, `package.json` — message before editing
3. **Pull from main before starting each day** — `git pull origin main`
4. **Small, focused PRs** — merge quickly to avoid long-lived branches
5. **Branch naming**: `luba/day1-reconnect-stt`, `michael/day1-mic-prompt`
6. **Week 1 = MVP** — do not start Week 2 tasks until Day 5 is merged and deployed
