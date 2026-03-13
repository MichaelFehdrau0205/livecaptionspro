# Real Device Testing — Completion Checklist

Use this to mark **Lighthouse** and **Real device testing** as complete (PLAN.md Day 5). Run on **production URL** after deploy when possible.

---

## 1. Lighthouse (complete when both ≥ 90)

- [ ] **Run Lighthouse** (see TESTING.md § Lighthouse Audit):
  - Local: `npm run dev` then `npm run lighthouse` → open `lighthouse-report.html`
  - Or Chrome DevTools → Lighthouse → Mobile, PWA + Accessibility
- [ ] **PWA score ≥ 90** (installable, service worker, manifest, theme-color)
- [ ] **Accessibility score ≥ 90** (labels, contrast, focus-visible, skip link)
- [ ] **Day 5:** Run again on production URL and confirm scores still ≥ 90

---

## 2. iPhone (Safari) — Michael

**Device:** Real iPhone (simulator does not test mic/STT). Use production URL in Safari.

- [ ] Mic permission pre-prompt shows; tap Allow
- [ ] AudioContext starts only after tap (no auto-start)
- [ ] STT auto-restart: stay silent 6+ s, then speak — captions resume
- [ ] PWA: Share → Add to Home Screen → launches standalone
- [ ] Standalone: status bar, splash, no browser chrome
- [ ] Caption area readable, auto-scrolls; safe area not under home indicator
- [ ] Tap-to-flag word works; session end shows stats
- [ ] Gap filler: blue/amber highlights visible on dark background

**Optional:** iPad Safari — portrait and landscape.

---

## 3. Android (Chrome) — Luba

**Device:** Real Android phone. Use production URL in Chrome.

- [ ] Mic permission flow; captions stream within ~1 s
- [ ] PWA: Add to Home Screen; standalone works
- [ ] Wake lock: screen does not dim during active session
- [ ] Reconnect: airplane mode on/off → banner, then STT resumes
- [ ] Gap filler: blue corrections appear after sentences

---

## 4. Final checks before launch

- [ ] Fix any UX bugs found (prioritize reading experience)
- [ ] Run full test suite: `npm test` and `npm run test:e2e` — all pass
- [ ] Final production deploy
- [ ] Update README.md: live URL, setup, GEMINI_API_KEY, browser compatibility

---

**Real device testing = complete** when both iPhone and Android checklists are done (and any critical bugs fixed). Lighthouse = complete when PWA and Accessibility are ≥ 90 on a production run.

Detailed steps and acceptance criteria: **TESTING.md** (iOS Safari checklist, Android Chrome checklist, Gap Filler verification).
