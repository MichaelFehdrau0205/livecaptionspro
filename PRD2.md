[Live Captions Pro] PRD v2

Project: Live Captions Pro
Owner: Luba Kaper and Michael Fehdrau
Date: Sunday, March 08, 2026
Updated: Sunday, March 09, 2026

Problem
Live Captions exist — but they fail people at the worst moments. Words get dropped, technical terms get mangled, and there is no way to recover what was missed. For Deaf and hard of hearing users, this is not just frustrating — it means exclusion from critical conversations in healthcare, education, legal settings, and the workplace.

Current solutions from Google, Microsoft, and Apple all share the same core flaw: they show you what the AI heard — not what was actually said.


Supporting Context (Data Points & Research)
About 48 million Americans — roughly 15% of the adult population — report some degree of hearing loss, and approximately 2 million people in the United States are considered functionally Deaf. Hearview
More than 90% of Deaf children are born to hearing parents NIDCD — meaning most Deaf individuals grow up navigating a hearing world without built-in support systems.
Deaf and hard of hearing individuals face significant obstacles in accessing education and employment opportunities, and Deaf children in the U.S. are less likely to graduate from high school than their hearing peers. The Treetop ABA
Even the most advanced automated speech recognition systems struggle with accents, technical jargon, poor audio quality, and overlapping speakers — often achieving accuracies only between 80–90%. 24marketreports
Around 65% of businesses now adopt live captioning to improve communication Global Growth Insights — yet none of the dominant tools are built specifically for high-stakes Deaf users.
Google, Apple, and Microsoft all offer general-purpose captioning — but none own a specific vertical like healthcare, legal, or education where zero lost meaning is a necessity, not a preference.


Competitive Landscape

| Feature | Google Live Caption | Apple Live Captions | Microsoft Teams | Live Captions Pro |
|---------|-------------------|--------------------|-----------------|-----------------------|
| Real-time STT | Yes | Yes | Yes | Yes |
| Gap Filler (AI-predicted missed words) | No | No | No | Yes — core differentiator |
| Confidence Highlighting | No | No | No | Yes — visual trust layer |
| Domain-specific vocabulary | No | Limited | Limited | Yes — vertical-focused |
| Works offline | Yes (on-device) | Yes (on-device) | No | No (v1) |
| Built for Deaf users | No — general purpose | No — general purpose | No — general purpose | Yes — purpose-built |
| Open/free to use | Yes | Yes (Apple only) | Paid (Teams license) | Yes (MVP) |


The Opportunity
Live captioning technology exists — but no one has built it for a specific high-stakes environment. Google, Apple, and Microsoft all offer general-purpose solutions that prioritize accuracy scores over actual comprehension. The opportunity is to build the first captioning product designed around zero lost meaning — owning a vertical like healthcare, legal, or education where getting every word right isn't a nice-to-have, it's a necessity.


Market Opportunity
The global live captioning software market reached USD 1.42 billion in 2024 and is projected to grow at a CAGR of 13.1% from 2025 to 2033, reaching an estimated value of USD 4.10 billion. Growthmarketreports
North America accounts for approximately 41% of global revenue — driven by federal accessibility laws such as the ADA and Section 508, which mandate real-time captioning for public communications. Growthmarketreports
By 2050, it is estimated that over 900 million people — or one in every ten individuals — will have disabling hearing loss globally. Total Care ABA
No single player currently owns the high-stakes vertical captioning space — healthcare, legal, and education all represent underserved markets where accuracy is legally and medically required.
Live Captions Pro's opportunity is to capture the vertical-specific segment of this growing market by being the first product built around zero lost meaning — not just higher accuracy scores.


Users & Needs
Who:
Primary Users: Deaf and hard of hearing individuals — including college students, professionals, and everyday users who rely on captions to access conversations in real time.
Secondary Users: Hearing individuals who speak into the microphone — doctors, professors, lawyers, colleagues — whose speech is being transcribed for the primary user.


Needs:
Primary User — Deaf User
As a Deaf college student, I need to capture every word spoken in a fast-paced lecture because missing even one critical concept can affect my understanding, my grades, and my ability to keep up with my peers.
As a Deaf employee, I need real-time captions during live meetings in order to contribute to discussions, stay informed, and be treated as an equal member of my team.
Secondary User — Hearing Speaker
As a professor lecturing to a Deaf student, I need my speech to be transcribed clearly and completely in order to deliver an equal learning experience without changing the way I teach.
As a manager running a team meeting, I need my words and my colleagues' responses to be accurately captioned in real time in order to ensure my Deaf employee has full access to every decision, discussion, and direction being communicated.


Proposed Solution
Live Captions Pro is a live captioning platform that combines real-time speech-to-text with an AI layer that fills gaps, flags uncertainty, and delivers the full meaning of every conversation. It is built as a Progressive Web App (PWA) that works on both mobile and desktop browsers with zero installation.


Top 3 MVP Value Props:
[The Vitamin] - Seeing every word fully and completely so the brain can process the message without any gaps. When there's a gap, the mind gets lost and the meaning breaks down.
[The Painkiller] - The pain of dropped words and long silences — waiting for the next word to appear, losing the thread of the conversation because the soundwave didn't reach the microphone clearly enough.
[The Steroid] - A supercharged audio layer that captures soundwaves more powerfully and delivers them straight to live captions within one second — no delay, no drop, no gap.


Goals & Non-Goals
Goals:
Deliver real-time live captions with zero lost meaning for Deaf and hard of hearing users
Build a purpose-built captioning product for one high-stakes vertical — education (chosen for MVP due to testability and access)
Achieve 97%+ caption accuracy that outperforms Google, Apple, and Microsoft
Give users confidence in every caption through Gap Filler and Confidence Highlighting
Ensure no word, meaning, or moment is lost between what was said and what was understood

Non-Goals:
We are NOT building a general-purpose captioning tool for everyone — this is vertical-specific
We are NOT building hardware in this version — Live Captions Pro is a software-first product
We are NOT supporting every language in the MVP — English first, expansion later
We are NOT building a full transcription storage or document export system in v1
We are NOT replacing ASL interpreters — Live Captions Pro is a complement, not a substitute
We are NOT targeting hearing users as the primary audience in this version
We are NOT building offline support in v1 — the AI layer requires internet connectivity
We are NOT building user accounts or authentication in v1 — the MVP is an open tool


Technical Architecture (NEW)

Platform: Progressive Web App (PWA)
Why PWA: Works on iOS Safari, Android Chrome, and desktop browsers. No app store approval needed. One codebase for all platforms. Installable to home screen. Fastest path to mobile for a 1-week build.

Tech Stack (all free):
- Frontend: Next.js (React) deployed on Vercel free tier
- Speech-to-Text: Web Speech API (browser built-in, free, zero API keys)
- AI Gap Filler: Google Gemini API free tier (Gemini 2.5 Flash — 250 requests/day, no credit card)
- Audio Processing: Web Audio API + RNNoise WASM for noise suppression
- Hosting: Vercel free tier (100GB bandwidth, serverless functions included)
- Backend/Database: None in v1 (stateless — all processing happens per-session)

Upgrade Path (post-MVP):
- STT: Deepgram ($200 free credit, WebSocket streaming, higher accuracy)
- Database: Supabase free tier for session history and user accounts
- AI: Claude API or OpenAI for more sophisticated gap filling


Latency Budget (NEW)

Target: Under 1 second from speech to displayed caption.

| Stage | Budget | Method |
|-------|--------|--------|
| Audio capture | ~10ms | Web Audio API / getUserMedia() |
| Noise filtering | ~20ms | RNNoise WASM via AudioWorklet |
| Speech-to-Text | ~300-500ms | Web Speech API (interim results) |
| Caption rendering | ~10ms | React state update |
| **Total (live captions)** | **~340-540ms** | **Well under 1 second** |

Gap Filler runs asynchronously — it does NOT block live caption display. Captions appear immediately from STT; gap-filled corrections are applied after a 3-5 second delay on the sentence that just completed.


Gap Filler — How It Works (NEW)

The Gap Filler is the core differentiator. It works as a post-processing layer, not inline with live captions:

1. Web Speech API streams interim results word-by-word to the screen (P0 — live captions)
2. When a sentence or phrase is finalized by the STT engine, the completed text is sent to the Gemini API
3. Gemini receives the raw transcript + conversation context (last 5 sentences) and is prompted to:
   a. Identify likely dropped or misheard words based on grammar, context, and domain vocabulary
   b. Assign a confidence score (high/medium/low) to each word
   c. Return corrected text with annotations
4. The UI updates the finalized sentence with corrections:
   - High confidence words: displayed normally (default color)
   - Medium confidence words: displayed in a distinct highlight color (Confidence Highlighting)
   - AI-predicted/filled words: displayed in a second distinct style (e.g., underline + highlight)
5. User sees live captions streaming in real time, then sees subtle corrections applied to completed sentences

Confidence Thresholds:
- High (>90%): Word displayed as-is
- Medium (70-90%): Word highlighted for user awareness
- Low (<70%): Word marked as uncertain, original STT output preserved with flag

Rate Limiting Strategy:
- Gemini free tier allows 250 requests/day at 10 requests/minute
- Batch processing: send one request per completed sentence (not per word)
- Average session of 30 minutes ≈ 200 sentences ≈ 200 API calls — within daily limit for 1 session/day
- For MVP demo purposes, this is sufficient


Audio Capture & Noise Handling (NEW)

Audio Pipeline:
1. getUserMedia() requests microphone access (works on iOS Safari 14.5+, Android Chrome, desktop browsers)
2. Audio stream routed through Web Audio API AudioContext
3. RNNoise WASM processes audio in an AudioWorklet for real-time noise suppression (~20ms latency)
4. Cleaned audio fed to Web Speech API SpeechRecognition for transcription

Known Limitations:
- iOS Safari: SpeechRecognition may stop after periods of silence; requires restart logic
- iOS Safari: getUserMedia() works but has quirks with AudioContext (must be resumed on user gesture)
- Web Speech API sends audio to cloud (Google/Apple servers) — not on-device
- Background tab behavior varies by OS — PWA "installed" mode helps on mobile

Mitigation for iOS issues:
- Auto-restart recognition on silence timeout
- Start AudioContext on first tap interaction
- Show clear "listening" / "paused" status indicator


Connectivity & Error Handling (NEW)

Internet is required for both Web Speech API and Gemini API.

When connectivity drops mid-session:
- Live captions pause with a visible "Connection lost — reconnecting..." banner
- App attempts reconnection every 2 seconds
- When connection restores, recognition restarts automatically
- Gap Filler queues unsent sentences and processes them on reconnection
- No audio is lost during brief drops (<5 seconds) because the browser buffers mic input

When Gemini API rate limit is hit:
- Gap Filler gracefully degrades — raw STT captions continue without AI corrections
- UI shows subtle indicator: "AI enhancement paused"
- Captions remain fully functional, just without gap-filling


Success Metrics

Goal                            Signal                          Metric                      Target
Accuracy                        Captions capture every          Caption accuracy rate        97%+
                                word correctly

Gap Filler Performance          AI correctly predicts           Gap Filler success rate      90%+
                                missed words

Speed                           Captions appear immediately     Caption latency              Under 1 second
                                after speech

User Trust                      Users trust what they see       Confidence Highlight         Users report
                                without second-guessing         usefulness                   captions are
                                                                                             trustworthy

Session Quality                 Users stay through              Average session length       10+ minutes
                                full conversations

Comprehension                   Users understood the full       Post-session survey score    85%+ positive
                                conversation

Inclusion                       Users felt fully included       Post-session qualitative     85%+ positive
                                in the conversation             feedback

Zero Lost Meaning               Users missed nothing            End-of-session "Did you      Trending toward
                                important                       miss anything?"              0%


Requirements

Requirements are organized/prioritized by critical user journeys. For the 1-week MVP, only P0 items are in scope.

Legend
[P0] = MVP Week 1 — Live Captions, Gap Filler, Confidence Highlight
[P1] = Post-MVP — Live Summary, Speaker ID, Session History
[P2] = Future — 3-Second Replay, Export, Customization


User Journey 1: Deaf User Starting a Live Caption Session

Context: This is the most critical journey. A Deaf user needs to start capturing speech immediately with zero friction — every second of delay is a word lost. We are optimizing for speed, trust, and zero setup burden.

Starting a Session:
[P0] User can launch a live caption session in one tap
[P0] User can see captions streaming word-by-word in real time with under 1 second latency
[P0] User can identify which words are uncertain through Confidence Highlighting
Uncertain words appear in a distinct color so the user knows to pay closer attention
[P1] User can see a live summary line below the main captions capturing the full meaning of the conversation
[P2] User can adjust caption text size, color, and display speed before or during a session

During a Session:
[P0] User can read fully gap-filled captions where missed words are predicted by AI using surrounding context
Gap Filler activates automatically — no action required from user
[P0] User can visually distinguish between confirmed words and AI-predicted words
[P0] User sees a clear "Listening..." indicator confirming the app is actively capturing audio
[P0] User sees a "Connection lost" warning if internet drops, and captions auto-resume on reconnection
[P1] User can see speaker labels identifying who is talking in a multi-person conversation
Labeled as Speaker 1, Speaker 2, or by name if identified
[P2] User can tap any word to trigger a 3-Second Replay of that moment of audio
Replay is silent to others in the room — private to the user only

Ending a Session:
[P0] User can end a session in one tap
[P1] User can review a full transcript of the session immediately after it ends
[P1] User can submit feedback on caption accuracy after each session
Includes a simple "Did you miss anything important?" prompt
[P2] User can save or export the session transcript


User Journey 2: Hearing Secondary User Speaking into Live Captions Pro

Context: The hearing speaker — doctor, professor, manager — is a secondary user whose behavior directly affects caption quality. They need to speak naturally without changing their rhythm or workflow. We are optimizing for zero friction on their end.

Before Speaking:
[P0] Hearing user can activate microphone input with one tap
[P0] Hearing user receives a clear visual confirmation that Live Captions Pro is actively listening
[P1] Hearing user can select their role — doctor, professor, manager — to activate vertical-specific vocabulary optimization

During Speaking:
[P0] Hearing user can speak naturally without slowing down or repeating themselves
[P0] System captures speech clearly even in noisy environments using RNNoise AI noise filtering
[P1] Hearing user can see a basic confirmation that their words are being captured and streamed
[P2] Hearing user can pause the microphone temporarily without ending the session


User Journey 3: Using Live Captions Pro in a High-Stakes Vertical

Context: For the MVP, we are targeting the education vertical. A Deaf college student in a lecture hall is our primary scenario. Healthcare, legal, and workplace verticals are future expansion targets.

Vertical-Specific Accuracy (Education):
[P0] System recognizes and correctly captions common academic terminology (course-specific jargon, proper nouns, acronyms)
This is achieved through Gemini API context prompting with "education/lecture" domain hints — not a custom dictionary in v1
[P0] User can flag a misheard word by tapping it to trigger a re-evaluation by Gap Filler
[P1] System learns from flagged corrections over time to improve accuracy for that user
[P2] Admin or institution can configure a custom vocabulary list for their environment

Access:
[P0] User can access Live Captions Pro from a mobile device (iOS Safari, Android Chrome) or desktop browser
[P0] User can install the PWA to their home screen for app-like experience with one tap
[P0] No account creation required — open the URL and start captioning
[P1] User can create an account to save session history
[P2] Users can invite a hearing speaker to join a shared session remotely


MVP Scope — 1 Week, 2 People (NEW)

What's in (P0 only):
- PWA shell with responsive mobile-first UI
- One-tap session start/stop
- Real-time captions via Web Speech API
- RNNoise noise suppression
- Gap Filler via Gemini API (async post-processing on completed sentences)
- Confidence Highlighting (color-coded word certainty)
- Visual distinction between confirmed and AI-predicted words
- Connection status indicator (listening/paused/disconnected)
- Auto-reconnect on connection drop
- Tap-to-flag misheard word
- Installable PWA (manifest + service worker)

What's out (P1/P2 — post-MVP):
- User accounts and authentication
- Session history and transcript storage
- Speaker identification / diarization
- Live summary
- 3-Second Replay
- Text size/color customization
- Export/save transcripts
- Custom vocabulary lists
- Multi-user shared sessions
- Offline support
- Non-English languages

Suggested Work Split:
- Person A: PWA setup, UI/UX, caption display, session flow, PWA manifest/service worker
- Person B: Audio pipeline (Web Audio API + RNNoise), Web Speech API integration, Gemini API gap filler, connection handling


Appendix
Designs:
Meeting notes:
Other resources:
- Web Speech API docs: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- RNNoise: https://jmvalin.ca/demo/rnnoise/
- Gemini API: https://ai.google.dev/
- Next.js PWA guide: https://nextjs.org/docs
- Vercel deployment: https://vercel.com
