# Live Captions Pro — Technical Design Document

**Project:** Live Captions Pro
**Authors:** Luba Kaper & Michael Fehdrau
**Date:** March 10, 2026
**Reference:** PRD2.md, PRD3.md, PLAN.md
**Week 1 = MVP architecture. Week 2 = V2 features layered on top.**

---

## 1. System Architecture

### Week 1 — MVP (Browser + Vercel only)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                                                              │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────────┐  │
│  │ Mic Input │───▶│ RNNoise   │───▶│ Web Speech API       │  │
│  │ getUserMe-│    │ WASM      │    │ SpeechRecognition    │  │
│  │ dia()     │    │ AudioWork-│    │ (interim + final)    │  │
│  └──────────┘    └───────────┘    └──────────┬───────────┘  │
│                                               │              │
│                                    ┌──────────▼───────────┐  │
│                                    │ Caption State Manager │  │
│                                    │ (React Context)       │  │
│                                    └──────────┬───────────┘  │
│                                               │              │
│                         ┌─────────────────────┼──────────┐   │
│                  ┌──────▼──────┐    ┌─────────▼──────┐   │   │
│                  │ Caption     │    │ Gap Filler      │   │   │
│                  │ Display     │    │ Client          │   │   │
│                  └─────────────┘    └────────┬────────┘   │   │
└──────────────────────────────────────────────┼────────────┘
                                               │
                              ┌────────────────▼────────────────┐
                              │         VERCEL (Serverless)      │
                              │  POST /api/gap-filler            │
                              │  → Gemini 2.5 Flash API          │
                              └─────────────────────────────────┘
```

### Week 2 — V2 (adds Session Server + Multi-user Viewer)

```
┌─────────────────────────────────────────────────────────────┐
│                        OPERATOR DEVICE                       │
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐   │
│  │  Microphone │───▶│ Speech Engine│───▶│  FIFO Display │   │
│  │ (built-in)  │    │  V1: Web API │    │   (DOM)       │   │
│  └─────────────┘    │  V2: Deepgram│    └───────┬───────┘   │
│                     └──────────────┘            │            │
└─────────────────────────────────────────────────┼────────────┘
                                                  │ WebSocket
                                                  ▼
                                        ┌─────────────────┐
                                        │  Session Server  │
                                        │  (Node.js/ws)    │
                                        └────────┬────────┘
                                                 │ Broadcast
                              ┌──────────────────┼──────────────────┐
                              ▼                  ▼                  ▼
                     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                     │  User iPhone │  │  User iPhone │  │  User iPad   │
                     │  (PWA/Safari)│  │  (PWA/Safari)│  │  (PWA/Safari)│
                     └──────────────┘  └──────────────┘  └──────────────┘
```

**Key Design Decisions:**
- Web Speech API runs on-device — no audio sent to servers
- Gap Filler is the only server-side component in V1 — keeps Gemini API key secure
- All state lives in the browser session — no database, no persistence in V1
- V2 adds a lightweight session relay server (no storage, pure broadcast)

---

## 2. Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Framework | Next.js (App Router) | 15.x | React-based, serverless API routes, Vercel-native |
| Language | TypeScript | 5.x | Type safety, fewer runtime bugs |
| Styling | Tailwind CSS | 4.x | Utility-first, mobile-first by default |
| STT V1 | Web Speech API | Browser built-in | Free, zero setup, works on Chrome/Safari |
| STT V2 | Deepgram WebSocket | Latest | Auto-diarization, better accuracy, streaming |
| AI | Google Gemini API | 2.5 Flash | Best free tier (250 req/day), fast responses |
| Noise Filter | RNNoise WASM | Latest | ML-based noise suppression, ~200KB, AudioWorklet |
| Session Server | Node.js + ws | Latest | Lightweight WebSocket relay for multi-user viewer (Week 2) |
| Testing | Vitest + React Testing Library | Latest | Fast, Vite-compatible |
| E2E Testing | Playwright | Latest | Cross-browser, mobile emulation |
| Linting | ESLint + Prettier | Latest | Code consistency |
| Hosting (PWA) | Vercel | Free tier | Zero-config Next.js deploys, preview URLs |
| Hosting (Server) | Railway / Fly.io | Latest | WebSocket-friendly, simple deploy (Week 2) |
| CI/CD | GitHub Actions + Vercel | Free | Auto-deploy on push |

---

## 3. Mobile-First Design

**Approach:** All UI designed for mobile viewport first (375px), scaled up for tablet (768px) and desktop (1024px+).

**Breakpoints:**
- Mobile: 0–767px (default styles)
- Tablet: 768–1023px (`md:` prefix)
- Desktop: 1024px+ (`lg:` prefix)

**Touch & Mobile Considerations:**
- All tap targets minimum 44×44px (Apple HIG / WCAG 2.5.5)
- Caption text defaults to 20px on mobile, 18px on desktop
- Bottom-anchored controls (thumb-reachable zone)
- No hover-dependent interactions — everything works with tap
- `viewport-fit=cover` for notch/safe area handling
- Full-screen caption area with auto-scroll to latest text

**PWA Configuration:**
- `manifest.json`: name, short_name, icons (192px + 512px), start_url, display: standalone, theme_color
- Service worker: caches app shell (HTML, CSS, JS bundles)
- Apple-specific meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
- Splash screens for iOS

**iOS-Specific Handling:**
- `AudioContext` must be created/resumed on user tap (not on page load)
- `SpeechRecognition` auto-restart on silence timeout (iOS stops after ~5s)
- `getUserMedia()` — show pre-prompt UI explaining why mic is needed
- Safe area insets via `env(safe-area-inset-bottom)` for bottom controls

**Android-Specific Handling:**
- Chrome handles `SpeechRecognition` natively (most reliable)
- PWA install banner appears automatically after engagement criteria
- Wake Lock API to prevent screen dimming

---

## 4. UI Wireframes

### 4.1 Start Screen (Mobile — 375px)

```
┌─────────────────────────────┐
│  ─  ─  ─  (status bar)     │
│                             │
│      LIVE CAPTIONS PRO      │
│                             │
│      Real-time captions     │
│      with zero lost         │
│      meaning.               │
│                             │
│   ┌───────────────────────┐ │
│   │    START CAPTIONING   │ │
│   └───────────────────────┘ │
│                             │
│     Education Mode          │
│  ─  ─  ─  (safe area)      │
└─────────────────────────────┘
```

### 4.2 Active Session — Mobile

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
│─────────────────────────────│
│   🔴  ┌─────────────────┐   │
│   MIC │  END SESSION     │   │
│       └─────────────────┘   │
└─────────────────────────────┘

Legend:
● = green dot (listening)
[executive] = Gap Filler predicted word (blue bg)
█ = blinking cursor
🔴 = mic active
```

**Color coding:**
- Default text: white on dark (#1a1a2e)
- AI-predicted words: blue background (#3b82f6 at 30% opacity) + underline
- Low-confidence words: orange text (#f59e0b)
- Flagged words (user tapped): red underline

### 4.3 Active Session — Desktop (1024px+)

```
┌──────────────────────────────────────────────────────────────────┐
│  ● LISTENING                                          00:12:34   │
│──────────────────────────────────────────────────────────────────│
│         So today we're going to talk about the three main        │
│         branches of government. The [executive] branch           │
│         enforces them. And the judicial branch interprets        │
│         the constitution and reviews laws for [constitut-        │
│         ionality]. Each branch has checks and balances...        │
│         █                                                        │
│──────────────────────────────────────────────────────────────────│
│                    🔴 MIC ON        [ END SESSION ]               │
└──────────────────────────────────────────────────────────────────┘
```

Desktop differences: caption text centered, max-width 720px, font 22px.

### 4.4 Connection Lost State

```
┌─────────────────────────────┐
│  ⚠ CONNECTION LOST          │
│  Reconnecting...            │
│─────────────────────────────│
│  (previous captions still   │
│   visible but grayed out)   │
│─────────────────────────────│
│   ○  ┌─────────────────┐   │
│  OFF │  END SESSION     │   │
│       └─────────────────┘   │
└─────────────────────────────┘
```

### 4.5 Session Ended

```
┌─────────────────────────────┐
│      SESSION ENDED          │
│      Duration: 00:32:15     │
│      Words captured: 4,832  │
│      AI corrections: 47     │
│─────────────────────────────│
│   Did you miss anything     │
│   important?                │
│   [ YES ]     [ NO ]        │
│─────────────────────────────│
│   ┌───────────────────────┐ │
│   │   NEW SESSION         │ │
│   └───────────────────────┘ │
└─────────────────────────────┘
```

### 4.6 User Viewer App — `/s/[sessionId]` (Week 2)

```
┌─────────────────────────────┐
│  PRO CAPTIONS  ● LIVE   7👥 │
│─────────────────────────────│
│                             │
│  [Speaker 1 — Blue]         │
│  So today we're going to    │
│  talk about photosynthesis  │
│                             │
│  [Speaker 2 — Green]        │
│  Can you explain the role   │
│  of chlorophyll?            │
│                             │
│─────────────────────────────│
│  SM  MD  LG  XL    ⚙        │
└─────────────────────────────┘
```

---

## 5. Component Breakdown

### Week 1 Component Tree

```
App (layout.tsx)
├── StartScreen
│   ├── Logo
│   ├── MicPermissionModal (pre-prompt)
│   ├── StartButton
│   └── ModeIndicator ("Education Mode")
│
├── SessionScreen
│   ├── StatusBar
│   │   ├── ListeningIndicator (● LISTENING)
│   │   ├── ConnectionStatus (connected/reconnecting/lost)
│   │   └── SessionTimer
│   │
│   ├── CaptionArea
│   │   ├── CaptionLine (repeated)
│   │   │   ├── ConfirmedWord
│   │   │   ├── PredictedWord (blue bg + underline)
│   │   │   └── UncertainWord (orange)
│   │   └── CaptionCursor (blinking)
│   │
│   └── ControlBar
│       ├── MicIndicator
│       └── EndSessionButton
│
└── SessionEndScreen
    ├── SessionStats
    ├── FeedbackPrompt (YES / NO)
    └── NewSessionButton
```

### Week 2 Additions

```
App
├── SettingsPanel (Deepgram API key, cost display)
├── ShareSessionModal (QR code, user count badge)
│
└── /s/[sessionId] — UserViewer (read-only)
    ├── ConnectionStatusOverlay (Reconnecting... / Session Ended)
    ├── FIFOCaptionStage (FIFO display, speaker colors)
    │   └── WordToken (colored block, ghost/interim, cursor)
    └── ViewerControls
        ├── FontSizeToggle (SM / MD / LG / XL)
        └── UserCountBadge
```

---

## 6. State Management & Data Model

### Week 1 — Session State

```typescript
interface SessionState {
  status: 'idle' | 'listening' | 'paused' | 'reconnecting' | 'ended';
  captions: CaptionLine[];
  currentInterim: string;
  sessionStartTime: number | null;
  connectionStatus: 'connected' | 'reconnecting' | 'lost';
  feedbackGiven: 'yes' | 'no' | null;
  stats: {
    wordCount: number;
    aiCorrections: number;
  };
}

interface CaptionLine {
  id: string;
  speakerId: number | null;    // null = single-speaker mode (Week 1)
  words: CaptionWord[];
  interim: string;             // in-progress text (shown lighter)
  isFinalized: boolean;
  gapFillerApplied: boolean;
  done: boolean;
}

interface CaptionWord {
  text: string;
  type: 'confirmed' | 'predicted' | 'uncertain';
  confidence: number;          // 0.0–1.0
  flagged: boolean;
}
```

> **Note:** `CaptionLine` is designed to work for both Week 1 (single speaker, gap filler colors) and Week 2 (multi-speaker FIFO). `speakerId` is `null` in Week 1 and `1–4` in Week 2. `words: CaptionWord[]` preserves the gap filler confidence data that the FIFO display also needs.

### Week 2 — FIFO Queue Logic

```javascript
const MAX_LINES = 6;

function pushLine(newLine, lines) {
  const updated = [...lines, newLine];
  return updated.length > MAX_LINES
    ? updated.slice(updated.length - MAX_LINES)
    : updated;
}

// Opacity fades by distance from bottom (newest = index lines.length - 1)
function getLineOpacity(index, totalLines) {
  const isNewest = index === totalLines - 1;
  if (isNewest) return 1.0;
  const age = totalLines - 1 - index;
  return Math.max(0.10, 0.65 - age * 0.13);
}
// Result: newest=1.0, -1=0.65, -2=0.52, -3=0.39, -4=0.26, -5=0.13
```

### State Management Approach

React Context with `useReducer`. No external state library needed for MVP.

---

## 7. Custom Hooks

| Hook | Owner | Week | Purpose |
|------|-------|------|---------|
| `useSpeechRecognition` | Luba | 1 | Wraps Web Speech API, start/stop/restart, interim + final results |
| `useAudioPipeline` | Luba | 1 | Manages getUserMedia, AudioContext, RNNoise AudioWorklet |
| `useGapFiller` | Luba | 1 | Sends finalized sentences to /api/gap-filler, returns corrected words + offline queue |
| `useConnectionStatus` | Luba | 1 | Monitors navigator.onLine, reconnection logic |
| `useWakeLock` | Luba | 1 | Prevents screen from dimming during active session |
| `useSessionTimer` | Luba | 1 | Tracks elapsed session time |
| `useDeepgram` | Luba | 2 | WebSocket connection to Deepgram, PCM streaming, diarization parsing |

---

## 8. API Design

### 8.1 POST /api/gap-filler (Week 1)

The only server-side endpoint in V1. Runs as a Vercel serverless function.

**Request:**
```typescript
{
  sentence: string;       // finalized sentence from STT
  context: string[];      // last 5 finalized sentences
  domain: 'education';    // vertical hint for Gemini
}
```

**Response:**
```typescript
{
  correctedSentence: string;
  words: Array<{
    text: string;
    type: 'confirmed' | 'predicted' | 'uncertain';
    confidence: number;   // 0.0–1.0
  }>;
}
```

**Gemini Prompt Template:**
```
You are a real-time caption correction system for a live lecture in an education setting.

Given a speech-to-text transcription that may contain errors, dropped words, or misheard terms:
1. Identify and fix likely transcription errors based on context
2. Fill in any obviously missing words
3. Assign a confidence score (0.0–1.0) to each word:
   - 1.0: Word was in original and is clearly correct
   - 0.7–0.9: Word was in original but might be wrong
   - 0.3–0.6: Word was predicted/filled by you

Return JSON only. No explanation.

Context (previous sentences):
{context}

Current sentence to correct:
{sentence}

Return format:
{"correctedSentence": "...", "words": [{"text": "...", "type": "confirmed|predicted|uncertain", "confidence": 0.0}]}
```

**Error Handling:**
- Timeout >3s → return original sentence, all words `confirmed`
- Rate limit 429 → return original, pause gap filler 60s
- Invalid JSON → retry once → return original
- Network error → return original, log error

### 8.2 Session Server WebSocket (Week 2)

**WebSocket Message Protocol:**
```javascript
// Operator → Server → Users (caption event)
{
  type: 'CAPTION',
  sessionId: 'abc123',
  speakerId: 2,             // 1–4
  words: ['that', 'is', 'so', 'interesting'],
  interim: 'to me',
  timestamp: 1741651200000
}

// Server → Users (lifecycle events)
{ type: 'SESSION_START', sessionId: 'abc123' }
{ type: 'SESSION_END',   sessionId: 'abc123' }
{ type: 'USER_COUNT',    sessionId: 'abc123', count: 7 }
```

**Session Server (Node.js):**
```javascript
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });
const sessions = new Map(); // sessionId → Set<WebSocket>

wss.on('connection', (ws, req) => {
  const sessionId = new URL(req.url, 'ws://localhost').searchParams.get('session');
  if (!sessions.has(sessionId)) sessions.set(sessionId, new Set());
  sessions.get(sessionId).add(ws);

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'CAPTION') {
      sessions.get(sessionId)?.forEach(client => {
        if (client !== ws && client.readyState === 1) client.send(data);
      });
    }
  });

  ws.on('close', () => {
    sessions.get(sessionId)?.delete(ws);
    broadcastUserCount(sessionId);
  });
});
```

---

## 9. Feature Specs

---

### WEEK 1 FEATURES

---

#### 9.1 Audio Capture (shared by all speech engines)

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000,
    channelCount: 1
  }
});
```

#### 9.2 Web Speech API Engine

```javascript
function buildRecognition(onFinal, onInterim, onEnd) {
  const r = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  r.continuous = true;
  r.interimResults = true;
  r.lang = 'en-US';
  r.maxAlternatives = 3;

  r.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i];
      const best = [...result].reduce((a, b) =>
        b.confidence > a.confidence ? b : a
      );
      if (result.isFinal) onFinal(best.transcript);
      else onInterim(best.transcript);
    }
  };

  // iOS Safari fires onend frequently — auto-restart
  r.onend = () => {
    if (isRunning) {
      setTimeout(() => { try { r.start(); } catch(e) {} }, 100);
    } else {
      onEnd();
    }
  };

  return r;
}
```

**iOS Safari quirks:**
- `webkitSpeechRecognition` fires `onend` after ~30s silence or ~60s continuous
- Must restart on `onend` to maintain continuous session
- Confidence scores may all return `0` — fall back to `result[0]`

#### 9.3 Gap Filler Offline Queue

```typescript
// In useGapFiller.ts
const queue = useRef<Array<{ lineId: string; sentence: string }>>([]);

async function sendToGapFiller(lineId: string, sentence: string) {
  if (!navigator.onLine) {
    queue.current.push({ lineId, sentence });
    return;
  }
  // ... fetch /api/gap-filler
}

function flushQueue() {
  const pending = [...queue.current];
  queue.current = [];
  pending.forEach(({ lineId, sentence }) => sendToGapFiller(lineId, sentence));
}
```

---

### WEEK 2 FEATURES

---

#### 9.4 Smart FIFO DOM Renderer

```javascript
function renderStage(lines, stage) {
  const existingIds = new Set(lines.map(l => l.id));

  // Remove stale nodes
  stage.querySelectorAll('.caption-line').forEach(el => {
    if (!existingIds.has(Number(el.dataset.lid))) el.remove();
  });

  // Update or create nodes
  lines.forEach((line, idx) => {
    let div = stage.querySelector(`.caption-line[data-lid="${line.id}"]`);
    if (!div) {
      div = document.createElement('div');
      div.dataset.lid = line.id;
      div.className = 'caption-line';
    }
    div.style.opacity = getLineOpacity(idx, lines.length);
    div.innerHTML = buildLineHTML(line);
    stage.appendChild(div); // re-append = bottom ordering
  });
}
```

**CSS Layout:**
```css
#stage {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}
.caption-line {
  animation: slideUp 0.2s ease;
  transition: opacity 0.5s ease;
  font-size: clamp(20px, 4.5vw, 42px);
}
```

**Word auto-break rule:** lines break when word count exceeds 8.

#### 9.5 Speaker Profiles

```typescript
const SPEAKERS = [
  { id: 1, name: 'Speaker 1', bg: '#1e3a5f', text: '#60a5fa' },
  { id: 2, name: 'Speaker 2', bg: '#1a3a2a', text: '#4ade80' },
  { id: 3, name: 'Speaker 3', bg: '#3a1a3a', text: '#c084fc' },
  { id: 4, name: 'Speaker 4', bg: '#3a2a1a', text: '#fb923c' },
];
```

#### 9.6 Deepgram WebSocket Engine

**Connection:**
```javascript
const DEEPGRAM_URL = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
  diarize: 'true',
  punctuate: 'true',
  interim_results: 'true',
  encoding: 'linear16',
  sample_rate: '16000',
  channels: '1',
  language: 'en-US'
});

const socket = new WebSocket(DEEPGRAM_URL, ['token', apiKey]);
```

**PCM Audio Streaming:**
```javascript
const processor = audioContext.createScriptProcessor(4096, 1, 1);
processor.onaudioprocess = (e) => {
  if (socket.readyState !== WebSocket.OPEN) return;
  const float32 = e.inputBuffer.getChannelData(0);
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
  }
  socket.send(int16.buffer);
};
```

**Diarization Parsing:**
```javascript
socket.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type !== 'Results') return;

  const words = data.channel.alternatives[0]?.words ?? [];
  let currentSpeaker = null, buffer = [];

  words.forEach(word => {
    if (word.speaker !== currentSpeaker) {
      if (buffer.length > 0) flushWords(buffer, currentSpeaker, data.is_final);
      currentSpeaker = word.speaker;
      buffer = [];
    }
    buffer.push(word.punctuated_word || word.word);
  });
  if (buffer.length > 0) flushWords(buffer, currentSpeaker, data.is_final);
};

function flushWords(words, deepgramSpeakerId, isFinal) {
  const speakerId = (deepgramSpeakerId % 4) + 1; // 0–3 → 1–4
  if (isFinal) pushFinalWords(words.join(' '), speakerId);
  else pushInterimWords(words.join(' '), speakerId);
}
```

**Reconnection:**
```javascript
let retryDelay = 1000;
socket.onclose = () => {
  if (!isRunning) return;
  showStatus('RECONNECTING...');
  setTimeout(() => {
    connectDeepgram();
    retryDelay = Math.min(retryDelay * 2, 4000);
  }, retryDelay);
};
socket.onopen = () => {
  retryDelay = 1000;
  showStatus('CONNECTED');
};
```

**Engine selection:**
```javascript
function startCaptionEngine() {
  const apiKey = localStorage.getItem('deepgram_api_key');
  if (apiKey) startDeepgram(apiKey);
  else startWebSpeech(); // shows "DEMO MODE" badge
}
```

#### 9.7 WakeLock

```javascript
let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch(e) {
    console.warn('WakeLock not available:', e);
  }
}

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && isSessionActive) {
    await requestWakeLock();
  }
});
```

#### 9.8 Font Size Controls (Viewer App)

```javascript
const SIZES = { sm: '20px', md: '32px', lg: '46px', xl: '58px' };

function setFontSize(size) {
  document.querySelectorAll('.word-token').forEach(el => {
    el.style.fontSize = SIZES[size];
  });
  localStorage.setItem('caption_font_size', size);
}
```

#### 9.9 QR Code Generation

```javascript
// Uses qrcode.js
function generateSessionQR(sessionId) {
  const url = `https://procaptions.app/s/${sessionId}`;
  new QRCode(document.getElementById('qr-container'), {
    text: url,
    width: 200,
    height: 200,
    colorDark: '#ffffff',
    colorLight: '#07090a',
  });
}
```

---

## 10. Data Flow

### Week 1 — Speech to Display

```
SPEECH → MIC → AUDIO PIPELINE → STT → DISPLAY → GAP FILLER → UPDATE

1. User speaks
2. getUserMedia() captures audio stream
3. AudioContext → RNNoise AudioWorklet (noise suppression)
4. Web Speech API processes audio
   ├── Interim result → Caption Display (gray/lighter text, ~100–300ms)
   └── Final result   → Caption Display (white text, ~500ms)
                      → Gap Filler Client (async, non-blocking)
                            → POST /api/gap-filler
                            → Gemini API (correction + confidence scores)
                            → Caption Display UPDATE
                              (replace finalized line with colored words, ~1–3s)
```

### Week 2 Addition — Operator to Viewer

```
Operator FIFO Display → WebSocket → Session Server → Broadcast → User Viewers
```

---

## 11. Deployment Strategy

### 11.1 Vercel (PWA — both weeks)

- Repository: GitHub `livecaptionspro`
- Framework: Next.js (auto-detected)
- Build command: `next build`
- Environment variables: `GEMINI_API_KEY` (server-side only)
- CI/CD: Auto-deploy on push to main, preview URLs on PRs

### 11.2 Session Server (Week 2)

- Host: Railway / Fly.io / Render (WebSocket-friendly)
- Runtime: Node.js
- Environment variables: none for V1 launch (no auth yet)
- Deploy on Day 9

### 11.3 GitHub Actions Workflow

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

### 11.4 Production Checklist — Week 1

- [ ] Vercel environment variables set (`GEMINI_API_KEY`)
- [ ] PWA manifest icons generated (192px, 512px)
- [ ] Service worker caching verified
- [ ] HTTPS confirmed (Vercel provides by default)
- [ ] Mobile testing on real iOS device (Safari)
- [ ] Mobile testing on real Android device (Chrome)
- [ ] Lighthouse PWA audit score > 90
- [ ] getUserMedia() permission flow tested on all target browsers

### 11.5 Production Checklist — Week 2

- [ ] Session server deployed and smoke tested
- [ ] WebSocket connection verified over WSS (TLS)
- [ ] QR code URL resolves correctly in production
- [ ] Viewer app tested with 3+ simultaneous users
- [ ] Deepgram API key settings panel tested end-to-end

---

## 12. Testing Strategy

### 12.1 Unit Tests (Vitest + React Testing Library)

**What to test:**
- Caption state reducer (all action types, edge cases)
- Word classification (confirmed/predicted/uncertain thresholds)
- Gap Filler response parser (valid JSON, malformed JSON, empty)
- FIFO queue logic (pushLine, getLineOpacity edge cases)
- Session timer formatting
- Connection status transitions
- All components (StartScreen, CaptionLine, ControlBar, SessionEndScreen, etc.)

**Example test cases:**
```typescript
// captionReducer.test.ts
describe('captionReducer', () => {
  it('adds interim text to current line');
  it('finalizes a line when STT returns final result');
  it('replaces finalized line with gap-filler corrections');
  it('increments aiCorrections count when gap filler changes words');
  it('handles empty interim results gracefully');
});

// gapFillerParser.test.ts
describe('parseGapFillerResponse', () => {
  it('parses valid Gemini response into CaptionWords');
  it('returns original sentence when response is malformed JSON');
  it('clamps confidence scores to 0–1 range');
  it('handles empty words array');
});

// fifoModel.test.ts (Week 2)
describe('pushLine', () => {
  it('adds a line to empty queue');
  it('trims from front when exceeding MAX_LINES');
  it('handles overflow by exactly 1');
  it('handles overflow by 3');
});
```

### 12.2 Integration Tests

**What to test:**
- `/api/gap-filler` endpoint: correct Gemini call, all error paths
- Audio pipeline initialization: getUserMedia mock → AudioContext → worklet
- Speech recognition hook: mock events → state updates
- `useGapFiller`: offline queue + flush behavior

```typescript
// route.integration.test.ts
describe('/api/gap-filler', () => {
  it('returns corrected sentence from Gemini');
  it('returns original sentence on timeout');
  it('returns original sentence on rate limit');
  it('returns original sentence on invalid JSON');
  it('returns 400 on missing sentence');
  it('falls back gracefully when API key is missing');
});
```

### 12.3 E2E Tests (Playwright)

```typescript
// e2e/session.spec.ts
test('complete caption session flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=START CAPTIONING');
  await expect(page.locator('[data-testid="listening-indicator"]')).toBeVisible();
  await expect(page.locator('[data-testid="caption-area"]')).toContainText('test phrase');
  await page.click('text=END SESSION');
  await expect(page.locator('text=SESSION ENDED')).toBeVisible();
});

// e2e/mobile.spec.ts
test.use({ viewport: { width: 375, height: 812 } }); // iPhone
test('all touch targets meet 44px minimum', async ({ page }) => {
  const startBtn = page.locator('text=START CAPTIONING');
  const box = await startBtn.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
});

// e2e/pwa.spec.ts
test('service worker registers and activates');
test('app shell loads from cache on repeat visit');

// e2e/viewer.spec.ts (Week 2)
test('operator generates QR code, user joins and sees captions');
test('viewer shows reconnecting overlay on WebSocket close');
test('SESSION_END event shows session ended screen');
```

### 12.4 Accessibility Testing

- `aria-live="polite"` on CaptionArea — screen readers announce new captions
- All buttons have `aria-label`
- Color contrast: WCAG AA minimum (4.5:1 body text, 3:1 large text)
- Predicted words: both color AND underline (not color alone)
- Lighthouse accessibility score target > 90
- Test with VoiceOver (iOS/Mac) and TalkBack (Android)

### 12.5 Real Device Testing

**iOS Safari (iPhone):** mic permission, caption display, session flow, PWA install, safe areas, tap-to-flag
**Android Chrome:** mic permission, caption display, PWA install prompt, wake lock
**iPad Safari:** landscape + portrait layout
**Real speech:** STT accuracy with sample lecture content, gap filler corrections, confidence highlighting

---

## 13. File / Folder Structure

```
livecaptionspro/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── audio-processor.js         # RNNoise AudioWorklet
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── splash/                    # iOS splash screens
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── s/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx       # User viewer app (Week 2)
│   │   └── api/
│   │       └── gap-filler/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── StartScreen.tsx + .test.tsx
│   │   ├── SessionScreen.tsx + .test.tsx
│   │   ├── SessionEndScreen.tsx + .test.tsx
│   │   ├── CaptionArea.tsx + .test.tsx
│   │   ├── CaptionLine.tsx + .test.tsx
│   │   ├── StatusBar.tsx + .test.tsx
│   │   ├── ControlBar.tsx + .test.tsx
│   │   ├── SettingsPanel.tsx      # Deepgram key (Week 2)
│   │   ├── ShareSessionModal.tsx  # QR code (Week 2)
│   │   └── UserViewer.tsx         # Read-only viewer (Week 2)
│   │
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts + .test.ts
│   │   ├── useAudioPipeline.ts + .test.ts
│   │   ├── useGapFiller.ts + .test.ts
│   │   ├── useConnectionStatus.ts + .test.ts
│   │   ├── useWakeLock.ts + .test.ts
│   │   ├── useSessionTimer.ts + .test.ts
│   │   └── useDeepgram.ts + .test.ts   # Week 2
│   │
│   ├── context/
│   │   ├── SessionContext.tsx
│   │   └── SessionContext.test.tsx
│   │
│   ├── lib/
│   │   ├── captionReducer.ts + .test.ts
│   │   ├── gapFillerParser.ts + .test.ts
│   │   ├── fifoModel.ts + .test.ts     # Week 2
│   │   ├── geminiPrompt.ts
│   │   └── constants.ts
│   │
│   └── types/
│       └── index.ts
│
├── server/                             # Week 2
│   ├── server.js                       # WebSocket session server
│   └── package.json
│
├── e2e/
│   ├── session.spec.ts
│   ├── mobile.spec.ts
│   ├── pwa.spec.ts
│   └── viewer.spec.ts                  # Week 2
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
└── package.json
```

---

## 14. Browser & Device Support Matrix

| Feature | iPhone Safari | iPad Safari | Chrome Desktop | Firefox |
|---------|:---:|:---:|:---:|:---:|
| Web Speech API | ✅ iOS 14.5+ | ✅ iOS 14.5+ | ✅ | ❌ |
| Deepgram WebSocket | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ✅ | ✅ | ⚠️ partial |
| WakeLock API | ✅ iOS 16.4+ | ✅ iOS 16.4+ | ✅ | ✅ |
| getUserMedia | ✅ | ✅ | ✅ | ✅ |
| RNNoise AudioWorklet | ✅ | ✅ | ✅ | ✅ |
| WebSocket | ✅ | ✅ | ✅ | ✅ |

---

## 15. Security Considerations

| Risk | Mitigation |
|------|------------|
| Gemini API key exposed | Server-side only in Vercel env vars — never in client bundle |
| Deepgram API key exposed | Stored in `localStorage`; consider backend proxy for production |
| Session ID guessable | `crypto.randomUUID()` — 128-bit random, not sequential |
| Audio data in transit | All WebSocket connections use `wss://` (TLS) |
| Unauthorized session join | Session links are unguessable UUIDs; optional PIN for sensitive events (future) |
| Screen recording of captions | Out of scope for V1 — watermarking in V2 |

---

## 16. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| iOS Safari kills recognition after 60s | High | High | Auto-restart on `onend` |
| Deepgram diarization misidentifies speaker | Medium | Medium | Allow manual speaker override tap |
| WebSocket drops on WiFi → LTE switch | Medium | High | Exponential backoff reconnect |
| RNNoise WASM breaks AudioWorklet | Medium | High | Keep pass-through as fallback |
| Week 2 scope bleeds into Week 1 | Medium | High | Hard stop: ship Week 1 regardless |
| Deepgram cost surprise for long sessions | Low | Medium | Show cost estimate in UI |
