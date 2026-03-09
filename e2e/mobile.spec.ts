import { test, expect } from '@playwright/test';

// iPhone SE viewport
test.use({ viewport: { width: 375, height: 812 } });

test.describe('Mobile layout', () => {
  test('start screen is visible and usable on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Live Captions Pro')).toBeVisible();
    const startBtn = page.getByText('START CAPTIONING');
    await expect(startBtn).toBeVisible();

    // Verify touch target size >= 44px
    const box = await startBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  test('page background is correct dark color', async ({ page }) => {
    await page.goto('/');
    const bg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    // #1a1a2e → rgb(26, 26, 46)
    expect(bg).toBe('rgb(26, 26, 46)');
  });
});
