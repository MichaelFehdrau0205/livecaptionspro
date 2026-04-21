# Live Captions Pro

![Live Captions Pro Splashpage](public/Images/project-screenshot.png)

## Live Captions Pro Screenshots
![Live Captions Pro Screenshots](public/Images/iPhoneScreenshot.png)

**Real-time captions with zero lost meaning.**

Live Captions Pro is a captioning app built for Deaf and hard-of-hearing users in education. It does more than show words on a screen: it helps users judge whether those words are trustworthy.

**Live app:** [livecaptionspro.vercel.app](https://livecaptionspro.vercel.app)

## The Problem

Most live captioning tools show text as if it were equally reliable.

That creates a real accessibility gap:
- users can read the words, but they cannot tell which words are likely correct
- in a lecture, one wrong word can change the meaning of an explanation
- in a group conversation, fast speaker changes make it hard to follow who said what
- exported transcripts often look like raw subtitle dumps, not something a student would actually review later

In short: **captioning apps often capture words, but still lose meaning.**

## Our Solution

Live Captions Pro treats captioning as both a **live understanding problem** and a **review problem**.

It solves that by combining:
- **real-time captions**
- **confidence-aware word styling**
- **mode-specific experiences for lectures vs. group conversations**
- **review-ready PDF export**
- **AI-assisted cleanup for unclear text**

The result is a captioning experience where users can quickly answer:

**What was said?**

**How confident should I be in it?**

**What should I double-check later?**

## Why It Feels Different

### Confidence-Aware, Not Just Real-Time
- White words are high confidence
- Amber words are uncertain
- Blue-highlighted words are predicted or corrected

Users are not forced to trust every word equally.

### Two Modes, Two Use Cases
- **Lecture Mode** is optimized for a single speaker and flowing review text
- **Group Mode** is optimized for multi-speaker conversations with speaker-based visual separation

### Review-Ready Export
Instead of exporting a messy caption log, Live Captions Pro generates a cleaner document experience:
- polished lecture transcript PDFs
- polished group conversation transcript PDFs
- separate low-confidence review section
- notes area for follow-up

## Core Features

| Feature | Why It Matters |
|---|---|
| **Live Captions** | Fast on-screen captions for real-time access |
| **Confidence Highlighting** | Users can judge what is reliable and what may need review |
| **Lecture Mode** | Cleaner, flowing single-speaker reading experience |
| **Group Mode** | Better speaker separation for discussion-heavy sessions |
| **Speaker Diarization** | Deepgram helps distinguish who is speaking |
| **Pause / Resume** | Users can control the session without losing context |
| **Save as PDF** | Turns the session into a document worth saving and reviewing |
| **AI Gap Filler** | Uses context to improve unclear transcript segments |
| **PWA** | Installable and usable on phones/tablets without an app store |

## PDF Export Highlights

The PDF export is designed to feel like a real document, not a subtitle transcript pasted into print.

### Lecture PDF
- clean header with date and duration
- summary section
- paragraph-style transcript blocks
- reduced timestamp clutter
- low-confidence review section
- notes section

### Group PDF
- participant section
- key moments section
- speaker-grouped transcript blocks
- uncertainty review section
- notes section

## Demo Story

If you are seeing Live Captions Pro in a presentation, the key idea is simple:

> Real-time captions are not enough if users cannot tell what to trust.

Live Captions Pro adds the missing layer of confidence, structure, and reviewability.

## Display Modes

| Mode | Best For | Visual Behavior |
|---|---|---|
| **Lecture** | Class sessions, presentations, one main speaker | Flowing text with per-word confidence styling |
| **Group** | Meetings, discussions, multi-speaker environments | Speaker-separated caption blocks |

Switching modes starts a fresh session so each transcript stays coherent.

## Confidence Color System

| Color | Meaning | Confidence |
|---|---|---|
| White | Confirmed | 90%+ |
| Amber | Uncertain | 70–89% |
| Blue highlight | Predicted / corrected | Below 70% or AI-adjusted |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 + TypeScript |
| Styling | Tailwind CSS |
| Default STT | Web Speech API |
| Enhanced STT | Deepgram Nova-3 |
| AI Correction | Google Gemini 2.5 Flash |
| Noise Filtering | RNNoise WASM |
| Hosting | Vercel |
| Testing | Vitest + React Testing Library + Playwright |

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- Google Gemini API key
- Optional: Deepgram API key for enhanced per-word confidence and speaker diarization

### Setup

```bash
git clone https://github.com/MichaelFehdrau0205/livecaptionspro.git
cd livecaptionspro
npm install
cp .env.example .env.local
```

Then add your keys to `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test

```bash
npm run test
npm run test:e2e
npm run lint
```

## Browser Support

| Browser | Speech Recognition | Enhanced Confidence / Diarization | PWA |
|---|---|---|---|
| Chrome | Yes | Yes with Deepgram | Yes |
| Safari | Yes | Yes with Deepgram | Yes |
| Edge | Yes | Yes with Deepgram | Yes |
| Firefox | No built-in Web Speech API | Yes with Deepgram | Yes |

## Built For Education

Live Captions Pro is especially useful in classrooms, office hours, study groups, and discussion-heavy academic environments where:
- technical vocabulary matters
- speaker changes happen quickly
- users need both real-time access and something reliable to review later

## Authors

- Luba Kaper
- Michael Fehdrau
