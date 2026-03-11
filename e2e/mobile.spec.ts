import { test, expect, type Page } from '@playwright/test';

// iPhone SE viewport
test.use({ viewport: { width: 375, height: 812 } });

const START_BUTTON_TIMEOUT = 15000;

async function gotoApp(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
}

test.describe('Mobile layout', () => {
  test('start screen is visible and usable on mobile', async ({ page }) => {
    await gotoApp(page);
    await expect(page.getByText('Live Captions Pro')).toBeVisible({ timeout: 5000 });
    const startBtn = page.getByTestId('start-button');
    await expect(startBtn).toBeVisible({ timeout: START_BUTTON_TIMEOUT });

    // Verify touch target size >= 44px
    const box = await startBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  test('page background is correct dark color', async ({ page }) => {
    await gotoApp(page);
    await page.waitForLoadState('domcontentloaded');
    const bg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    // #1a1a2e → rgb(26, 26, 46) — allow exact or equivalent
    const isDark = bg === 'rgb(26, 26, 46)' || bg === 'rgba(26, 26, 46, 1)' || bg.includes('26, 26, 46');
    expect(isDark).toBe(true);
  });
});
