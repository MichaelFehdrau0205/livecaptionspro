'use client';

import { useEffect } from 'react';

/**
 * Adds app-mounted to body after hydration so server and client HTML match.
 * Hides the loading fallback via CSS (body.app-mounted .app-loading-fallback).
 */
export function AppMountEffect() {
  useEffect(() => {
    document.body?.classList.add('app-mounted');
  }, []);
  return null;
}
