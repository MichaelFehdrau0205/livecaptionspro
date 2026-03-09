# Live Captions Pro

Real-time live captioning with zero lost meaning — built for Deaf and hard of hearing users in education.

## What It Does

Live Captions Pro combines real-time speech-to-text with an AI layer that fills gaps, flags uncertainty, and delivers the full meaning of every conversation.

**Core Features (MVP):**
- **Live Captions** — Word-by-word captions streaming under 1 second latency
- **Gap Filler** — AI predicts and fills missed/misheard words using surrounding context
- **Confidence Highlighting** — Color-coded words so users know what's confirmed vs. AI-predicted

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Speech-to-Text | Web Speech API (browser built-in) |
| AI Gap Filler | Google Gemini 2.5 Flash API |
| Noise Filtering | RNNoise WASM (AudioWorklet) |
| Hosting | Vercel (free tier) |
| Testing | Vitest + React Testing Library + Playwright |

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- A Google Gemini API key ([get one free](https://ai.google.dev/))

### Setup

```bash
git clone https://github.com/MichaelFehdrau0205/livecaptionspro.git
cd livecaptionspro
npm install
```

Create a `.env.local` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome or Safari.

### Run Tests

```bash
npm run test          # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
npm run lint          # Linting
```

## How It Works

1. User taps **Start Captioning** — mic activates, captions stream in real time
2. Web Speech API transcribes speech word-by-word (<1s latency)
3. RNNoise filters background noise for cleaner audio input
4. When a sentence is finalized, it's sent to the Gemini API for gap filling
5. AI returns corrected text with confidence scores
6. Display updates: confirmed words (white), AI-predicted words (blue highlight), uncertain words (orange)

## Mobile Support

Live Captions Pro is a Progressive Web App (PWA). It works on:
- **iOS** — Safari 14.5+ (install to home screen for app-like experience)
- **Android** — Chrome (PWA install prompt appears automatically)
- **Desktop** — Chrome, Edge, Safari

## Project Structure

```
src/
  app/          # Next.js pages + API routes
  components/   # React components (with colocated tests)
  hooks/        # Custom hooks (speech recognition, audio, gap filler)
  context/      # Session state management
  lib/          # Utilities, reducer, parser, constants
  types/        # TypeScript type definitions
e2e/            # Playwright E2E tests
public/         # PWA manifest, service worker, icons
```

## Deployment

Deployed automatically to Vercel on push to `main`. Pull requests get preview deployments.

Set `GEMINI_API_KEY` in Vercel dashboard under Environment Variables.

## Documentation

- [PRD2.md](./PRD2.md) — Product Requirements Document
- [TDD.md](./TDD.md) — Technical Design Document

## Authors

- Luba Kaper
- Michael Fehdrau
