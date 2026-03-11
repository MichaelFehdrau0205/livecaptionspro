import { test, expect, type Page } from '@playwright/test';

// Start screen shows interactive button after client mount (setTimeout); wait for it.
const START_BUTTON_TIMEOUT = 15000;

async function gotoApp(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
}

test.describe('Session flow', () => {
  test('start screen renders and shows start button', async ({ page }) => {
    await gotoApp(page);
    await expect(page.getByText('Live Captions Pro')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('start-button')).toBeVisible({ timeout: START_BUTTON_TIMEOUT });
    await expect(page.getByText('START CAPTIONING')).toBeVisible();
    await expect(page.getByText(/education mode/i)).toBeVisible();
  });

  test('PWA manifest is linked', async ({ page }) => {
    await gotoApp(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    const href = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? (link as HTMLLinkElement).href : null;
    });
    expect(href).toBeTruthy();
    expect(href).toContain('manifest.json');
  });

  test('start button has accessible name', async ({ page }) => {
    await gotoApp(page);
    const btn = page.getByRole('button', { name: /start captioning session/i });
    await expect(btn).toBeVisible({ timeout: START_BUTTON_TIMEOUT });
  });

  test('manifest.json is served', async ({ page, baseURL }) => {
    const response = await page.request.get(`${baseURL}/manifest.json`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.name).toBe('Live Captions Pro');
    expect(body.display).toBe('standalone');
  });

  test('service worker script is served', async ({ page, baseURL }) => {
    const response = await page.request.get(`${baseURL}/sw.js`);
    expect(response.status()).toBe(200);
  });
});
