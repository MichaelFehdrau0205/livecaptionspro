# Michael — First Work Plan (Day 1 Tasks)

**Context:** Luba has already completed **Day 1–3**. Use this as your Day 1 checklist when you start. Sync with Luba so you have the latest `main` (or `lubaPlan` branch) with her Days 1–3 work merged before you begin.

**Your ownership (from PLAN.md):**  
`src/components/*`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `e2e/*`, `public/splash/`, `public/manifest.json`

**Branch:** e.g. `michael/day1-mic-prompt`

---

## Sync before you start

- **Types:** Luba commits first to `src/types/index.ts`; then you add `feedbackGiven: 'yes' | 'no' | null` to `SessionState` (coordinate so you don’t conflict).
- **Pull:** `git pull origin main` (or pull Luba’s branch if her PRs aren’t merged yet).

---

## Your Day 1 tasks (from PLAN.md)

### 1. Mic permission pre-prompt (StartScreen.tsx)

- [ ] **Build a mic permission pre-prompt modal** before any `getUserMedia` call.
  - Copy to show: *"Live Captions Pro needs microphone access. Your audio is processed locally — no audio is sent to our servers."*
  - Button: **"Allow Microphone"** → on click call `startSession` (which triggers `getUserMedia`).
  - If user denies: show an error message and allow retry.
  - Optional: use `navigator.permissions` to detect already-granted permission and skip or adapt the pre-prompt.

### 2. Feedback buttons (SessionEndScreen.tsx)

- [ ] **Wire up the end-of-session feedback buttons.**
  - **YES** (e.g. “Did you miss anything?” → Yes): show *"Thanks for your feedback!"*, record in session stats.
  - **NO**: show *"Great!"*, record in session stats.
  - **State:** Add `feedbackGiven: 'yes' | 'no' | null` to `SessionState` in `src/types/index.ts` (after Luba’s type changes are in).

### 3. SessionEndScreen tests

- [ ] **Add `SessionEndScreen.test.tsx`.**
  - Renders session stats.
  - YES/NO buttons work and feedback flow (thanks message / state) is correct.

### 4. ControlBar tests

- [ ] **Add `ControlBar.test.tsx`.**
  - Mic indicator states.
  - End session button fires the correct handler.

---

## Done when

- Pre-prompt modal appears before the browser mic permission; Allow triggers `startSession`; denial is handled.
- SessionEndScreen YES/NO set `feedbackGiven` and show thanks/great messages.
- `SessionEndScreen.test.tsx` and `ControlBar.test.tsx` exist and pass with the above behavior.

---

## Reference

- **PLAN.md** — Full 2-week plan, sync points, risk register.
- **PRD2.md** — P0: mic pre-prompt, “Did you miss anything?” YES/NO.
- **TDD.md** — UI and state details.
- **CLAUDE.md** — Session state shape, reducer actions, file ownership.

---

**Note:** Luba completed Day 1–3 (STT reconnect, gap filler queue, domain param, RNNoise, service worker, hook tests, accessibility, SessionContext tests, API tests, etc.). Your Day 1 work fits on top of that; your next planned day in the full plan is **Day 2** (iOS splash, caption UX polish, CaptionArea + SessionScreen tests) then **Day 3** (accessibility audit, SessionContext.test.tsx), then **Day 4** (E2E suite).
