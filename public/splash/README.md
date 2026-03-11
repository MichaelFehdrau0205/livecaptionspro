# iOS Splash Screens

Add PNG images for PWA “Add to Home Screen” splash on iOS. Use solid background `#1a1a2e` and optional “Live Captions Pro” branding.

| Device        | Size (px)   | Filename (optional) |
|---------------|-------------|---------------------|
| iPhone SE     | 640 × 1136  | iphone-se.png       |
| iPhone 8/SE 2 | 750 × 1334  | iphone-8.png        |
| iPhone 14/15  | 1170 × 2532 | iphone-14.png       |
| iPad          | 1536 × 2048 | ipad.png            |

Layout references these in `src/app/layout.tsx` via `<link rel="apple-touch-startup-image">`. You can use a single image (e.g. `default.png` 1284×2778) and reference it for all, or one per size for best fit.
