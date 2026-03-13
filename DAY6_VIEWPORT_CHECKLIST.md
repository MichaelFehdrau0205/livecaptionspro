# Day 6 — FifoStage viewport checklist (Michael)

Use this to verify the FIFO stage layout and readability at target viewport widths (PLAN.md Day 6).

**No overlap with Luba:** This only uses `FifoStage`, `fifoModel`, and types. Luba’s Day 6 work (Deepgram settings, `useDeepgram.ts`) is separate. If you need to change shared types or constants, coordinate with Luba.

---

## 1. Open the demo

- Run: `npm run dev`
- In the browser go to: **http://localhost:3000/fifo-demo**
- You should see mock caption lines, bottom-anchored, with opacity decay and one line with interim text (“coming”).

---

## 2. Viewport checks

Use Chrome DevTools **Device Toolbar** (or resize the window) and confirm layout/readability at:

| Viewport        | Width | What to check |
|-----------------|-------|----------------|
| iPhone SE       | 375px | Lines readable, no horizontal scroll, bottom-anchored |
| iPhone 14 Pro   | 393px | Same |
| iPad            | 768px | Same; comfortable line length |
| iPad Pro        | 1024px | Same; max-width 720px keeps text from stretching too wide |

- [ ] iPhone SE (375px)
- [ ] iPhone 14 Pro (393px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)

**Quick checks:** Text doesn’t overflow; older lines are visibly fainter; newest line is full opacity; “Back to app” works.

---

## 3. Optional: real device

On a real iPhone or iPad, open `http://<your-local-ip>:3000/fifo-demo` (same WiFi as dev machine) and confirm the same.

---

When all boxes are checked, Day 6 viewport testing for FifoStage is done.
