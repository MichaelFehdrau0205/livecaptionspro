[Live Captions Pro] Technical Design Document

Project: Live Captions Pro
Owner: Luba Kaper and Michael Fehdrau
Date: Sunday, March 09, 2026
Reference: PRD2.md


1. System Architecture

Overview:
Live Captions Pro is a Progressive Web App (PWA) built with Next.js. It runs entirely in the browser with one serverless API route for the Gap Filler. No persistent backend or database in v1.

Architecture Diagram:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                                                              │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────────┐  │
│  │ Mic Input │───>│ RNNoise   │───>│ Web Speech API       │  │
│  │ getUserMe-│    │ WASM      │    │ SpeechRecognition    │  │
│  │ dia()     │    │ AudioWork-│    │ (interim + final     │  │
│  │           │    │ let       │    │  results)            │  │
│  └──────────┘    └───────────┘    └──────────┬───────────┘  │
│                                               │              │
│                                    ┌──────────▼───────────┐  │
│                                    │ Caption State Manager │  │
│                                    │ (React Context)       │  │
│                                    └──────────┬───────────┘  │
│                                               │              │
│                         ┌─────────────────────┼─────────┐   │
│                         │                     │         │   │
│                  ┌──────▼──────┐    ┌─────────▼──────┐  │   │
│                  │ Caption     │    │ Gap Filler     │  │   │
│                  │ Display     │    │ Client         │  │   │
│                  │ Component   │    │ (sends final   │  │   │
│                  │ (real-time) │    │  sentences)    │  │   │
│                  └─────────────┘    └────────┬───────┘  │   │
│                                              │          │   │
└──────────────────────────────────────────────┼──────────┘   │
                                               │              │
┌──────────────────────────────────────────────┼──────────────┘
│                     VERCEL (Serverless)       │
│                                              │
│  ┌───────────────────────────────────────────▼────────────┐
│  │ /api/gap-filler                                        │
│  │ - Receives: finalized sentence + last 5 sentences      │
│  │ - Calls: Gemini 2.5 Flash API                          │
│  │ - Returns: corrected text + confidence scores          │
│  └────────────────────────────────────────────────────────┘
│
└────────────────────────────────────────────────────────────┘
```

Key Design Decisions:
- Web Speech API runs on-device (browser handles STT) — no audio sent to our servers
- Gap Filler is the only server-side component — keeps API key secure
- All state lives in the browser session — no database, no persistence
- PWA service worker caches app shell for instant loads (not offline STT)


2. Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Framework | Next.js (App Router) | 15.x | React-based, serverless API routes, Vercel-native |
| Language | TypeScript | 5.x | Type safety, better IDE support, fewer runtime bugs |
| Styling | Tailwind CSS | 4.x | Utility-first, mobile-first by default, fast to build |
| STT | Web Speech API | Browser built-in | Free, zero setup, works on Chrome/Safari |
| AI | Google Gemini API | 2.5 Flash | Best free tier (250 req/day), fast responses |
| Noise Filter | RNNoise WASM | Latest | ML-based noise suppression, ~200KB, runs in AudioWorklet |
| Testing | Vitest + React Testing Library | Latest | Fast, Vite-compatible, good DX |
| E2E Testing | Playwright | Latest | Cross-browser, mobile emulation, reliable |
| Linting | ESLint + Prettier | Latest | Code consistency |
| Hosting | Vercel | Free tier | Zero-config Next.js deploys, preview URLs, serverless |
| CI/CD | GitHub Actions + Vercel | Free | Auto-deploy on push, run tests on PR |


3. Mobile-First Design

Approach:
All UI is designed for mobile viewport first (375px), then scaled up for tablet (768px) and desktop (1024px+). Tailwind CSS mobile-first breakpoints are used throughout.

Breakpoints:
- Mobile: 0-767px (default styles)
- Tablet: 768-1023px (md: prefix)
- Desktop: 1024px+ (lg: prefix)

Touch & Mobile Considerations:
- All tap targets minimum 44x44px (Apple HIG / WCAG 2.5.5)
- Caption text defaults to 20px on mobile, 18px on desktop (larger on small screens for readability)
- Bottom-anchored controls (thumb-reachable zone on mobile)
- No hover-dependent interactions — everything works with tap
- Viewport meta tag with viewport-fit=cover for notch/safe area handling
- Full-screen caption area with auto-scroll to latest text

PWA Configuration:
- manifest.json: name, short_name, icons (192px + 512px), start_url, display: standalone, theme_color, background_color
- Service worker: cache app shell (HTML, CSS, JS bundles) for instant repeat loads
- Apple-specific meta tags: apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style
- Splash screens for iOS

iOS-Specific Handling:
- AudioContext must be created/resumed on user tap (not on page load)
- SpeechRecognition auto-restart on silence timeout (iOS stops after ~5s silence)
- getUserMedia() permission prompt — show pre-prompt UI explaining why mic is needed
- Safe area insets via env(safe-area-inset-bottom) for bottom controls

Android-Specific Handling:
- Chrome handles SpeechRecognition natively (most reliable platform)
- PWA install banner appears automatically after engagement criteria met
- Wake lock API to prevent screen dimming during active session


4. UI Wireframes

4.1 Start Screen (Mobile — 375px)

```
┌─────────────────────────────┐
│  ─  ─  ─  (status bar)     │
│                             │
│                             │
│                             │
│                             │
│      LIVE CAPTIONS PRO      │
│                             │
│      Real-time captions     │
│      with zero lost         │
│      meaning.               │
│                             │
│                             │
│   ┌───────────────────────┐ │
│   │                       │ │
│   │    START CAPTIONING   │ │
│   │                       │ │
│   └───────────────────────┘ │
│                             │
│     Education Mode          │
│                             │
│  ─  ─  ─  (safe area)      │
└─────────────────────────────┘
```

4.2 Active Session — Mobile

```
┌─────────────────────────────┐
│  ● LISTENING        00:03:42│
│─────────────────────────────│
│                             │
│  So today we're going to    │
│  talk about the three main  │
│  branches of government.    │
│  The legislative branch     │
│  is responsible for making  │
│  laws. The [executive]      │
│  branch enforces them.      │
│                             │
│  And the judicial branch    │
│  interprets the             │
│  constitution and reviews   │
│  laws for...                │
│  █                          │
│                             │
│─────────────────────────────│
│                             │
│   🔴  ┌─────────────────┐   │
│   MIC │  END SESSION     │   │
│       └─────────────────┘   │
│                             │
└─────────────────────────────┘

Legend:
● = green dot (listening indicator)
[executive] = highlighted word (AI-predicted by Gap Filler)
█ = cursor / current position
🔴 = mic active indicator
```

Color coding in caption area:
- Default text: white on dark background (#1a1a2e)
- AI-predicted words: highlighted with blue background (#3b82f6 at 30% opacity)
- Low-confidence words: orange text (#f59e0b)
- Flagged words: red underline on tap

4.3 Active Session — Desktop (1024px+)

```
┌──────────────────────────────────────────────────────────────────┐
│  ● LISTENING                                          00:12:34   │
│──────────────────────────────────────────────────────────────────│
│                                                                  │
│         So today we're going to talk about the three main        │
│         branches of government. The legislative branch           │
│         is responsible for making laws. The [executive]          │
│         branch enforces them.                                    │
│                                                                  │
│         And the judicial branch interprets the constitution      │
│         and reviews laws for [constitutionality]. Each           │
│         branch has checks and balances over the...               │
│         █                                                        │
│                                                                  │
│                                                                  │
│──────────────────────────────────────────────────────────────────│
│                    🔴 MIC ON        [ END SESSION ]               │
└──────────────────────────────────────────────────────────────────┘
```

Desktop differences:
- Caption text centered with max-width: 720px for readability
- Larger font (22px)
- Controls bar at bottom, horizontally centered

4.4 Connection Lost State

```
┌─────────────────────────────┐
│                             │
│  ⚠ CONNECTION LOST          │
│  Reconnecting...            │
│─────────────────────────────│
│                             │
│  (previous captions still   │
│   visible but grayed out)   │
│                             │
│  And the judicial branch    │
│  interprets the             │
│  constitution and reviews   │
│  laws for...                │
│                             │
│─────────────────────────────│
│                             │
│   ○  ┌─────────────────┐   │
│  OFF │  END SESSION     │   │
│       └─────────────────┘   │
│                             │
└─────────────────────────────┘
```

4.5 Session Ended

```
┌─────────────────────────────┐
│                             │
│      SESSION ENDED          │
│      Duration: 00:32:15     │
│      Words captured: 4,832  │
│      AI corrections: 47     │
│                             │
│─────────────────────────────│
│                             │
│   Did you miss anything     │
│   important?                │
│                             │
│   [ YES ]     [ NO ]        │
│                             │
│─────────────────────────────│
│                             │
│   ┌───────────────────────┐ │
│   │   NEW SESSION         │ │
│   └───────────────────────┘ │
│                             │
└─────────────────────────────┘
```


5. Component Breakdown

React Component Tree:

```
App (layout.tsx)
├── StartScreen
│   ├── Logo
│   ├── StartButton
│   └── ModeIndicator ("Education Mode")
│
├── SessionScreen
│   ├── StatusBar
│   │   ├── ListeningIndicator (green dot + "LISTENING")
│   │   ├── ConnectionStatus (connected/reconnecting/lost)
│   │   └── SessionTimer
│   │
│   ├── CaptionArea
│   │   ├── CaptionLine (repeated)
│   │   │   ├── ConfirmedWord
│   │   │   ├── PredictedWord (highlighted)
│   │   │   └── UncertainWord (orange)
│   │   └── CaptionCursor (blinking)
│   │
│   └── ControlBar
│       ├── MicIndicator
│       └── EndSessionButton
│
└── SessionEndScreen
    ├── SessionStats
    ├── FeedbackPrompt
    └── NewSessionButton
```

State Management:
React Context with useReducer for session state. No external state library needed for MVP.

```typescript
// Session state shape
interface SessionState {
  status: 'idle' | 'listening' | 'paused' | 'reconnecting' | 'ended';
  captions: CaptionLine[];
  currentInterim: string;
  sessionStartTime: number | null;
  stats: {
    wordCount: number;
    aiCorrections: number;
  };
}

interface CaptionLine {
  id: string;
  words: CaptionWord[];
  isFinalized: boolean;
  gapFillerApplied: boolean;
}

interface CaptionWord {
  text: string;
  type: 'confirmed' | 'predicted' | 'uncertain';
  confidence: number; // 0-1
  flagged: boolean;
}
```

Custom Hooks:
- `useSpeechRecognition()` — Wraps Web Speech API, handles start/stop/restart, emits interim + final results
- `useAudioPipeline()` — Manages getUserMedia, AudioContext, RNNoise AudioWorklet
- `useGapFiller()` — Sends finalized sentences to /api/gap-filler, returns corrected words
- `useConnectionStatus()` — Monitors navigator.onLine, handles reconnection logic
- `useWakeLock()` — Prevents screen from dimming during active session
- `useSessionTimer()` — Tracks elapsed time


6. API Design

6.1 POST /api/gap-filler

The only server-side endpoint. Runs as a Vercel serverless function.

Request:
```typescript
{
  sentence: string;          // The finalized sentence from STT
  context: string[];         // Last 5 finalized sentences for context
  domain: 'education';       // Vertical hint for Gemini
}
```

Response:
```typescript
{
  correctedSentence: string;
  words: Array<{
    text: string;
    type: 'confirmed' | 'predicted' | 'uncertain';
    confidence: number;      // 0.0 to 1.0
  }>;
}
```

Gemini Prompt Template:
```
You are a real-time caption correction system for a live lecture in an education setting.

Given a speech-to-text transcription that may contain errors, dropped words, or misheard terms:
1. Identify and fix likely transcription errors based on context
2. Fill in any obviously missing words
3. Assign a confidence score (0.0-1.0) to each word:
   - 1.0: Word was in original and is clearly correct
   - 0.7-0.9: Word was in original but might be wrong
   - 0.3-0.6: Word was predicted/filled by you

Return JSON only. No explanation.

Context (previous sentences):
{context}

Current sentence to correct:
{sentence}

Return format:
{"correctedSentence": "...", "words": [{"text": "...", "type": "confirmed|predicted|uncertain", "confidence": 0.0}]}
```

Error Handling:
- Gemini API timeout (>3s): Return original sentence as-is, all words marked 'confirmed'
- Gemini API rate limit (429): Return original sentence, set flag to pause gap filler for 60s
- Invalid JSON response: Retry once, then return original sentence
- Network error: Return original sentence, log error


7. Data Flow

Complete flow from speech to display:

```
SPEECH → MIC → AUDIO PIPELINE → STT → DISPLAY → GAP FILLER → UPDATE

Detailed:

1. User speaks
   │
2. getUserMedia() captures audio stream
   │
3. AudioContext → RNNoise AudioWorklet (noise suppression)
   │
4. Web Speech API SpeechRecognition processes audio
   │
   ├── Interim result (partial words) ──────────────────┐
   │                                                     │
   │                                                     ▼
   │                                          Caption Display
   │                                          (shows interim text
   │                                           in gray/lighter color)
   │
   └── Final result (completed sentence) ──────────────┐
                                                        │
                                              ┌─────────▼──────────┐
                                              │ Caption Display     │
                                              │ (shows finalized    │
                                              │  text in white)     │
                                              └─────────┬──────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │ Gap Filler Client   │
                                              │ (async, non-blocking)│
                                              └─────────┬──────────┘
                                                        │
                                              POST /api/gap-filler
                                                        │
                                              ┌─────────▼──────────┐
                                              │ Gemini API          │
                                              │ (correction +       │
                                              │  confidence scores) │
                                              └─────────┬──────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │ Caption Display     │
                                              │ UPDATE: replace     │
                                              │ finalized line with │
                                              │ corrected + colored │
                                              │ words               │
                                              └────────────────────┘
```

Timing:
- Interim results: ~100-300ms after speech (shown immediately)
- Final results: ~500ms after speech pause (shown immediately)
- Gap Filler correction: ~1-3s after final result (async update, no blocking)


8. Deployment Strategy

8.1 Vercel Setup

Repository: GitHub repo `livecaptionspro`
Framework: Next.js (auto-detected by Vercel)
Build command: `next build`
Output: `.next/` (auto-detected)

Environment Variables (Vercel dashboard):
- `GEMINI_API_KEY` — Google Gemini API key (server-side only, never exposed to client)

8.2 CI/CD Pipeline

```
Push to main branch
  │
  ├── GitHub Actions: Run linting + tests
  │     ├── npm run lint
  │     ├── npm run test (Vitest unit tests)
  │     └── npm run test:e2e (Playwright — headless Chrome only for CI)
  │
  └── Vercel: Auto-deploy to production
        └── URL: livecaptionspro.vercel.app

Push to any other branch / Open PR
  │
  ├── GitHub Actions: Run linting + tests
  │
  └── Vercel: Deploy preview
        └── URL: livecaptionspro-<hash>.vercel.app
```

8.3 GitHub Actions Workflow

File: `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

8.4 Production Checklist

Before launch:
- [ ] Vercel environment variables set (GEMINI_API_KEY)
- [ ] PWA manifest icons generated (192px, 512px)
- [ ] Service worker caching verified
- [ ] HTTPS confirmed (Vercel provides by default)
- [ ] Mobile testing on real iOS device (Safari)
- [ ] Mobile testing on real Android device (Chrome)
- [ ] Lighthouse PWA audit score > 90
- [ ] getUserMedia() permission flow tested on all target browsers


9. Testing Strategy

9.1 Unit Tests (Vitest + React Testing Library)

What to test:
- Caption state reducer (all action types, edge cases)
- Word classification logic (confirmed/predicted/uncertain thresholds)
- Gap Filler response parser (valid JSON, malformed JSON, empty response)
- Session timer formatting
- Connection status transitions
- Component rendering (StartScreen, CaptionLine, ControlBar, SessionEndScreen)

File naming: `*.test.ts` / `*.test.tsx` colocated with source files.

Example test cases:

```typescript
// captionReducer.test.ts
describe('captionReducer', () => {
  it('adds interim text to current line', () => { ... });
  it('finalizes a line when STT returns final result', () => { ... });
  it('replaces finalized line with gap-filler corrections', () => { ... });
  it('increments aiCorrections count when gap filler changes words', () => { ... });
  it('handles empty interim results gracefully', () => { ... });
});

// gapFillerParser.test.ts
describe('parseGapFillerResponse', () => {
  it('parses valid Gemini response into CaptionWords', () => { ... });
  it('returns original sentence when response is malformed JSON', () => { ... });
  it('clamps confidence scores to 0-1 range', () => { ... });
  it('handles empty words array', () => { ... });
});

// CaptionLine.test.tsx
describe('CaptionLine', () => {
  it('renders confirmed words in default style', () => { ... });
  it('renders predicted words with highlight background', () => { ... });
  it('renders uncertain words in orange', () => { ... });
  it('calls onFlagWord when a word is tapped', () => { ... });
});
```

9.2 Integration Tests

What to test:
- `/api/gap-filler` endpoint: correct Gemini API call, error handling, response format
- Audio pipeline initialization: getUserMedia mock → AudioContext → worklet chain
- Speech recognition hook: mock SpeechRecognition events → state updates

Approach:
- Mock external APIs (Gemini, Web Speech API, getUserMedia) with Vitest mocks
- Test the full internal flow from input to state change

```typescript
// api/gap-filler.integration.test.ts
describe('/api/gap-filler', () => {
  it('returns corrected sentence from Gemini', async () => { ... });
  it('returns original sentence on Gemini timeout', async () => { ... });
  it('returns original sentence on Gemini rate limit', async () => { ... });
  it('returns original sentence on invalid Gemini JSON', async () => { ... });
});
```

9.3 E2E Tests (Playwright)

What to test:
- Full session flow: start → see captions → end → see stats
- Connection loss banner appears when offline
- PWA installability (manifest detected)
- Mobile viewport: controls are thumb-reachable, text is readable

```typescript
// e2e/session.spec.ts
test('complete caption session flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=START CAPTIONING');
  // Mock SpeechRecognition to emit test phrases
  await expect(page.locator('[data-testid="listening-indicator"]')).toBeVisible();
  await expect(page.locator('[data-testid="caption-area"]')).toContainText('test phrase');
  await page.click('text=END SESSION');
  await expect(page.locator('text=SESSION ENDED')).toBeVisible();
});

// e2e/mobile.spec.ts
test.use({ viewport: { width: 375, height: 812 } }); // iPhone viewport
test('mobile layout is correct', async ({ page }) => {
  await page.goto('/');
  // Verify start button is visible and tappable
  const startBtn = page.locator('text=START CAPTIONING');
  const box = await startBtn.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44); // Min touch target
});
```

9.4 Mobile Testing

Real device testing checklist:
- [ ] iOS Safari (iPhone): mic permission, caption display, session flow, PWA install to home screen
- [ ] Android Chrome: mic permission, caption display, session flow, PWA install prompt
- [ ] iPad Safari: landscape + portrait layout
- [ ] Test with actual speech (not just mocks) for STT accuracy validation

Browser DevTools testing:
- Chrome DevTools device emulation for layout verification
- Throttle network to test reconnection behavior
- Application panel → Service Worker and Manifest validation

9.5 Accessibility Testing

- Screen reader: VoiceOver (iOS/Mac) and TalkDown (Android) — captions announced as live region
- Caption area uses `aria-live="polite"` so screen readers announce new captions
- All buttons have `aria-label`
- Color contrast: WCAG AA minimum (4.5:1 for body text, 3:1 for large text)
- Test with Lighthouse accessibility audit (target score > 90)
- No information conveyed by color alone — predicted words have both color AND underline


10. File / Folder Structure

```
livecaptionspro/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── splash/                    # iOS splash screens
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (meta tags, PWA head tags)
│   │   ├── page.tsx               # Main page (routes to Start or Session)
│   │   ├── globals.css            # Tailwind imports + custom styles
│   │   └── api/
│   │       └── gap-filler/
│   │           └── route.ts       # POST /api/gap-filler serverless function
│   │
│   ├── components/
│   │   ├── StartScreen.tsx
│   │   ├── StartScreen.test.tsx
│   │   ├── SessionScreen.tsx
│   │   ├── SessionScreen.test.tsx
│   │   ├── SessionEndScreen.tsx
│   │   ├── SessionEndScreen.test.tsx
│   │   ├── CaptionArea.tsx
│   │   ├── CaptionArea.test.tsx
│   │   ├── CaptionLine.tsx
│   │   ├── CaptionLine.test.tsx
│   │   ├── StatusBar.tsx
│   │   ├── StatusBar.test.tsx
│   │   ├── ControlBar.tsx
│   │   └── ControlBar.test.tsx
│   │
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts
│   │   ├── useSpeechRecognition.test.ts
│   │   ├── useAudioPipeline.ts
│   │   ├── useAudioPipeline.test.ts
│   │   ├── useGapFiller.ts
│   │   ├── useGapFiller.test.ts
│   │   ├── useConnectionStatus.ts
│   │   ├── useConnectionStatus.test.ts
│   │   ├── useWakeLock.ts
│   │   └── useSessionTimer.ts
│   │
│   ├── context/
│   │   ├── SessionContext.tsx
│   │   └── SessionContext.test.tsx
│   │
│   ├── lib/
│   │   ├── captionReducer.ts
│   │   ├── captionReducer.test.ts
│   │   ├── gapFillerParser.ts
│   │   ├── gapFillerParser.test.ts
│   │   ├── geminiPrompt.ts        # Prompt template for Gemini
│   │   └── constants.ts           # Colors, thresholds, config values
│   │
│   └── types/
│       └── index.ts               # Shared TypeScript types
│
├── e2e/
│   ├── session.spec.ts
│   └── mobile.spec.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── package.json
├── PRD.md
├── PRD2.md
├── TDD.md
└── README.md
```


11. 1-Week Sprint Plan

Day 1 (Monday) — Project Setup + Core Shell
Person A:
- Initialize Next.js project with TypeScript + Tailwind CSS
- Set up PWA manifest, service worker, icons
- Build StartScreen and SessionScreen layout (mobile-first)
- Set up Vitest + React Testing Library

Person B:
- Set up audio pipeline: getUserMedia → AudioContext → RNNoise AudioWorklet
- Implement useSpeechRecognition hook with Web Speech API
- Write unit tests for speech recognition hook
- Test mic access on iOS Safari + Android Chrome

Day 2 (Tuesday) — Live Captions Working
Person A:
- Build CaptionArea + CaptionLine components
- Implement SessionContext + captionReducer
- Wire up speech recognition results → caption display
- Write unit tests for captionReducer

Person B:
- Build /api/gap-filler serverless endpoint
- Integrate Gemini API with prompt template
- Implement useGapFiller hook
- Write unit tests for gap filler parser + API route

Day 3 (Wednesday) — Gap Filler + Confidence Highlighting
Person A:
- Implement confidence highlighting (color coding for word types)
- Wire Gap Filler corrections into caption display (async update)
- Add tap-to-flag interaction on words
- Write CaptionLine component tests

Person B:
- Implement useConnectionStatus hook + reconnection logic
- Build connection lost / reconnecting UI banner
- Implement useWakeLock + useSessionTimer
- Write integration tests for full audio → caption flow

Day 4 (Thursday) — Polish + Session Flow
Person A:
- Build SessionEndScreen with stats and feedback prompt
- Add session timer display to StatusBar
- Polish mobile layout (safe areas, scroll behavior, touch targets)
- Test and fix iOS Safari quirks (AudioContext resume, STT restart)

Person B:
- Set up GitHub Actions CI workflow
- Deploy to Vercel (staging)
- Configure environment variables
- Write Playwright E2E tests (session flow + mobile viewport)

Day 5 (Friday) — Testing + Launch
Person A:
- Real device testing: iOS Safari (iPhone)
- Real device testing: Android Chrome
- Fix any mobile-specific bugs found
- Run Lighthouse audit, fix PWA/accessibility issues

Person B:
- Run full test suite, fix failures
- Real speech testing (accuracy validation with sample lectures)
- Final Vercel production deploy
- Update README with setup instructions and live URL
