// Only register service worker in production — skipping on localhost prevents
// stale caches blocking dev iteration
if ('serviceWorker' in navigator &&
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed — non-critical
    });
  });
}
