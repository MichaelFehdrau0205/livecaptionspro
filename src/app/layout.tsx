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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <script src="/register-sw.js" defer />
      </head>
      <body className="bg-[#1a1a2e] text-white antialiased">{children}</body>
    </html>
  );
}
