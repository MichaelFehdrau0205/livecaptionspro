import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

test.describe('PWA', () => {
  test('PWA manifest is detected and valid', async ({ page, baseURL }) => {
    await gotoApp(page);
    const manifestHref = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? (link as HTMLLinkElement).href : null;
    });
    expect(manifestHref).toBeTruthy();
    expect(manifestHref).toContain('manifest.json');

    const base = baseURL ?? page.url().replace(/\/$/, '');
    const res = await page.request.get(`${base}/manifest.json`);
    expect(res.status()).toBe(200);
    const manifest = await res.json();
    expect(manifest.name).toBe('Live Captions Pro');
    expect(manifest.display).toBe('standalone');
  });

  test('service worker registers and activates', async ({ page }) => {
    await gotoApp(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    const swState = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration(window.location.origin);
      if (!reg) return { registered: false, active: false };
      return {
        registered: true,
        active: !!reg.active,
        state: reg.active?.state ?? null,
      };
    });

    expect(swState.registered).toBe(true);
    expect(swState.active).toBe(true);
    if (swState.state) expect(swState.state).toBe('activated');
  });

  test('app shell loads; repeat visit can use cache', async ({ page, context }) => {
    await gotoApp(page);
    await page.waitForLoadState('networkidle').catch(() => {});

    const hasSw = await page.evaluate(() => !!navigator.serviceWorker.controller);
    expect(hasSw).toBe(true);

    await gotoApp(page);
    await expect(page.getByText('Live Captions Pro')).toBeVisible({ timeout: 10000 });
  });
});
