# TDD — Live Captions Pro: Technical Design Document
**Product:** Live Captions Pro  
**Version:** 2.0  
**Author:** Luba & Michael  
**Date:** March 10, 2026  
**Status:** Draft

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        OPERATOR DEVICE                       │
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  Microphone │───▶│ Speech Engine│───▶│  FIFO Display │  │
│  │ (built-in)  │    │  V1: Web API │    │   (Canvas/DOM)│  │
│  └─────────────┘    │  V2: Deepgram│    └───────┬───────┘  │
│                     └──────────────┘            │           │
└─────────────────────────────────────────────────┼───────────┘
                                                  │ WebSocket
                                                  ▼
                                        ┌─────────────────┐
                                        │  Session Server  │
                                        │  (Node.js/WS)    │
                                        └────────┬────────┘
                                                 │ Broadcast
                              ┌──────────────────┼──────────────────┐
                              ▼                  ▼                  ▼
                     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                     │  User iPhone │  │  User iPhone │  │  User iPad   │
                     │  (PWA/Safari)│  │  (PWA/Safari)│  │  (PWA/Safari)│
                     └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 2. Feature 1 — Smart FIFO Caption Display

### 2.1 Data Model

```javascript
// A single caption line in the FIFO queue
{
  id: Number,          // Date.now() + Math.random() — unique per line
  speakerId: Number,   // 1–4 maps to speaker profile
  words: String[],     // Confirmed/final words
  interim: String,     // Unconfirmed in-progress text
  done: Boolean        // true = speaker finished this line
}
```

### 2.2 FIFO Queue Logic

```javascript
const MAX_LINES = 6;

function pushLine(newLine, lines) {
  const updated = [...lines, newLine];
  // FIFO: trim from front when over limit
  return updated.length > MAX_LINES
    ? updated.slice(updated.length - MAX_LINES)
    : updated;
}
```

### 2.3 Opacity Calculation

Lines fade based on their distance from the bottom (newest = index `lines.length - 1`):

```javascript
function getLineOpacity(index, totalLines, isDone) {
  const isNewest = index === totalLines - 1;
  if (isNewest) return 1.0;
  const age = totalLines - 1 - index;
  return Math.max(0.10, 0.65 - age * 0.13);
}
// Result: newest=1.0, -1=0.65, -2=0.52, -3=0.39, -4=0.26, -5=0.13
```

### 2.4 DOM Rendering Strategy

Rather than re-rendering the full list on every word, the FIFO renderer:
1. Diffs current `lines[]` state against existing DOM nodes by `data-lid`
2. Removes DOM nodes for lines no longer in state
3. Updates innerHTML only for lines that changed (active line)
4. Re-appends all nodes in order to maintain bottom-anchored layout

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

### 2.5 Word Auto-Break Rule

Lines automatically break when word count exceeds 8 to preserve readability on narrow screens:

```javascript
// On each final transcript result:
if (existingLine.words.length + newWords.length > 8) {
  currentLineId = null; // triggers new line on next word
}
```

### 2.6 CSS Layout

```css
#stage {
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* anchors content to bottom */
  overflow: hidden;           /* hides lines that exceed container */
}
.caption-line {
  animation: slideUp 0.2s ease;
  transition: opacity 0.5s ease;
}
```

---

## 3. Feature 2 — Dual-Mode Speech Recognition Engine

### 3.1 Audio Capture (Shared by both versions)

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,   // removes room echo
    noiseSuppression: true,   // filters background noise
    autoGainControl: true,    // boosts gain for distant voices (6–8 ft)
    sampleRate: 16000,        // optimal for speech; reduces bandwidth
    channelCount: 1           // mono — no stereo needed for speech
  }
});
```

### 3.2 Version 1 — Web Speech API

#### Recognition Setup

```javascript
function buildRecognition(speakerId, onFinal, onInterim, onEnd) {
  const r = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  r.continuous = true;
  r.interimResults = true;
  r.lang = 'en-US';
  r.maxAlternatives = 3; // improves accuracy at distance

  r.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i];
      // Pick best alternative by confidence
      const best = [...result].reduce((a, b) =>
        b.confidence > a.confidence ? b : a
      );
      if (result.isFinal) onFinal(best.transcript, speakerId);
      else onInterim(best.transcript);
    }
  };

  // iOS Safari fires onend frequently — auto-restart
  r.onend = () => {
    if (isRunning) {
      currentLineId = null; // new utterance = new line
      setTimeout(() => { try { r.start(); } catch(e) {} }, 100);
    } else {
      onEnd();
    }
  };

  return r;
}
```

#### Speaker Switching

```javascript
function switchSpeaker(newSpeakerId) {
  if (newSpeakerId === activeSpeakerId) return;
  activeSpeakerId = newSpeakerId;
  currentLineId = null; // force new caption line for new speaker
}
```

#### iOS Safari Quirks
- `webkitSpeechRecognition` fires `onend` after ~30s of silence or ~60s of continuous speech
- Must listen for `onend` and restart immediately to maintain continuous session
- `maxAlternatives` is honored in Safari but confidence scores may all return `0` — fall back to `[0]` transcript

### 3.3 Version 2 — Deepgram WebSocket

#### Connection Setup

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

#### Audio Streaming

```javascript
// ScriptProcessorNode captures raw PCM and sends over WebSocket
const audioContext = new AudioContext({ sampleRate: 16000 });
const source = audioContext.createMediaStreamSource(stream);
const processor = audioContext.createScriptProcessor(4096, 1, 1);

processor.onaudioprocess = (e) => {
  if (socket.readyState !== WebSocket.OPEN) return;
  const float32 = e.inputBuffer.getChannelData(0);
  // Convert Float32 to Int16 (linear16)
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
  }
  socket.send(int16.buffer);
};

source.connect(processor);
processor.connect(audioContext.destination);
```

#### Handling Deepgram Response

```javascript
socket.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type !== 'Results') return;

  const channel = data.channel;
  const isFinal = data.is_final;
  const words = channel.alternatives[0]?.words ?? [];

  // Group words by speaker
  let currentSpeaker = null;
  let buffer = [];

  words.forEach(word => {
    if (word.speaker !== currentSpeaker) {
      if (buffer.length > 0) flushWords(buffer, currentSpeaker, isFinal);
      currentSpeaker = word.speaker;  // 0–3 maps to speaker profiles
      buffer = [];
    }
    buffer.push(word.punctuated_word || word.word);
  });

  if (buffer.length > 0) flushWords(buffer, currentSpeaker, isFinal);
};

function flushWords(words, deepgramSpeakerId, isFinal) {
  // Map Deepgram speaker 0–3 → Pro Captions speaker 1–4
  const speakerId = (deepgramSpeakerId % 4) + 1;
  if (isFinal) pushFinalWords(words.join(' '), speakerId);
  else pushInterimWords(words.join(' '), speakerId);
}
```

#### Reconnection Strategy

```javascript
let retryDelay = 1000;
const MAX_RETRY = 4000;

socket.onclose = (e) => {
  if (!isRunning) return;
  showStatus('RECONNECTING...');
  setTimeout(() => {
    connectDeepgram(); // rebuild socket
    retryDelay = Math.min(retryDelay * 2, MAX_RETRY); // exponential backoff
  }, retryDelay);
};

socket.onopen = () => {
  retryDelay = 1000; // reset on success
  showStatus('CONNECTED');
};
```

### 3.4 Mode Selection Logic

```javascript
// On session start — choose engine based on API key presence
function startCaptionEngine() {
  const apiKey = localStorage.getItem('deepgram_api_key');
  if (apiKey) {
    startDeepgram(apiKey);
  } else {
    startWebSpeech();
  }
}
```

---

## 4. Feature 3 — Standalone Mobile PWA for End Users

### 4.1 PWA Configuration

**manifest.json**
```json
{
  "name": "Pro Captions",
  "short_name": "ProCaps",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#07090a",
  "theme_color": "#07090a",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Required HTML meta tags for iOS**
```html
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="Pro Captions"/>
<link rel="apple-touch-icon" href="/icons/icon-192.png"/>
```

### 4.2 Session Architecture

```
Operator creates session
        │
        ▼
POST /api/sessions → { sessionId: "abc123", wsUrl: "wss://..." }
        │
        ▼
Operator shares: https://procaptions.app/s/abc123
        │
   QR code or link
        │
   ┌────┴────────────────┐
   ▼                     ▼
User A joins          User B joins
ws://...?session=abc123
        │
        ▼
Server broadcasts caption events to all subscribers
```

### 4.3 Caption Event Protocol

All messages over the WebSocket follow this schema:

```javascript
// Operator → Server → Users
{
  type: 'CAPTION',
  sessionId: 'abc123',
  speakerId: 2,           // 1–4
  words: ['that', 'is', 'so', 'interesting'],
  interim: 'to me',
  timestamp: 1741651200000
}

// Server → User: session lifecycle
{ type: 'SESSION_START', sessionId: 'abc123' }
{ type: 'SESSION_END',   sessionId: 'abc123' }
{ type: 'USER_COUNT',    sessionId: 'abc123', count: 7 }
```

### 4.4 Server Design (Node.js)

```javascript
// server.js — lightweight WebSocket session server
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });

const sessions = new Map(); // sessionId → Set of client sockets

wss.on('connection', (ws, req) => {
  const sessionId = new URL(req.url, 'ws://localhost').searchParams.get('session');
  if (!sessions.has(sessionId)) sessions.set(sessionId, new Set());
  sessions.get(sessionId).add(ws);

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'CAPTION') {
      // Broadcast to all other clients in the session
      sessions.get(sessionId)?.forEach(client => {
        if (client !== ws && client.readyState === 1) {
          client.send(data);
        }
      });
    }
  });

  ws.on('close', () => {
    sessions.get(sessionId)?.delete(ws);
    broadcastUserCount(sessionId);
  });
});
```

### 4.5 WakeLock Implementation

```javascript
// Prevents screen sleep while captions are active
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

// Re-request on page visibility change (iOS releases on background)
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && isSessionActive) {
    await requestWakeLock();
  }
});
```

### 4.6 Font Size Controls

```javascript
const SIZES = { sm: '20px', md: '32px', lg: '46px', xl: '58px' };
let currentSize = 'md';

function setFontSize(size) {
  currentSize = size;
  document.querySelectorAll('.word-token').forEach(el => {
    el.style.fontSize = SIZES[size];
  });
  localStorage.setItem('caption_font_size', size);
}
```

### 4.7 QR Code Generation

```javascript
// Uses qrcode.js (CDN, no install)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js">

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

## 5. Browser & Device Support Matrix

| Feature | iPhone Safari | iPad Safari | Chrome Desktop | Firefox |
|---------|:---:|:---:|:---:|:---:|
| Web Speech API | ✅ iOS 14.5+ | ✅ iOS 14.5+ | ✅ | ❌ |
| Deepgram WebSocket | ✅ | ✅ | ✅ | ✅ |
| PWA Install (Home Screen) | ✅ | ✅ | ✅ | ⚠️ partial |
| WakeLock API | ✅ iOS 16.4+ | ✅ iOS 16.4+ | ✅ | ✅ |
| getUserMedia | ✅ | ✅ | ✅ | ✅ |
| WebSocket | ✅ | ✅ | ✅ | ✅ |

---

## 6. Security Considerations

| Risk | Mitigation |
|------|------------|
| Deepgram API key exposed in client | Store in `localStorage`; never commit to source. Consider a backend proxy for production |
| Session ID guessable | Generate as `crypto.randomUUID()` — 128-bit random, not sequential |
| Audio data in transit | All WebSocket connections use `wss://` (TLS) |
| Unauthorized session join | Session links are unguessable UUIDs; add optional PIN for sensitive events |
| Screen recording of captions | Out of scope for V1 — add watermarking in V2 |
