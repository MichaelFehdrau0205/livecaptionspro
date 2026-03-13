# Day 4 — E2E + Deployment

## Status

| Owner   | Task                    | Status |
|---------|-------------------------|--------|
| Michael | E2E suite expansion      | Done (session, mobile, pwa specs + mic pre-prompt) |
| Luba    | Vercel deploy + CI      | **Done** (PR #14 `lubaDay4` merged, production Ready) |

---

## Deployment status (fill in when Luba has deployed)

| Item | Value |
|------|--------|
| **Production URL** | *(get from Vercel project → Domains; e.g. https://livecaptionspro.vercel.app)* |
| **Last verified** | *(e.g. 2026-03-12 — Luba deployed 23h ago)* |

When the row above is filled in, Day 4 deploy is done. Use that URL for Day 5 (REAL_DEVICE_TESTING.md).

---

## How to notice Luba has done Day 4

You don’t have Vercel or GitHub visibility from the repo alone, so use one or more of these:

1. **Deployment status above**  
   Ask Luba (or whoever deploys) to add the **Production URL** and **Last verified** date in the table above. Then you have one place to look and can open the URL to confirm the app loads.

2. **README**  
   If the README gets a “Live app” or “Production” link (often done on Day 5), that’s another sign deploy happened.

3. **GitHub (if you have access)**  
   - **Actions:** Open the repo → **Actions**. Recent runs for push/PR should show green (lint, unit tests, E2E).  
   - **PRs:** Open a recent PR; Vercel often comments with a preview URL and “Deployment ready”.

4. **Ask Luba**  
   Quick standup/chat: “Is the app deployed to Vercel and is CI green? Can you drop the production URL into DAY4.md?”

## Michael — Done

- [x] `e2e/session.spec.ts` — happy path, connection lost, timer, tap-to-flag
- [x] `e2e/mobile.spec.ts` — viewport, touch targets, ControlBar, safe area
- [x] `e2e/pwa.spec.ts` — manifest, service worker, cache
- [x] Mic pre-prompt covered in E2E

Build and tests: `npm run build`, `npm test`, `npm run test:e2e` (dev server on 3000).

---

## Luba — Deployment steps

1. **Deploy to Vercel**
   - Connect GitHub repo to Vercel.
   - In Vercel: Settings → Environment Variables → add `GEMINI_API_KEY` (production + preview).
   - Trigger deploy; confirm build succeeds.

2. **Test production**
   - Open production URL.
   - Check `/api/gap-filler` with real Gemini (e.g. run a short caption session).
   - Confirm PWA install and service worker caching.

3. **Preview + CI**
   - Push a PR branch; confirm Vercel preview URL works.
   - Confirm GitHub Actions runs: lint, unit tests, E2E (see `.github/workflows/ci.yml`).

---

## Ready for deploy

- [x] `npm run build` succeeds
- [x] CI workflow exists (lint, test, test:e2e)
- [ ] Repo connected to Vercel (Luba)
- [ ] `GEMINI_API_KEY` set in Vercel (Luba)

After deploy, use production URL for Day 5 real device testing (see REAL_DEVICE_TESTING.md).
