import { test, expect } from '@playwright/test';
import {
  gotoApp,
  waitForStartScreen,
  goToSessionScreen,
  START_BUTTON_TIMEOUT,
  SESSION_READY_TIMEOUT,
} from './helpers';

test.describe('Session flow', () => {
  test('start screen renders and shows start button', async ({ page }) => {
    await gotoApp(page);
    await expect(page.getByText('Live Captions Pro')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('start-button')).toBeVisible({ timeout: START_BUTTON_TIMEOUT });
    await expect(page.getByText('START CAPTIONING')).toBeVisible();
    await expect(page.getByText(/education mode/i)).toBeVisible();
  });

  test('mic pre-prompt dialog shows and Cancel works', async ({ page }) => {
    await gotoApp(page);
    await waitForStartScreen(page);
    await page.getByTestId('start-button').click();
    await expect(page.getByTestId('mic-permission-prompt')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('heading', { name: /microphone access/i })).toBeVisible();
    await expect(page.getByTestId('allow-mic-button')).toBeVisible();
    await expect(page.getByTestId('cancel-mic-prompt')).toBeVisible();
    await page.getByTestId('cancel-mic-prompt').click();
    await expect(page.getByTestId('mic-permission-prompt')).not.toBeVisible();
    await expect(page.getByTestId('start-button')).toBeVisible();
  });

  test('full happy path: start → mic prompt → allow → session → end → stats', async ({
    page,
    context,
  }) => {
    await goToSessionScreen(page, context);
    await expect(page.getByTestId('caption-area')).toBeVisible();
    await expect(page.getByTestId('control-bar')).toBeVisible();
    await expect(page.getByTestId('end-session-button')).toBeVisible();
    await page.getByTestId('end-session-button').click();
    await expect(page.getByText('SESSION ENDED')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/duration:/i)).toBeVisible();
    await expect(page.getByText(/words captured/i)).toBeVisible();
    await expect(page.getByText(/ai corrections/i)).toBeVisible();
  });

  test('connection lost banner appears when offline', async ({ page, context }) => {
    await goToSessionScreen(page, context);
    await context.setOffline(true);
    await expect(page.getByTestId('connection-banner')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('connection-banner').getByText(/connection lost/i)).toBeVisible();
    await context.setOffline(false);
  });

  test('session timer increments', async ({ page, context }) => {
    await goToSessionScreen(page, context);
    await expect(page.getByTestId('session-timer')).toBeVisible({ timeout: 2000 });
    const initial = await page.getByTestId('session-timer').textContent();
    await page.waitForTimeout(2500);
    const later = await page.getByTestId('session-timer').textContent();
    expect(later).not.toBe(initial);
  });

  test('tap-to-flag word adds red underline when word present', async ({ page, context }) => {
    await goToSessionScreen(page, context);
    await expect(page.getByTestId('caption-area')).toBeVisible();
    const wordButton = page.getByTestId('word-final').first();
    const visible = await wordButton.isVisible().catch(() => false);
    if (!visible) {
      test.skip();
      return;
    }
    await wordButton.click();
    await expect(wordButton).toHaveClass(/border-red-500/);
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
    await waitForStartScreen(page);
    const btn = page.getByRole('button', { name: /start captioning session/i });
    await expect(btn).toBeVisible();
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
