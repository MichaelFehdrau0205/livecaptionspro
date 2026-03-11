# PRD2v3 — Live Captions Pro: Feature Expansion
**Product:** Live Captions Pro  
**Version:** 2.0  
**Author:** Luba & Michael  
**Date:** March 10, 2026  
**Status:** Draft

---

## Overview

This document defines the product requirements for three new features being added to Pro Captions. These features extend the core captioning experience with intelligent display logic, flexible speech recognition options, and a standalone mobile deployment for end users outside the core product environment.

---

## Feature 1 — Smart FIFO Caption Display

### Problem Statement
When multiple speakers talk in sequence, captions need to remain readable without cluttering the screen or abruptly clearing. Traditional caption systems either wipe the screen on each new utterance or stack text until the display overflows.

### Goal
Implement a Smart FIFO (First In, First Out) rolling caption display that anchors new speaker lines to the bottom of the screen, pushes older lines upward, and fades them out progressively — mimicking real broadcast caption behavior.

### User Stories
- As a viewer, I can see the current speaker's words appear at the bottom of the screen so I always know what is being said right now.
- As a viewer, I can see the previous 4–6 lines above the current line so I have context for what was just said.
- As a viewer, older lines fade out gradually so my eye is naturally drawn to the most recent caption.
- As an operator, the display automatically trims lines once the max visible count is reached so I never need to manually clear the screen.

### Functional Requirements

| ID | Requirement |
|----|-------------|
| F1.1 | New caption lines always appear at the bottom of the caption stage |
| F1.2 | Existing lines shift upward when a new line is added |
| F1.3 | Maximum of 6 lines are visible at any time |
| F1.4 | Lines older than position 1 (newest) fade in opacity progressively: 0.65, 0.52, 0.39, 0.26, 0.13 |
| F1.5 | When MAX_LINES is exceeded, the oldest line is removed from the DOM |
| F1.6 | Each line displays a speaker name tag in the speaker's assigned color |
| F1.7 | Words in each line are rendered as colored block highlights matching the speaker's color |
| F1.8 | Interim (unconfirmed) words appear as ghost tokens with dashed borders |
| F1.9 | A blinking cursor appears at the end of the active line while speech is being captured |
| F1.10 | Lines animate in with a 0.2s slide-up transition |

### Non-Functional Requirements
- Display must update within 100ms of receiving a new word token
- Must render correctly on screen sizes from iPhone SE (375px) to iPad Pro (1366px)
- No external libraries required for the FIFO logic — vanilla JS only

### Out of Scope
- Scrollable transcript history (covered in a separate component)
- Persistent caption storage or export

---

## Feature 2 — Dual-Mode Speech Recognition Engine

### Problem Statement
Different use cases require different levels of speech recognition capability. A single operator running a small event needs a free, instant solution. A production deployment with multiple unidentified speakers needs automatic voice diarization. Pro Captions must support both without requiring users to switch products.

### Goal
Provide two selectable speech recognition modes within the same interface: a free browser-based mode using the Web Speech API with manual speaker assignment, and a premium real-time mode using Deepgram's WebSocket API with automatic speaker diarization.

---

### Version 1 — Web Speech API + Manual Speaker Switching

#### How It Works
The browser's built-in `webkitSpeechRecognition` (Safari/Chrome) captures audio from the device microphone and returns real-time transcriptions. The operator manually taps the active speaker button before or during that person's speech to assign the correct color and name tag to the caption line.

#### User Stories
- As an operator, I can tap a speaker button to assign who is currently talking so their captions appear in the correct color.
- As an operator, I can switch speakers mid-session without stopping the caption stream.
- As a viewer, I see each speaker's words appear in their assigned color block immediately as they speak.
- As an operator, I can use this feature for free with no API key or account required.

#### Functional Requirements

| ID | Requirement |
|----|-------------|
| F2.1 | App requests microphone permission on first launch using `getUserMedia` |
| F2.2 | Audio constraints set to: `echoCancellation: true`, `noiseSuppression: true`, `autoGainControl: true`, `sampleRate: 16000` |
| F2.3 | Recognition runs in `continuous` mode with `interimResults: true` |
| F2.4 | `maxAlternatives` set to 3 for improved accuracy at 6–8 ft range |
| F2.5 | Recognition auto-restarts on `onend` event while session is active (handles iOS Safari timeout) |
| F2.6 | Tapping a speaker button mid-session starts a new caption line assigned to that speaker |
| F2.7 | Lines longer than 8 words automatically break into a new line |
| F2.8 | Interim words display as ghost tokens and are replaced by final words on confirmation |
| F2.9 | Mic status bar shows current state: READY / LISTENING / WAITING / ERROR |
| F2.10 | Works on iPhone and iPad Safari without any external hardware |

#### Constraints
- Browser support: Safari (iOS/macOS), Chrome (desktop) only
- No speaker diarization — operator must manually assign speakers
- Audio is sent to Google's servers (Chrome) or Apple's servers (Safari) for processing
- Range: 4–6 ft (iPhone), 6–10 ft (iPad) with built-in mic only

---

### Version 2 — Deepgram WebSocket + Auto Diarization

#### How It Works
Audio is captured via `getUserMedia` and streamed in real-time over a WebSocket connection to Deepgram's API. Deepgram returns word-level transcriptions with speaker labels (`speaker_0`, `speaker_1`, etc.) which are automatically mapped to the four speaker color profiles in Pro Captions. No manual speaker switching is required.

#### User Stories
- As an operator, I can enter my Deepgram API key once and the system automatically identifies who is speaking without any manual switching.
- As a viewer, I see caption lines automatically assigned to the correct speaker color as soon as the voice is recognized.
- As an operator, I can map Deepgram's speaker IDs (0–3) to custom speaker names and colors in the settings panel.
- As an operator, I receive a warning if the WebSocket connection drops and the system attempts automatic reconnection.

#### Functional Requirements

| ID | Requirement |
|----|-------------|
| F2.11 | User can enter a Deepgram API key in a settings panel; key is stored in `localStorage` |
| F2.12 | App opens a WebSocket connection to `wss://api.deepgram.com/v1/listen` with auth header |
| F2.13 | WebSocket params: `diarize=true`, `punctuate=true`, `interim_results=true`, `encoding=linear16`, `sample_rate=16000` |
| F2.14 | Audio captured via `AudioWorkletNode` or `ScriptProcessorNode` and sent as raw PCM over the socket |
| F2.15 | Deepgram `speaker` field (0–3) maps automatically to the 4 speaker profiles |
| F2.16 | New speaker line is created when the `speaker` value changes between word results |
| F2.17 | If WebSocket closes unexpectedly, app displays a reconnecting indicator and retries with exponential backoff (1s, 2s, 4s) |
| F2.18 | API key field is masked after entry; user can clear/reset via a button |
| F2.19 | Cost estimate is displayed to the operator (approx. $0.0043/min) |
| F2.20 | Falls back to Version 1 automatically if no API key is present |

#### Constraints
- Requires a valid Deepgram API key
- Requires internet connection
- Diarization accuracy varies with overlapping speech and background noise
- Deepgram identifies up to 8 speakers; Pro Captions maps the first 4 to color profiles

---

## Feature 3 — Standalone Mobile App for End Users (iPhone/iPad)

### Problem Statement
Pro Captions currently exists as an in-product feature accessible only within the operator's interface. End users — clients, audience members, students, event attendees — have no way to access live captions on their own devices without being given access to the operator environment.

### Goal
Deploy Pro Captions as a standalone Progressive Web App (PWA) that users can open on their iPhone or iPad via a shared link or QR code, install to their home screen, and use independently from the operator product. The app connects to a session shared by the operator and displays live captions streamed in real time.

### User Stories
- As an event attendee, I can scan a QR code or tap a link to open Pro Captions on my iPhone without downloading an app from the App Store.
- As an event attendee, I can add Pro Captions to my iPhone home screen so it behaves like a native app.
- As a Deaf or hard-of-hearing user, I can read live captions on my own device from up to 6–8 feet away from the sound source.
- As an operator, I can generate a shareable session link or QR code from the operator dashboard.
- As an operator, I can see how many users are connected to a live session.
- As a user, I can choose my preferred caption font size (small, medium, large) for readability.
- As a user, the app works in landscape and portrait orientation on both iPhone and iPad.

### Functional Requirements

| ID | Requirement |
|----|-------------|
| F3.1 | App is deployed as a PWA with a valid `manifest.json` and service worker |
| F3.2 | `apple-mobile-web-app-capable` meta tag enables full-screen mode when added to home screen |
| F3.3 | Operator generates a unique session ID; users join via `https://procaptions.app/session/[ID]` |
| F3.4 | Caption data is broadcast from operator to user devices via WebSocket or WebRTC data channel |
| F3.5 | User device displays caption lines in FIFO format identical to the operator view |
| F3.6 | User can adjust font size with a pinch gesture or a size toggle button |
| F3.7 | App works in both portrait and landscape orientation with responsive layout |
| F3.8 | Screen does not sleep while a session is active (use `WakeLock API` where supported) |
| F3.9 | If the session connection drops, app shows a "reconnecting" state and retries automatically |
| F3.10 | Operator dashboard shows active user count for the session |
| F3.11 | Session expires 30 minutes after the operator ends it; users see an "Session Ended" screen |
| F3.12 | No login or account required for users to join a session |
| F3.13 | QR code for the session URL is generated and displayable on the operator screen |

### Non-Functional Requirements
- App must load in under 3 seconds on a standard LTE connection
- Must support iOS 15+ (Safari) and Android Chrome 90+
- Caption latency from operator speech to user screen must be under 500ms on the same WiFi network
- App must be fully usable without a native App Store install

### Out of Scope (V1)
- User accounts or saved session history
- In-session chat or feedback from users to operator
- Offline caption playback
- Android native app

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Smart FIFO | Caption line render time | < 100ms |
| Web Speech API | Word recognition accuracy at 6–8 ft | ≥ 80% |
| Deepgram | Speaker diarization accuracy (2+ speakers) | ≥ 90% |
| Mobile PWA | Session join time (link to captions visible) | < 5 seconds |
| Mobile PWA | User retention per session | ≥ 85% stay connected |

---

## Dependencies

| Feature | Dependency |
|---------|------------|
| Web Speech API | Safari 14.5+ / Chrome 90+ |
| Deepgram | Deepgram API key + internet connection |
| PWA deployment | HTTPS hosting, `manifest.json`, service worker |
| Session sharing | WebSocket server or WebRTC signaling server |
| WakeLock | iOS 16.4+ Safari support |
