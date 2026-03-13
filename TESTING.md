# Testing Guide

## Automated Tests

```bash
npm run test          # Unit tests (Vitest) — 150 tests across 17 files
npm run test:watch    # Watch mode for TDD
npm run test:e2e      # Playwright E2E — auto-starts dev server
npm run lint          # ESLint
```

Run a single test file:
```bash
npx vitest run src/hooks/useGapFiller.test.ts
npx playwright test e2e/session.spec.ts
```

See CLAUDE.md for test architecture details (mock patterns, fake timer gotchas).

---

## Manual Testing — Acceptance Criteria

### Core Captions

| Scenario | How to test | Pass criteria |
|----------|-------------|---------------|
| Caption latency | Speak a word, watch the display | Interim text appears within 1 second |
| Gap Filler fires | Speak a full sentence, pause | Blue-highlighted word(s) appear 1–3s after sentence finalizes |
| Confidence colors | Speak clearly vs. mumble | Clear = white, uncertain = amber, predicted = blue bg + underline |
| Tap-to-flag | Tap any word during a session | Word gets red underline; stays red |
| Session stats | End a session | Duration, word count, AI corrections all show correct numbers |

### Connection Handling

| Scenario | How to test | Pass criteria |
|----------|-------------|---------------|
| Offline banner | Turn on airplane mode mid-session | "Connection lost" banner appears, captions pause |
| Auto-reconnect | Turn airplane mode back off | STT resumes automatically, gap filler processes any queued sentences |
| Gap filler queue | Go offline, speak a sentence, come back online | That sentence gets gap-filled after reconnect |

---

## iOS Safari Checklist

> Use an actual iPhone — simulator does not test mic, AudioContext, or STT behavior.

**Setup:** Open production URL in Safari. Do not use Chrome on iOS.

- [ ] **Mic permission pre-prompt** — "Allow Microphone" dialog appears before the browser popup. Tap Allow.
- [ ] **AudioContext on tap** — Captions don't start until user taps "Start Captioning" (required by iOS).
- [ ] **STT auto-restart** — Stay silent for 6+ seconds during an active session. Captions should resume automatically when you speak again (iOS kills recognition after ~5s silence).
- [ ] **Caption display** — Text is readable at default size. Auto-scrolls to bottom as new words appear.
- [ ] **Safe area insets** — Bottom controls are not hidden behind the home indicator. Status bar content is not behind the notch.
- [ ] **Tap-to-flag** — Tapping a word on a touchscreen is reliable without accidentally flagging adjacent words.
- [ ] **PWA install** — Safari → Share → "Add to Home Screen" → app launches in standalone mode (no browser chrome).
- [ ] **Standalone mode** — After installing, launch from home screen. Status bar color matches the app. Splash screen appears briefly.
- [ ] **Gap filler colors** — Blue highlight and orange text are both visible on the dark background.

**Test devices:** iPhone SE (375px), iPhone 13/14/15 (390px), iPad Air (820px)

---

## Android Chrome Checklist

- [ ] **Mic permission** — Browser permission dialog appears. Tap Allow.
- [ ] **Captions stream** — Words appear within 1 second of speech.
- [ ] **PWA install** — "Add to Home Screen" banner appears after a few visits, or via browser menu.
- [ ] **Wake lock** — Screen does not dim during an active session (check Settings > Display timeout to confirm wake lock is overriding it).
- [ ] **Reconnect** — Toggle airplane mode on/off mid-session. STT resumes and banner disappears.
- [ ] **Gap filler** — Blue-highlighted corrections appear after sentences finalize.

---

## Gap Filler Verification

To confirm Gemini is being called (not just fallback):

1. Open browser DevTools → Network tab → filter by `/api/gap-filler`
2. Start a session and speak a complete sentence
3. You should see a POST request within 1–3 seconds of the sentence finalizing
4. Click the request → Response tab → verify `correctedSentence` and `words[]` with confidence scores

**If you see only `confirmed` words with confidence `1.0` on every word:** the API key is missing or the request is failing — check Vercel env vars or `.env.local`.

**Rate limit:** If Gemini hits its limit (250 req/day free tier), the status bar shows "AI enhancement paused" and all words show as white/confirmed. This is expected fallback behavior.

---

## Lighthouse Audit (PWA) — Completion Steps

**Target scores: PWA > 90, Accessibility > 90** (Performance optional but aim > 80)

### Option A: npm script (local)

1. Start the app: `npm run dev` (must be on port 3000).
2. Run: `npm run lighthouse`
3. Open `lighthouse-report.html` in the project root (it’s in `.gitignore`).
4. In the report, confirm **PWA** and **Accessibility** category scores are **≥ 90**.
5. If either is below 90, fix the listed issues and re-run.

### Option B: Chrome DevTools (production or local)

1. Open the app in Chrome (localhost:3000 or production URL).
2. DevTools → **Lighthouse** tab → Mode: **Navigation**, Device: **Mobile**.
3. Select categories **Progressive Web App** and **Accessibility**, then **Analyze**.
4. Confirm PWA and Accessibility scores **≥ 90**.

**Lighthouse = complete** when you have a run (Option A or B) where both PWA and Accessibility are ≥ 90. For Day 5, run again on the production URL before launch.

Key checks:
- **PWA:** installable, service worker active, manifest valid, theme-color
- **Accessibility:** interactive elements have labels, color contrast WCAG AA, focus-visible, skip link

---

## Known Browser Limitations

| Issue | Browser | Status |
|-------|---------|--------|
| Web Speech API not available | Firefox | By design — use Chrome or Safari |
| STT stops after 60s continuous | iOS Safari | Handled — auto-restart on `onend` |
| AudioContext requires user gesture | iOS Safari | Handled — session starts on tap |
| PWA install prompt not shown | Firefox | Partial support only |
| WakeLock requires iOS 16.4+ | iOS Safari | Graceful no-op on older versions |
