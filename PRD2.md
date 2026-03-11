# Live Captions Pro — Product Requirements Document

**Project:** Live Captions Pro
**Authors:** Luba Kaper & Michael Fehdrau
**Date:** March 08, 2026 — Updated March 10, 2026
**Reference:** TDD.md, PLAN.md
**Week 1 = MVP. Week 2 = Feature Expansion. Stop at Week 1 if time runs short.**

---

## Problem

Live captions exist — but they fail people at the worst moments. Words get dropped, technical terms get mangled, and there is no way to recover what was missed. For Deaf and hard of hearing users, this is not just frustrating — it means exclusion from critical conversations in healthcare, education, legal settings, and the workplace.

Current solutions from Google, Microsoft, and Apple all share the same core flaw: they show you what the AI heard — not what was actually said.

---

## Supporting Context

- ~48 million Americans (15% of adults) report some degree of hearing loss; ~2 million are functionally Deaf
- 90%+ of Deaf children are born to hearing parents — most navigate a hearing world without built-in support
- Deaf and hard of hearing individuals face significant obstacles in education and employment
- Even advanced ASR systems achieve only 80–90% accuracy with accents, jargon, and overlapping speakers
- ~65% of businesses now adopt live captioning — yet none of the dominant tools are built for high-stakes Deaf users

---

## Competitive Landscape

| Feature | Google Live Caption | Apple Live Captions | Microsoft Teams | Live Captions Pro |
|---------|-------------------|--------------------|-----------------|-----------------------|
| Real-time STT | Yes | Yes | Yes | Yes |
| Gap Filler (AI-predicted missed words) | No | No | No | **Yes — core differentiator** |
| Confidence Highlighting | No | No | No | **Yes — visual trust layer** |
| Multi-speaker color display | No | No | Limited | **Yes (Week 2)** |
| Auto speaker diarization | No | No | Limited | **Yes via Deepgram (Week 2)** |
| Standalone viewer app (shared session) | No | No | No | **Yes (Week 2)** |
| Domain-specific vocabulary | No | Limited | Limited | Yes — vertical-focused |
| Built for Deaf users | No | No | No | Yes — purpose-built |
| Open/free to use | Yes | Yes (Apple only) | Paid | Yes (MVP) |

---

## The Opportunity

No one has built live captioning for a specific high-stakes environment. Google, Apple, and Microsoft prioritize accuracy scores over actual comprehension. The opportunity is to build the first captioning product designed around **zero lost meaning** — owning a vertical like healthcare, legal, or education where getting every word right is a necessity.

**Market size:** Global live captioning market reached USD 1.42B in 2024, projected to reach USD 4.10B by 2033 (13.1% CAGR). North America accounts for ~41% of revenue, driven by ADA and Section 508 mandates. By 2050, 900M+ people globally will have disabling hearing loss.

---

## Users & Needs

**Primary Users:** Deaf and hard of hearing individuals — college students, professionals, and everyday users who rely on captions to access conversations in real time.

**Secondary Users:** Hearing individuals who speak into the mic — doctors, professors, lawyers, colleagues.

### Primary User Stories
- As a Deaf college student, I need to capture every word spoken in a fast-paced lecture because missing even one critical concept can affect my understanding and grades.
- As a Deaf employee, I need real-time captions during live meetings to contribute to discussions and be treated as an equal member of my team.

### Secondary User Stories
- As a professor lecturing to a Deaf student, I need my speech transcribed clearly and completely to deliver an equal learning experience without changing the way I teach.
- As a manager, I need my words and colleagues' responses accurately captioned so my Deaf employee has full access to every decision and direction.

---

## Proposed Solution

Live Captions Pro is a live captioning platform that combines real-time speech-to-text with an AI layer that fills gaps, flags uncertainty, and delivers the full meaning of every conversation. Built as a Progressive Web App (PWA) — works on iOS Safari, Android Chrome, and desktop with zero installation.

**Top 3 MVP Value Props:**
- **[The Vitamin]** Seeing every word fully so the brain can process the message without any gaps
- **[The Painkiller]** Eliminating the pain of dropped words and long silences — waiting for the next word, losing the thread of conversation
- **[The Steroid]** A supercharged audio layer that delivers captions within one second — no delay, no drop, no gap

---

## Goals & Non-Goals

**Goals:**
- Deliver real-time live captions with zero lost meaning for Deaf and hard of hearing users
- Build a purpose-built captioning product for one high-stakes vertical — education (MVP)
- Achieve 97%+ caption accuracy that outperforms Google, Apple, and Microsoft
- Give users confidence through Gap Filler and Confidence Highlighting
- Week 2: support multi-speaker events with color-coded speaker display and shared viewer sessions

**Non-Goals:**
- NOT a general-purpose captioning tool — vertical-specific
- NOT hardware — software-first product
- NOT multi-language in MVP — English first
- NOT a transcription storage or document export system in v1
- NOT replacing ASL interpreters — complement, not substitute
- NOT targeting hearing users as primary audience in v1
- NOT offline support in v1 — AI layer requires connectivity
- NOT user accounts or authentication in v1

---

## Technical Architecture (Summary — full detail in TDD.md)

**Week 1 (MVP):**
- Platform: PWA (Next.js on Vercel)
- STT: Web Speech API (browser built-in, free)
- AI Gap Filler: Google Gemini API free tier (Gemini 2.5 Flash)
- Audio Processing: Web Audio API + RNNoise WASM
- Backend: None — one serverless function (`/api/gap-filler`)

**Week 2 additions:**
- STT V2: Deepgram WebSocket API (auto diarization)
- Session Server: Node.js + WebSocket relay (Railway/Fly.io)
- Viewer App: `/s/[sessionId]` route — standalone PWA for end users

---

## Latency Budget

Target: under 1 second from speech to displayed caption.

| Stage | Budget | Method |
|-------|--------|--------|
| Audio capture | ~10ms | getUserMedia() |
| Noise filtering | ~20ms | RNNoise WASM AudioWorklet |
| Speech-to-Text | ~300–500ms | Web Speech API (interim results) |
| Caption rendering | ~10ms | React state update |
| **Total (live captions)** | **~340–540ms** | **Well under 1 second** |

Gap Filler runs asynchronously — does NOT block live caption display. Corrections are applied 3–5 seconds after a sentence finalizes.

---

## Gap Filler — How It Works

The Gap Filler is the core differentiator. It works as a post-processing layer, not inline:

1. Web Speech API streams interim results word-by-word (live captions appear immediately)
2. When a sentence finalizes, the completed text is sent to Gemini API
3. Gemini receives raw transcript + last 5 sentences of context and:
   - Identifies dropped or misheard words by grammar, context, and domain vocabulary
   - Assigns a confidence score to each word
   - Returns corrected text with annotations
4. UI updates the finalized sentence with corrections:
   - **High confidence (>90%):** white text — displayed normally
   - **Medium confidence (70–90%):** amber/orange text — Confidence Highlighting
   - **AI-predicted/filled (<70%):** blue background + underline
   - **User-flagged:** red underline on tap

**Rate Limiting:** Gemini free tier — 250 requests/day, 10/min. One request per completed sentence. Average 30-min session ≈ 200 sentences — within daily limit for 1 session/day.

---

## Audio Capture & Noise Handling

1. `getUserMedia()` requests mic access (iOS Safari 14.5+, Android Chrome, desktop)
2. Audio stream routed through Web Audio API `AudioContext`
3. RNNoise WASM processes audio in AudioWorklet (~20ms latency)
4. Cleaned audio fed to Web Speech API for transcription

**Known Limitations:**
- iOS Safari: `SpeechRecognition` may stop after silence — requires auto-restart
- iOS Safari: `AudioContext` must be resumed on user gesture
- Web Speech API sends audio to Google/Apple cloud — not on-device

---

## Connectivity & Error Handling

**When connection drops mid-session:**
- Live captions pause with "Connection lost — reconnecting..." banner
- App attempts reconnection every 2 seconds
- When connection restores, STT restarts automatically
- Gap Filler queues unsent sentences and processes on reconnection
- No audio lost during brief drops (<5s) — browser buffers mic input

**When Gemini rate limit is hit:**
- Gap Filler degrades gracefully — raw STT captions continue
- UI shows "AI enhancement paused"
- Captions remain fully functional, just without gap-filling

---

---

# WEEK 1 — MVP Requirements

### Stop here if time runs short. This is a fully shippable product.

---

## User Journey 1: Starting a Live Caption Session

**Context:** A Deaf user needs to start capturing speech immediately with zero friction — every second of delay is a word lost.

| Priority | Requirement |
|----------|-------------|
| **P0** | User can launch a live caption session in one tap |
| **P0** | User sees a pre-prompt UI explaining why microphone access is needed before the browser permission dialog |
| **P0** | User can see captions streaming word-by-word in real time with under 1 second latency |
| **P0** | User can identify uncertain words through Confidence Highlighting (amber color) |
| **P0** | User can visually distinguish AI-predicted/filled words (blue bg + underline) from confirmed words |
| P1 | User can see a live summary line below main captions capturing the full meaning |
| P2 | User can adjust caption text size, color, and display speed |

## User Journey 2: During a Caption Session

| Priority | Requirement |
|----------|-------------|
| **P0** | User reads fully gap-filled captions where missed words are predicted by AI — activates automatically |
| **P0** | User sees a clear "Listening..." indicator confirming active audio capture |
| **P0** | User sees "Connection lost" warning if internet drops, and captions auto-resume on reconnection |
| **P0** | User can tap any word to flag it as misheard |
| **P0** | System captures speech clearly in noisy environments using RNNoise |
| **P0** | System recognizes and correctly captions common academic terminology via Gemini domain prompting |
| P1 | User can see speaker labels identifying who is talking |
| P2 | User can tap any word to trigger a 3-Second Replay of that moment of audio |

## User Journey 3: Ending a Session

| Priority | Requirement |
|----------|-------------|
| **P0** | User can end a session in one tap |
| **P0** | User sees session stats (duration, words captured, AI corrections) |
| **P0** | User is prompted: "Did you miss anything important?" with YES / NO buttons |
| P1 | User can review a full transcript immediately after session ends |
| P2 | User can save or export the session transcript |

## User Journey 4: Access & PWA

| Priority | Requirement |
|----------|-------------|
| **P0** | User can access Live Captions Pro from iOS Safari, Android Chrome, or desktop browser |
| **P0** | User can install the PWA to their home screen in one tap |
| **P0** | No account creation required — open the URL and start captioning |
| P1 | User can create an account to save session history |

## Week 1 MVP Scope Summary

**In scope (P0 only):**
- PWA shell with responsive mobile-first UI
- One-tap session start/stop
- Mic permission pre-prompt UI
- Real-time captions via Web Speech API
- RNNoise noise suppression
- Gap Filler via Gemini API (async, post-processing)
- Confidence Highlighting (color-coded word certainty)
- Visual distinction: confirmed vs. AI-predicted words
- Connection status indicator (listening / paused / disconnected)
- Auto-reconnect + Gap Filler offline queue
- Tap-to-flag misheard word
- Session stats + YES/NO feedback prompt
- Installable PWA (manifest + service worker)
- Deployed to Vercel

**Out of scope for Week 1:**
- Speaker identification / diarization
- Multi-user shared sessions
- Deepgram integration
- Smart FIFO multi-speaker display
- User accounts, session history, export
- Live summary, 3-Second Replay
- Offline support, non-English languages

---

---

# WEEK 2 — Feature Expansion Requirements

### Built on top of the Week 1 MVP. Do not start until Week 1 is shipped.

---

## Feature 1 — Smart FIFO Caption Display

### Problem
When multiple speakers talk in sequence, captions need to remain readable without cluttering the screen. Traditional systems either wipe on each utterance or stack until overflow.

### Goal
A rolling caption display that anchors new speaker lines to the bottom, pushes older lines upward, and fades them progressively — mimicking real broadcast caption behavior.

### User Stories
- As a viewer, I see the current speaker's words at the bottom so I always know what is being said right now
- As a viewer, I see the previous 4–6 lines above for context
- As a viewer, older lines fade so my eye is drawn to the most recent caption
- As an operator, the display trims automatically — I never manually clear the screen

### Functional Requirements

| ID | Requirement |
|----|-------------|
| F1.1 | New caption lines always appear at the bottom of the stage |
| F1.2 | Existing lines shift upward when a new line is added |
| F1.3 | Maximum of 6 lines visible at any time |
| F1.4 | Lines fade progressively by age: newest=1.0, then 0.65, 0.52, 0.39, 0.26, 0.13 |
| F1.5 | When MAX_LINES exceeded, oldest line is removed from DOM |
| F1.6 | Each line displays a speaker name tag in that speaker's assigned color |
| F1.7 | Words rendered as colored block highlights matching the speaker's color |
| F1.8 | Interim (unconfirmed) words appear as ghost tokens with dashed borders |
| F1.9 | A blinking cursor appears at the end of the active line while speech is captured |
| F1.10 | Lines animate in with a 0.2s slide-up transition |

### Non-Functional Requirements
- Display updates within 100ms of receiving a new word token
- Renders correctly from iPhone SE (375px) to iPad Pro (1366px)
- No external libraries for FIFO logic — vanilla JS only

### Out of Scope
- Scrollable transcript history
- Persistent caption storage or export

---

## Feature 2 — Dual-Mode Speech Recognition Engine

### Problem
Different use cases need different STT capability. A single operator at a small event needs a free, instant solution. A production deployment with multiple speakers needs automatic diarization. One product must support both.

### Goal
Two selectable speech recognition modes: free browser-based (Web Speech API + manual speaker assignment) and premium real-time (Deepgram WebSocket + auto diarization).

---

### Version 1 — Web Speech API + Manual Speaker Switching

**How it works:** Browser's built-in `webkitSpeechRecognition` captures audio. Operator taps a speaker button to assign the correct color and name to the caption line.

**User Stories:**
- As an operator, I tap a speaker button to assign who is talking — their captions appear in the correct color
- As an operator, I switch speakers mid-session without stopping the caption stream
- As a viewer, I see each speaker's words in their assigned color immediately as they speak
- As an operator, I can use this free with no API key required

| ID | Requirement |
|----|-------------|
| F2.1 | App requests mic permission on first launch using `getUserMedia` |
| F2.2 | Audio constraints: `echoCancellation: true`, `noiseSuppression: true`, `autoGainControl: true`, `sampleRate: 16000` |
| F2.3 | Recognition runs in `continuous` mode with `interimResults: true` |
| F2.4 | `maxAlternatives` set to 3 for improved accuracy at 6–8 ft range |
| F2.5 | Recognition auto-restarts on `onend` while session is active (handles iOS Safari timeout) |
| F2.6 | Tapping a speaker button mid-session starts a new caption line for that speaker |
| F2.7 | Lines longer than 8 words automatically break into a new line |
| F2.8 | Interim words display as ghost tokens; replaced by final words on confirmation |
| F2.9 | Mic status bar shows current state: READY / LISTENING / WAITING / ERROR |
| F2.10 | Works on iPhone and iPad Safari without external hardware |

**Constraints:** Safari (iOS/macOS) and Chrome (desktop) only. No auto diarization. Audio processed by Google/Apple servers.

---

### Version 2 — Deepgram WebSocket + Auto Diarization

**How it works:** Audio streamed in real-time over WebSocket to Deepgram. Returns word-level transcriptions with speaker labels automatically mapped to the 4 speaker color profiles.

**User Stories:**
- As an operator, I enter my Deepgram API key once and the system automatically identifies who is speaking
- As a viewer, I see caption lines automatically assigned to the correct speaker color
- As an operator, I can map Deepgram speaker IDs (0–3) to custom speaker names and colors
- As an operator, I receive a warning if the WebSocket drops and the system reconnects automatically

| ID | Requirement |
|----|-------------|
| F2.11 | User enters Deepgram API key in a settings panel; key stored in `localStorage` |
| F2.12 | App opens WebSocket to `wss://api.deepgram.com/v1/listen` |
| F2.13 | WebSocket params: `diarize=true`, `punctuate=true`, `interim_results=true`, `encoding=linear16`, `sample_rate=16000` |
| F2.14 | Audio captured via `AudioWorkletNode` or `ScriptProcessorNode`, sent as raw PCM over socket |
| F2.15 | Deepgram `speaker` field (0–3) maps automatically to the 4 speaker profiles |
| F2.16 | New speaker line is created when `speaker` value changes between word results |
| F2.17 | If WebSocket closes unexpectedly, app shows reconnecting indicator and retries: 1s → 2s → 4s backoff |
| F2.18 | API key field is masked after entry; user can clear/reset via a button |
| F2.19 | Cost estimate displayed to operator (~$0.0043/min) |
| F2.20 | Falls back to Version 1 automatically if no API key is present; shows "DEMO MODE" badge |

**Constraints:** Requires Deepgram API key and internet. Diarization accuracy varies with overlapping speech. Deepgram identifies up to 8 speakers; Pro Captions maps the first 4.

---

## Feature 3 — Standalone Mobile Viewer App for End Users

### Problem
Pro Captions currently exists only within the operator's interface. End users — audience members, students, event attendees — have no way to access live captions on their own devices.

### Goal
Deploy Pro Captions as a standalone PWA that users open via shared link or QR code, install to their home screen, and use independently. Connects to the operator's session and displays captions in real time.

### User Stories
- As an event attendee, I scan a QR code to open Pro Captions on my iPhone — no App Store needed
- As an event attendee, I add Pro Captions to my home screen so it behaves like a native app
- As a Deaf or hard-of-hearing user, I read live captions on my own device
- As an operator, I generate a shareable session link or QR code from the dashboard
- As an operator, I see how many users are connected to the live session
- As a user, I choose my preferred caption font size (SM / MD / LG / XL)
- As a user, the app works in landscape and portrait on iPhone and iPad

| ID | Requirement |
|----|-------------|
| F3.1 | App deployed as PWA with valid `manifest.json` and service worker |
| F3.2 | `apple-mobile-web-app-capable` meta tag enables full-screen mode when added to home screen |
| F3.3 | Operator generates a unique session ID; users join via `https://procaptions.app/s/[ID]` |
| F3.4 | Caption data broadcast from operator to user devices via WebSocket session server |
| F3.5 | User device displays caption lines in FIFO format identical to operator view |
| F3.6 | User can adjust font size with a size toggle button (SM / MD / LG / XL) or pinch gesture |
| F3.7 | App works in portrait and landscape with responsive layout |
| F3.8 | Screen does not sleep while session is active (WakeLock API where supported) |
| F3.9 | If session connection drops, app shows "Reconnecting…" state and retries automatically |
| F3.10 | Operator dashboard shows active user count for the session |
| F3.11 | Session expires 30 minutes after operator ends it; users see a "Session Ended" screen |
| F3.12 | No login or account required for users to join |
| F3.13 | QR code for the session URL is generated and displayable on operator screen |

### Non-Functional Requirements
- App loads in under 3 seconds on standard LTE
- Supports iOS 15+ (Safari) and Android Chrome 90+
- Caption latency from operator speech to user screen: under 500ms on same WiFi
- Fully usable without native App Store install

### Out of Scope (V1)
- User accounts or saved session history
- In-session chat or feedback from users to operator
- Offline caption playback
- Android native app

---

## Success Metrics

### Week 1 — Product-Level

| Goal | Signal | Metric | Target |
|------|--------|--------|--------|
| Accuracy | Captions capture every word | Caption accuracy rate | 97%+ |
| Gap Filler | AI correctly predicts missed words | Gap Filler success rate | 90%+ |
| Speed | Captions appear immediately | Caption latency | < 1 second |
| User Trust | Users trust what they see | Confidence Highlight usefulness | Users report captions trustworthy |
| Session Quality | Users stay through full conversations | Average session length | 10+ minutes |
| Comprehension | Users understood the full conversation | Post-session survey | 85%+ positive |
| Zero Lost Meaning | Users missed nothing important | "Did you miss anything?" | Trending toward 0% |

### Week 2 — Feature-Level

| Feature | Metric | Target |
|---------|--------|--------|
| Smart FIFO display | Caption line render time | < 100ms |
| Web Speech (V1) | Word recognition accuracy at 6–8 ft | ≥ 80% |
| Deepgram (V2) | Speaker diarization accuracy (2+ speakers) | ≥ 90% |
| Mobile Viewer PWA | Session join time (link → captions visible) | < 5 seconds |
| Mobile Viewer PWA | User retention per session | ≥ 85% stay connected |

---

## Dependencies

| Feature | Dependency |
|---------|------------|
| Web Speech API | Safari 14.5+ / Chrome 90+ |
| RNNoise | AudioWorklet support (all modern browsers) |
| Gemini Gap Filler | Google Gemini API key (free tier) |
| Deepgram (Week 2) | Deepgram API key + internet connection |
| PWA deployment | HTTPS hosting, `manifest.json`, service worker |
| Session sharing (Week 2) | WebSocket session server |
| WakeLock (Week 2) | iOS 16.4+ Safari |

---

## Appendix

- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- RNNoise: https://jmvalin.ca/demo/rnnoise/
- Gemini API: https://ai.google.dev/
- Deepgram API: https://developers.deepgram.com/
- Next.js PWA guide: https://nextjs.org/docs
- Vercel deployment: https://vercel.com
