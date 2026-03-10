# Live Captions Pro — 5-Day Sprint Plan (Luba & Michael)

**Branch:** `lubaPlan`
**Start Date:** March 10, 2026
**Reference:** TDD.md, PRD2.md

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
| 1 | **RNNoise is a placeholder** | `audio-processor.js` is a pass-through — does zero noise suppression. Just copies input to output. | "RNNoise WASM for noise suppression" / "System captures speech clearly even in noisy environments" |
| 2 | **STT doesn't restart on reconnect** | `useConnectionStatus` detects online/offline, but `SessionContext` never reacts — STT stays dead after connection drop | "Captions auto-resume on reconnection" |
| 3 | **Gap Filler doesn't queue offline** | If offline when a sentence finalizes, `useGapFiller` silently fails. No queue. Sentence is lost forever. | "Gap Filler queues unsent sentences and processes them on reconnection" |
| 4 | **Feedback buttons do nothing** | SessionEndScreen YES/NO buttons have no `onClick`. No tracking, no confirmation, nothing happens. | "End-of-session 'Did you miss anything?' prompt" |
| 5 | **No mic permission pre-prompt** | `startSession` calls `getUserMedia` directly. No UI explaining why mic is needed — user just gets a browser popup. | "Show pre-prompt UI explaining why mic is needed" |
| 6 | **No reconnection restart for STT** | When connection drops and comes back, speech recognition stays stopped. User has to manually end + restart session. | "When connection restores, recognition restarts automatically" |
| 7 | **domain param unused** | API route destructures `domain` but never uses it in the Gemini prompt. Lint warning. | "Education/lecture domain hints" |
| 8 | **Service worker is minimal** | Only caches `/` and `/manifest.json`. Doesn't cache JS/CSS bundles for real offline app shell. | "Service worker caches app shell (HTML, CSS, JS bundles) for instant repeat loads" |
| 9 | **No iOS splash screens** | `public/splash/` directory doesn't exist | TDD specifies splash screens for iOS |
| 10 | **Not deployed** | No Vercel deployment, no env vars set, no production URL | "Deploy to Vercel" |
| 11 | **8 test files missing** | TDD specifies test files that don't exist | Testing strategy in TDD |
| 12 | **No accessibility audit done** | Components have some aria-labels but no systematic audit | "WCAG AA, Lighthouse > 90" |

### File Structure Assessment
The current structure is **correct** for this app. Next.js App Router co-locates API routes with frontend by design. The "backend" is a single serverless function (`src/app/api/gap-filler/route.ts`). Splitting into `frontend/` and `backend/` folders would fight the framework. No change needed.

---

## Work Split Strategy

**Michael = UI / Components / UX / E2E / Accessibility / Real Device Testing**
**Luba = Hooks / API / Audio Pipeline / Infra / Deployment / Backend Tests**

This keeps each person in separate files to minimize merge conflicts.

| Owner | Files they own |
|-------|---------------|
| **Michael** | `src/components/*`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `e2e/*`, `public/splash/`, `public/manifest.json` |
| **Luba** | `src/hooks/*`, `src/app/api/*`, `src/context/*`, `src/lib/*`, `public/sw.js`, `public/audio-processor.js`, `.github/*`, Vercel config |

**Shared** (coordinate before editing): `src/types/index.ts`, `package.json`

---

## Pre-Requisite: Gemini API Key

The Gap Filler (and therefore all color-coded confidence highlighting) requires a Google Gemini API key. Without it, every word shows as plain white "confirmed" text — no corrections, no colors.

**How to get it (free):**
1. Go to Google AI Studio (aistudio.google.com)
2. Sign in with Google account → "Get API Key" → "Create API key"
3. Free tier: Gemini 2.5 Flash — 250 requests/day, 10 requests/minute (enough for MVP)

**Where to set it:**
- **Local dev**: create `.env.local` in project root → `GEMINI_API_KEY=your_key_here`
- **Vercel (Day 4)**: Settings → Environment Variables → add `GEMINI_API_KEY`

**Important**: `.env.local` is already in `.gitignore` — never commit API keys.

---

## Color-Coded Confidence Highlighting (already implemented)

This is a core differentiator from the PRD. The full pipeline is wired:

| Word Type | Color | When | Example |
|-----------|-------|------|---------|
| **Confirmed** (>90% confidence) | White text (default) | Gemini agrees the word is correct | "the", "government" |
| **Uncertain** (70-90% confidence) | Amber/orange text | Gemini thinks the word might be wrong | a word that sounds similar to another |
| **Predicted** (<70% or AI-filled) | Blue background + blue underline | Gemini added or replaced a word | a dropped word Gemini filled in |
| **Flagged** (user tapped) | Red underline | User tapped a word to flag it | any word the user doesn't trust |

Code locations: `gapFillerParser.ts:11-28` (classification), `CaptionLine.tsx:14-20` (rendering), `constants.ts:2-3` (thresholds).

**Status**: Code is done. Needs real-speech testing (Day 5) to verify the colors are readable and the thresholds feel right during an actual lecture. Michael should tune if needed.

---

## Day-by-Day Plan

### Day 1 (Tue, Mar 10) — Fix Critical Feature Gaps

**Michael — Mic Permission UX + Feedback Buttons + Component Tests**
- [ ] **Build mic permission pre-prompt modal** in `StartScreen.tsx`
  - Before calling `startSession`, show a dialog: "Live Captions Pro needs microphone access to capture speech. Your audio is processed locally — no audio is sent to our servers."
  - "Allow Microphone" button → calls `startSession` → triggers `getUserMedia`
  - Handles denial gracefully (show error message, let user retry)
  - Use your judgment on wording — you know what a Deaf user needs to feel safe granting mic access
- [ ] **Wire up feedback buttons** in `SessionEndScreen.tsx`
  - YES button: show a brief "Thanks for your feedback" message, track in session stats
  - NO button: show "Great!" message, track in session stats
  - Add `feedbackGiven: 'yes' | 'no' | null` to `SessionState` or handle locally
- [ ] **Write `SessionEndScreen.test.tsx`** — renders stats, buttons work, feedback flow
- [ ] **Write `ControlBar.test.tsx`** — mic indicator states, end session fires

**Luba — STT Auto-Reconnect + Gap Filler Queue**
- [ ] **Implement STT auto-restart on reconnect** in `SessionContext.tsx`
  - Watch `connectionStatus` — when it transitions from 'lost'/'reconnecting' → 'connected', call `startSTT()` again
  - When it transitions to 'lost', call `stopSTT()` (no point running STT without network)
  - Show status transitions in StatusBar automatically
- [ ] **Implement Gap Filler offline queue** in `useGapFiller.ts`
  - When fetch fails due to network, push `{ lineId, sentence }` to a queue (ref)
  - Expose a `flushQueue()` function
  - In `SessionContext`, call `flushQueue()` when connection restores
- [ ] **Fix domain param** in `route.ts` — pass it into `buildGeminiPrompt()` or remove destructure
- [ ] **Write `useConnectionStatus.test.ts`** — online/offline transitions, reconnect timer

---

### Day 2 (Wed, Mar 11) — PWA Polish + Caption UX + Core Tests

**Michael — Caption UX Polish + Component Tests**
- [ ] **Add iOS splash screen images** to `public/splash/`
  - Generate splash screens for common iOS sizes (iPhone SE, 13/14/15, iPad)
  - Add `<link rel="apple-touch-startup-image">` tags to `layout.tsx`
- [ ] **Polish caption display UX** — use your experience as a user to refine:
  - Is the interim text (gray/italic) readable enough? Adjust opacity/style if needed
  - Is the blinking cursor helpful or distracting? Tune or remove
  - Does the auto-scroll feel natural? Test with rapid speech
  - Is the predicted word highlight (blue bg + underline) clear but not overwhelming?
- [ ] **Write `CaptionArea.test.tsx`** — renders lines, shows interim text, auto-scroll
- [ ] **Write `SessionScreen.test.tsx`** — renders StatusBar/CaptionArea/ControlBar, flag word works

**Luba — RNNoise + Service Worker + Hook Tests**
- [ ] **Integrate real RNNoise WASM** into `public/audio-processor.js`
  - Replace placeholder with actual RNNoise WASM processor
  - Download RNNoise WASM binary, load in AudioWorklet
  - Fall back gracefully if WASM fails to load (current browser noise suppression as fallback)
  - Test that audio quality improves in noisy environments
- [ ] **Enhance service worker** (`public/sw.js`)
  - Cache all static assets (JS bundles, CSS, fonts, icons) — not just `/` and `/manifest.json`
  - Use network-first strategy for API routes, cache-first for static assets
  - Add version bump mechanism for cache invalidation
- [ ] **Write `useSpeechRecognition.test.ts`**
  - Mock SpeechRecognition constructor
  - Test onInterim/onFinal callbacks
  - Test auto-restart on unexpected end (iOS)
  - Test unsupported browser handling
- [ ] **Write `useAudioPipeline.test.ts`**
  - Mock getUserMedia + AudioContext
  - Test start/stop lifecycle + cleanup
  - Test permission denied error handling

---

### Day 3 (Thu, Mar 12) — Accessibility + Integration Tests + Polish

**Michael — Accessibility Audit + UI Polish (user perspective)**
- [ ] **Full accessibility audit** on all components
  - Verify `aria-live="polite"` on CaptionArea — does it announce captions naturally?
  - Verify all buttons have `aria-label` (most do — check ControlBar mic indicator)
  - Verify color contrast WCAG AA: 4.5:1 for body text, 3:1 for large text
  - Predicted words: verify they have **both** underline AND highlight (PRD requires this — currently CaptionLine has both ✓)
  - Uncertain/orange words: verify contrast ratio against dark background
  - As the target user, are the visual distinctions between word types clear enough at a glance during a fast lecture?
- [ ] **Touch target audit** — ensure all interactive elements are min 44x44px
  - CaptionLine words: currently `inline` spans — may be too small to tap. Add padding?
  - ControlBar buttons: currently min-h-[56px] ✓
  - Start/End buttons: currently min-h-[56px] ✓
- [ ] **Safe area insets** — verify `env(safe-area-inset-bottom)` works on ControlBar
  - Add `env(safe-area-inset-top)` to StatusBar for notched phones
- [ ] **Run Lighthouse audit**, fix issues (target: PWA > 90, Accessibility > 90)
- [ ] **Write `SessionContext.test.tsx`** — full integration: start/end session, gap filler dispatch

**Luba — API Integration Tests + Gap Filler Hardening**
- [ ] **Write `route.integration.test.ts`** for `/api/gap-filler`
  - Mock GoogleGenerativeAI — test correct Gemini call
  - Test timeout handling (>5s → fallback)
  - Test rate limit (429 → fallback + rateLimited flag)
  - Test malformed JSON → retry once → fallback
  - Test missing sentence → 400
  - Test missing API key → graceful fallback
- [ ] **Write `useGapFiller.test.ts`**
  - Test fetch call with correct payload
  - Test onResult callback
  - Test rate limit pause behavior
  - Test offline queue + flush
- [ ] **Write `useWakeLock.test.ts`** + **`useSessionTimer.test.ts`**
- [ ] **Harden gap filler error messages** — add better logging for debugging in production

---

### Day 4 (Fri, Mar 13) — E2E Tests + Deployment

**Michael — E2E Test Suite**
- [ ] **Expand `e2e/session.spec.ts`**
  - Full happy path: start → mic permission prompt → captions stream → gap filler highlights predicted words → end → stats screen shows word count + corrections
  - Test connection lost banner appears (mock offline event)
  - Test session timer increments
  - Test tap-to-flag word turns red
- [ ] **Expand `e2e/mobile.spec.ts`**
  - iPhone viewport (375x812): all touch targets >= 44px
  - Caption area scrolls to bottom on new text
  - ControlBar is in thumb-reachable zone (bottom of screen)
  - Verify safe area padding renders
- [ ] **Add `e2e/pwa.spec.ts`**
  - PWA manifest detected by browser
  - Service worker registers and activates
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
- [ ] **Set up Vercel domain** (optional: custom domain or use `.vercel.app`)

---

### Day 5 (Sat, Mar 14) — Real Device Testing + Bug Fixes + Launch

**Michael — Real Device Testing as Target User (most critical day)**
- [ ] **Test on real iPhone (Safari)** — as a Deaf user would actually use it:
  - Mic permission pre-prompt → does the explanation feel trustworthy?
  - AudioContext resume on tap (iOS requires user gesture)
  - STT auto-restart on silence (iOS stops after ~5s)
  - PWA "Add to Home Screen" → standalone mode
  - Caption display — is it readable during a real conversation?
  - Auto-scroll — does it keep up? Is it disorienting?
  - Safe area insets (notch, home indicator)
  - Tap-to-flag words — is it easy to flag without accidentally flagging neighbors?
  - Session end → stats → are the numbers meaningful?
  - Gap filler corrections — do they actually improve comprehension?
- [ ] **Test with real speech** — have someone speak sample lecture content, verify:
  - Captions appear in < 1 second
  - Gap filler corrections are sensible
  - Confidence highlighting: can you tell at a glance which words are certain vs. predicted?
  - Does the overall experience feel like "zero lost meaning"?
- [ ] **Test on iPad Safari** — portrait + landscape layouts
- [ ] **Fix any UX bugs found** — prioritize what hurts the reading experience most
- [ ] **Run final Lighthouse PWA audit** — target score > 90

**Luba — Android Testing + Final Deploy + README**
- [ ] **Test on real Android device (Chrome)**
  - Mic permission flow
  - Caption display + scrolling
  - PWA install prompt + standalone mode
  - Wake lock prevents screen dimming
  - Gap filler corrections appear with highlighting
  - Connection drop → banner → reconnect → STT resumes
- [ ] **Run full test suite** — fix any failures
- [ ] **Final production deploy**
- [ ] **Update README.md** with:
  - Live production URL
  - Setup instructions for local dev
  - How to set GEMINI_API_KEY
  - Browser compatibility notes

---

## Feature Completion Tracker (P0 from PRD)

| P0 Requirement | Status | Owner | Day |
|----------------|--------|-------|-----|
| One-tap session start | Done | — | — |
| Real-time captions via Web Speech API | Done | — | — |
| Gap Filler via Gemini API | Done | — | — |
| Confidence Highlighting (color-coded) | Done | — | — |
| Visual distinction: confirmed vs predicted | Done | — | — |
| "Listening" status indicator | Done | — | — |
| One-tap session end | Done | — | — |
| Tap-to-flag misheard word | Done | — | — |
| Installable PWA (manifest + SW) | Done | — | — |
| **Mic permission pre-prompt UI** | **TODO** | Michael | 1 |
| **Feedback buttons (YES/NO) functional** | **TODO** | Michael | 1 |
| **STT auto-restart on reconnect** | **TODO** | Luba | 1 |
| **Gap Filler offline queue** | **TODO** | Luba | 1 |
| **Connection lost → auto-resume** | **TODO** | Luba | 1 |
| **RNNoise WASM noise suppression** | **TODO** | Luba | 2 |
| **Service worker caches app shell** | **TODO** | Luba | 2 |
| **iOS splash screens** | **TODO** | Michael | 2 |
| **Accessibility: WCAG AA compliant** | **TODO** | Michael | 3 |
| **Touch targets >= 44px on all elements** | **TODO** | Michael | 3 |
| **domain param used in Gemini prompt** | **TODO** | Luba | 1 |
| **Vercel production deploy** | **TODO** | Luba | 4 |
| **Real device testing: iOS + real speech** | **TODO** | Michael | 5 |
| **Real device testing: Android Chrome** | **TODO** | Luba | 5 |

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
| **Total** | **37 done + ~50 new** | | |

---

## Merge Conflict Prevention Rules

1. **Stick to your files** — Michael owns `src/components/` + `e2e/`, Luba owns `src/hooks/` + `src/app/api/` + `src/context/` + `src/lib/`
2. **Coordinate on shared files** — `src/types/index.ts`, `package.json` — message each other before editing
3. **Pull from main before starting each day** — `git pull origin main`
4. **Small, focused PRs** — merge quickly to avoid long-lived branches
5. **Branch naming**: `luba/day1-mic-prompt`, `michael/day1-reconnect-stt`
