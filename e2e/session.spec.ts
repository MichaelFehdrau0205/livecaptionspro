import { test, expect } from '@playwright/test';

test.describe('Session flow', () => {
  test('start screen renders and shows start button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Live Captions Pro')).toBeVisible();
    await expect(page.getByText('START CAPTIONING')).toBeVisible();
    await expect(page.getByText(/education mode/i)).toBeVisible();
  });

  test('PWA manifest is linked', async ({ page }) => {
    await page.goto('/');
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', '/manifest.json');
  });

  test('start button has accessible name', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByText('START CAPTIONING');
    await expect(btn).toBeVisible();
  });

  test('manifest.json is served', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    const body = await response?.json();
    expect(body.name).toBe('Live Captions Pro');
    expect(body.display).toBe('standalone');
  });

  test('service worker script is served', async ({ page }) => {
    const response = await page.goto('/sw.js');
    expect(response?.status()).toBe(200);
  });
});
