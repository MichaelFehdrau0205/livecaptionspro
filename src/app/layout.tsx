import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Live Captions Pro',
  description: 'Real-time captions with zero lost meaning — built for Deaf and hard-of-hearing users.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Live Captions Pro',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1a1a2e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1a1a2e" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* iOS splash screens — add PNGs to public/splash/ per README */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone-se.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone-8.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/iphone-14.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ipad.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
        />
      {process.env.NODE_ENV === 'production' && <script src="/register-sw.js" defer />}
      </head>
      <body className="bg-[#1a1a2e] text-white antialiased min-h-full" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {/* Fallback behind app (z-0): plain dark bg only — no text, so no duplicate "Live Captions Pro" */}
        <div
          id="app-loading-fallback"
          className="app-loading-fallback fixed inset-0 z-0 bg-[#0f0f1a]"
          aria-hidden="true"
        />
        <main id="main-content" className="min-h-full flex flex-col relative z-10">{children}</main>
        <script
          dangerouslySetInnerHTML={{
            __html: "if(typeof document!=='undefined'){setTimeout(function(){document.body.classList.add('app-mounted');},80);}",
          }}
        />
      </body>
    </html>
  );
}
