import { expect, type Page } from '@playwright/test';

export const START_BUTTON_TIMEOUT = 20000;
export const SESSION_READY_TIMEOUT = 20000;

export async function gotoApp(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load').catch(() => {});
}

export async function waitForStartScreen(page: Page) {
  await expect(page.getByText('Live Captions Pro')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('start-button')).toBeVisible({ timeout: START_BUTTON_TIMEOUT });
}

/**
 * Grant mic, open app, click Start → Allow, wait for session screen.
 * Use this in tests that need an active session.
 */
export async function goToSessionScreen(
  page: Page,
  context: { grantPermissions: (permissions: string[]) => Promise<void> }
) {
  await context.grantPermissions(['microphone']);
  await gotoApp(page);
  await waitForStartScreen(page);
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('mic-permission-prompt')).toBeVisible({ timeout: 8000 });
  await page.getByTestId('allow-mic-button').click();
  await expect(page.getByTestId('status-bar')).toBeVisible({ timeout: SESSION_READY_TIMEOUT });
}
