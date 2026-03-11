# Contributing to Live Captions Pro

## File Ownership

Each person owns separate files to prevent merge conflicts.

| Owner | Files |
|-------|-------|
| **Michael** | `src/components/*`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `e2e/*`, `public/splash/`, `public/manifest.json` |
| **Luba** | `src/hooks/*`, `src/app/api/*`, `src/context/*`, `src/lib/*`, `public/sw.js`, `public/audio-processor.js`, `public/rnnoise*.{js,wasm}`, `.github/*` |
| **Shared** | `src/types/index.ts`, `package.json` — message each other before editing |

## Branch Naming

```
luba/day2-rnnoise
michael/day1-mic-prompt
luba/day3-gap-filler-tests
michael/day3-accessibility
```

## Sync Points

Four moments that require coordination before starting work:

| When | What | Action |
|------|------|--------|
| Day 1 start | Both touching `src/types/index.ts` | Luba commits types first, Michael adds `feedbackGiven` after |
| Day 3 start | Michael writing `SessionContext.test.tsx` | Michael pulls Luba's branch first |
| Day 4 start | Michael's E2E tests need Luba's features | Luba merges Days 1–3 PRs before Day 4 begins |
| Day 9 start | Michael's viewer app needs WebSocket schema | Agree on message format before Day 8 ends |

## Pull Request Checklist

Before opening a PR:
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (all existing tests still green)
- [ ] Changes are only in files you own (see table above)
- [ ] Shared file edits were coordinated with your teammate first

## Day-to-Day Workflow

```bash
# Start of each day — pull from main before starting
git pull origin main

# Create your branch
git checkout -b luba/day3-tests

# Run tests before committing
npm run test && npm run lint

# Small, focused PRs — merge quickly to avoid long-lived branches
```

## Week 1 vs. Week 2

**Week 1 (Days 1–5) = MVP.** Do not start Week 2 tasks until Day 5 is merged and deployed. The ship point is clearly marked in PLAN.md.

See PLAN.md for the full day-by-day task breakdown and TESTING.md for device testing requirements.
