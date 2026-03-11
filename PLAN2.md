# Plan.md — Live Captions Pro: Implementation Plan
**Product:** Live Captions Pro  
**Version:** 2.0  
**Author:** Luba & Michael  
**Date:** March 10, 2026  
**Status:** Active

---

## Goals

Ship three production-ready features for Pro Captions across two milestones:

- **Milestone 1** — Smart FIFO display + Web Speech API (V1) live mic captioning
- **Milestone 2** — Deepgram auto diarization (V2) + standalone mobile PWA for users

---

## Milestones at a Glance

| Milestone | Features | Target |
|-----------|----------|--------|
| M1 | Smart FIFO + Web Speech V1 | Week 2 |
| M2 | Deepgram V2 + Mobile PWA | Week 5 |
| M3 | QA, polish, deploy | Week 6 |

---

## Milestone 1 — Smart FIFO + Web Speech API

### Week 1 — Foundation

**Task 1.1 — FIFO Data Model**
- Define `lines[]` array structure: `{ id, speakerId, words[], interim, done }`
- Write `pushLine()` with MAX_LINES trim logic
- Write `getLineOpacity()` decay function
- Unit test edge cases: empty queue, exactly MAX_LINES, overflow by 1, overflow by 3

**Task 1.2 — FIFO DOM Renderer**
- Build `renderStage()` with diff logic (add/remove by `data-lid`)
- Implement bottom-anchored flex layout
- Implement `slideUp` entry animation
- Test on iPhone SE (375px), iPhone 14 Pro (393px), iPad (768px), iPad Pro (1024px)

**Task 1.3 — Word Token Component**
- Build colored block word token with speaker background + text color
- Build ghost/interim token (dashed border, reduced opacity)
- Build blinking cursor token for active line end
- Test word wrapping at narrow screen widths

**Task 1.4 — Speaker Profiles**
- Define 4 speaker objects: name, role, bg color, text color
- Build speaker selector buttons with active state styling
- Wire speaker selection to `activeSpeakerId` state

---

### Week 2 — Web Speech API Integration

**Task 2.1 — Microphone Permission Flow**
- Build permission overlay UI for first launch
- Implement `getUserMedia` with optimized audio constraints
- Handle permission denied state with settings instructions
- Auto-detect previously granted permission via `navigator.permissions`

**Task 2.2 — Recognition Engine**
- Implement `buildRecognition()` with continuous + interim mode
- Wire `onresult` to separate final vs. interim transcripts
- Implement best-alternative selection by confidence score
- Handle `onend` with auto-restart for iOS Safari timeout

**Task 2.3 — Speaker Switching**
- Tap speaker button during live session → `currentLineId = null` → new line
- Ensure new line immediately adopts new speaker color
- Test rapid switching between speakers mid-sentence

**Task 2.4 — Line Break Logic**
- Auto-break lines exceeding 8 words
- Preserve readability at `clamp(20px, 4.5vw, 42px)` font size
- Test with fast talkers and long sentences

**Task 2.5 — Mic Status Indicators**
- Implement status bar: READY / LISTENING / WAITING / ERROR states
- Show interim text in status bar as ghost preview
- Show LIVE badge with pulsing dot while session is active

**Task 2.6 — M1 QA**
- Test on iPhone 13, iPhone SE, iPad Air
- Test at 4 ft, 6 ft, and 8 ft distances in quiet room
- Test at 6 ft with background noise (TV, music)
- Verify auto-restart behavior after iOS recognition timeout
- Verify FIFO pushes and removes lines correctly at MAX_LINES

---

## Milestone 2 — Deepgram V2 + Mobile PWA

### Week 3 — Deepgram Integration

**Task 3.1 — API Key Settings Panel**
- Build settings drawer or modal for Deepgram API key entry
- Mask key after entry (`••••••••••xxxx`)
- Persist key in `localStorage`
- Add clear/reset button
- Display estimated cost: `$0.0043/min`

**Task 3.2 — WebSocket Connection**
- Build `connectDeepgram(apiKey)` with correct URL params
- Implement `onopen`, `onmessage`, `onerror`, `onclose` handlers
- Show connection status in mic status bar

**Task 3.3 — Audio Streaming Pipeline**
- Implement `AudioContext` + `ScriptProcessorNode` (or `AudioWorkletNode`)
- Float32 → Int16 PCM conversion
- Send raw PCM chunks over WebSocket

**Task 3.4 — Diarization Mapping**
- Parse Deepgram `words[]` array with `speaker` field
- Group consecutive same-speaker words into caption line segments
- Map `speaker 0–3` → Pro Captions `speakerId 1–4`
- Handle mid-sentence speaker change (flush buffer, start new line)

**Task 3.5 — Reconnection Logic**
- Implement exponential backoff: 1s → 2s → 4s
- Show "RECONNECTING" status indicator
- Reset retry delay on successful reconnect

**Task 3.6 — Fallback Behavior**
- If no API key in localStorage → silently fall back to Web Speech V1
- Show "DEMO MODE" indicator when using V1 fallback

---

### Week 4 — Mobile PWA for End Users

**Task 4.1 — PWA Setup**
- Create `manifest.json` with name, icons, display: standalone, theme color
- Add all required Apple meta tags to `<head>`
- Create and register service worker for offline shell caching
- Generate 192x192 and 512x512 app icons

**Task 4.2 — Session Server**
- Set up Node.js + `ws` WebSocket server
- Implement session Map: `sessionId → Set<WebSocket>`
- Handle `CAPTION` broadcast to all session subscribers
- Handle `SESSION_END` cleanup after 30min inactivity
- Broadcast `USER_COUNT` on connect/disconnect

**Task 4.3 — Session Creation (Operator)**
- Add "Share Session" button to operator dashboard
- Generate `crypto.randomUUID()` session ID on click
- Display session URL: `https://procaptions.app/s/[id]`
- Generate and display QR code using qrcode.js
- Show live user count badge

**Task 4.4 — User Viewer App**
- Build `/s/[sessionId]` route — user-facing viewer
- Connect to session WebSocket on page load
- Render FIFO caption display (read-only, no mic controls)
- Implement font size toggle: SM / MD / LG / XL
- Implement pinch-to-zoom on caption text

**Task 4.5 — WakeLock**
- Request `navigator.wakeLock.request('screen')` on session join
- Re-request on `visibilitychange` (iOS releases lock on background)
- Release on session end or page unload

**Task 4.6 — Reconnection (User)**
- Detect WebSocket `onclose` while session is active
- Show "Reconnecting..." overlay with spinner
- Retry with exponential backoff
- Show "Session Ended" screen on `SESSION_END` event

---

### Week 5 — Integration + End-to-End Testing

**Task 5.1 — Operator → User Flow Test**
- Operator starts session → generates QR → user scans → captions appear
- Verify latency: speech to user screen < 500ms on same WiFi
- Test with 3 simultaneous user devices

**Task 5.2 — Deepgram End-to-End**
- Full flow: mic → PCM stream → Deepgram → diarization → FIFO display
- Test with 2 speakers alternating at 6 ft
- Test with 3 speakers including interruptions
- Measure diarization accuracy (target ≥ 90%)

**Task 5.3 — PWA Install Test**
- iOS: Safari → Share → Add to Home Screen → verify standalone launch
- Verify status bar color, icon, splash screen
- Verify WakeLock holds for 30min session

**Task 5.4 — Cross-Device Matrix**
- iPhone 13 / iPhone SE / iPhone 15 Pro
- iPad Air / iPad Pro
- MacBook Chrome (desktop operator)

---

### Week 6 — QA, Polish & Deploy

**Task 6.1 — Bug Bash**
- Run all user stories from PRD2 as acceptance tests
- File and fix P0/P1 bugs only for launch
- Regression test FIFO, V1, V2, and PWA together

**Task 6.2 — Performance**
- Measure caption render time (target < 100ms)
- Measure PWA load time on LTE (target < 3s)
- Audit JS bundle size — keep viewer app under 50KB gzipped

**Task 6.3 — Accessibility**
- Ensure caption text meets WCAG AA contrast ratios
- Test with iOS VoiceOver enabled (captions should still be readable visually)
- Verify font sizes are legible at all four size settings

**Task 6.4 — Deploy**
- Deploy session server to Railway / Fly.io / Render
- Deploy PWA to Vercel / Netlify with HTTPS
- Set up environment variables for Deepgram proxy (future)
- Smoke test production URLs

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| iOS Safari kills recognition after 60s | High | High | Auto-restart on `onend` — already implemented |
| Deepgram diarization misidentifies speaker | Medium | Medium | Allow manual override tap during session |
| WebSocket drops on mobile network switch (WiFi → LTE) | Medium | High | Exponential backoff reconnect |
| PWA rejected from iOS home screen add | Low | Medium | Test manifest.json + meta tags thoroughly |
| Background noise degrades V1 accuracy at 8 ft | High | Medium | Document environment requirements; recommend quiet rooms |
| Deepgram API cost surprise for long sessions | Low | Medium | Show cost estimate in UI; add optional session time limit |

---

## Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | Should Deepgram API key be stored client-side or proxied through our backend? | Michael | Week 3 |
| 2 | What is the max number of users per session for V1 launch? | Michael | Week 4 |
| 3 | Should user viewer require a session PIN for private events? | Michael | Week 4 |
| 4 | Do we need an Android-specific test pass or iOS only for V1? | Michael | Week 5 |
| 5 | Will the session server be self-hosted or managed (Railway, Fly.io)? | Michael | Week 3 |

---

## Definition of Done

A feature is considered done when:
- All functional requirements from PRD2 are implemented and verified
- Tested on at least 2 iOS devices and 1 desktop browser
- No P0 bugs open
- Code reviewed and merged to main
- Deployed to staging and smoke tested
