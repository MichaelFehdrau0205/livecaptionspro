# Live Captions Pro

Real-time live captioning with zero lost meaning — built for Deaf and hard of hearing users in education.

**Live app:** https://livecaptionspro.vercel.app

## What It Does

Live Captions Pro combines real-time speech-to-text with an AI layer that fills gaps, flags uncertainty, and delivers the full meaning of every conversation.

**Core Features:**
- **Live Captions** — Word-by-word captions streaming under 1 second latency
- **Confidence Highlighting** — Per-word color coding shows what's confirmed vs. uncertain vs. predicted, in real time
- **Deepgram Integration** — Real per-word confidence scores from a production STT model (bring your own API key)
- **AI Gap Filler** — Gemini corrects misheard words using surrounding context
- **PWA** — Installable, works offline, no app store needed

## Confidence Color System

| Color | Meaning | Confidence |
|-------|---------|-----------|
| White | Confirmed — STT is certain | ≥ 90% |
| Amber | Uncertain — may be mishearing | 70–89% |
| Blue highlight | Predicted — low confidence or AI-corrected | < 70% |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Speech-to-Text (default) | Web Speech API (browser built-in, free) |
| Speech-to-Text (enhanced) | Deepgram Nova-3 (per-word confidence, bring your own key) |
| AI Gap Filler | Google Gemini 2.5 Flash API |
| Noise Filtering | RNNoise WASM (AudioWorklet) |
| Hosting | Vercel |
| Testing | Vitest + React Testing Library + Playwright |

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- A Google Gemini API key ([get one free](https://ai.google.dev/))
- Optional: A Deepgram API key for real per-word confidence ([get one free — $200 credit](https://console.deepgram.com))

### Setup

```bash
git clone https://github.com/MichaelFehdrau0205/livecaptionspro.git
cd livecaptionspro
npm install
```

Create a `.env.local` file:

```
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — enables real-time per-word confidence highlighting
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome or Safari.

> **Note:** First run after changes: clear browser site data (DevTools → Application → Clear site data) to bypass the service worker cache.

### Run Tests

```bash
npm run test          # Unit tests (Vitest) — 200 tests
npm run test:e2e      # E2E tests (Playwright)
npm run lint          # Linting
```

## How It Works

**With Deepgram (recommended):**
1. User taps **Start Captioning** — mic activates via Deepgram WebSocket
2. PCM audio streams to Deepgram Nova-3 in real time
3. Words appear with confidence colors immediately as you speak
4. Finalized sentences are also sent to Gemini for text correction

**Without Deepgram (fallback):**
1. Web Speech API transcribes speech (<1s latency)
2. RNNoise filters background noise
3. Finalized sentences sent to Gemini for confidence scoring + correction
4. Display updates after Gemini responds (~1–2s delay)

## Browser Compatibility

| Browser | STT | Confidence | PWA |
|---------|-----|-----------|-----|
| Chrome (desktop/Android) | ✅ | ✅ with Deepgram | ✅ |
| Safari (iOS/macOS) | ✅ | ✅ with Deepgram | ✅ |
| Edge | ✅ | ✅ with Deepgram | ✅ |
| Firefox | ❌ No Web Speech API | ✅ with Deepgram | ✅ |

> **iOS note:** Open in Safari as a browser tab (not from Home Screen) for speech recognition. Enable Dictation in Settings → General → Keyboard.

## Deployment

Deployed automatically to Vercel on push to `main`. Pull requests get preview deployments.

Set in Vercel dashboard → Environment Variables:
- `GEMINI_API_KEY` — required
- `NEXT_PUBLIC_DEEPGRAM_API_KEY` — optional, enables enhanced confidence

## Documentation

- [PLAN.md](./PLAN.md) — Sprint plan
- [TDD.md](./TDD.md) — Technical Design Document
- [PRD2.md](./PRD2.md) — Product Requirements Document
- [TESTING.md](./TESTING.md) — Testing guide and device checklists

## Authors

- Luba Kaper
- Michael Fehdrau
