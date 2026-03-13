import { test, expect } from '@playwright/test';
import {
  gotoApp,
  waitForStartScreen,
  goToSessionScreen,
  START_BUTTON_TIMEOUT,
  SESSION_READY_TIMEOUT,
} from './helpers';

// Mobile viewport (iPhone 375×812) — applied only to mobile.spec.ts
test.use({ viewport: { width: 375, height: 812 } });

const MIN_TOUCH_TARGET = 44;

function expectTouchTarget(box: { width: number; height: number } | null) {
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(box!.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
}

test.describe('Mobile layout', () => {
  test('start screen is visible and usable on mobile', async ({ page }) => {
    await gotoApp(page);
    await waitForStartScreen(page);
    const startBtn = page.getByTestId('start-button');
    expectTouchTarget(await startBtn.boundingBox());
  });

  test('all start-screen touch targets >= 44px', async ({ page }) => {
    await gotoApp(page);
    await waitForStartScreen(page);
    expectTouchTarget(await page.getByTestId('start-button').boundingBox());
    await page.getByTestId('start-button').click();
    await expect(page.getByTestId('mic-permission-prompt')).toBeVisible({ timeout: 5000 });
    expectTouchTarget(await page.getByTestId('allow-mic-button').boundingBox());
    expectTouchTarget(await page.getByTestId('cancel-mic-prompt').boundingBox());
  });

  test('page background is correct dark color', async ({ page }) => {
    await gotoApp(page);
    await page.waitForLoadState('domcontentloaded');
    const bg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    const isDark = bg === 'rgb(26, 26, 46)' || bg === 'rgba(26, 26, 46, 1)' || bg.includes('26, 26, 46');
    expect(isDark).toBe(true);
  });

  test('caption area has scroll and bottom anchor for auto-scroll', async ({ page, context }) => {
    await goToSessionScreen(page, context);
    const area = page.getByTestId('caption-area');
    await expect(area).toBeVisible();
    const overflow = await area.evaluate((el) => window.getComputedStyle(el).overflowY);
    expect(overflow).toBe('auto');
    await expect(page.getByTestId('caption-area-bottom')).toBeAttached();
  });

  test('ControlBar is in thumb-reachable zone at bottom', async ({ page, context }) => {
    await goToSessionScreen(page, context);
    const bar = page.getByTestId('control-bar');
    const box = await bar.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const barBottom = box!.y + box!.height;
    expect(barBottom).toBeGreaterThanOrEqual(viewport!.height - 120);
  });

  test('safe area padding renders on StatusBar and ControlBar', async ({ page, context }) => {
    await goToSessionScreen(page, context);
    const statusBar = page.getByTestId('status-bar');
    const controlBar = page.getByTestId('control-bar');
    const statusStyle = await statusBar.evaluate((el) => (el as HTMLElement).style.paddingTop);
    const controlStyle = await controlBar.evaluate((el) => (el as HTMLElement).style.paddingBottom);
    expect(statusStyle).toContain('safe-area-inset-top');
    expect(controlStyle).toContain('safe-area-inset-bottom');
  });

  test('session screen touch targets >= 44px', async ({ page, context }) => {
    await goToSessionScreen(page, context);
    await expect(page.getByTestId('end-session-button')).toBeVisible();
    expectTouchTarget(await page.getByTestId('end-session-button').boundingBox());
  });
});
