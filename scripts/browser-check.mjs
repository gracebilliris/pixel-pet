import { mkdir } from 'node:fs/promises';
const { chromium, expect } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5189';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
try {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'artifacts/adoption-desktop.png', fullPage: true });
  await page.getByLabel('Their little name').fill('Mochi');
  await page.getByRole('button', { name: /bunny bunny/ }).click();
  await page.getByRole('button', { name: 'mint', exact: true }).click();
  await page.getByRole('button', { name: 'Bring Mochi home' }).click();
  await expect(page.getByTestId('coins')).toHaveText('30');
  await page.getByRole('button', { name: 'Feed 5 coins' }).click();
  await expect(page.getByTestId('coins')).toHaveText('25');
  await expect(page.getByRole('status')).toContainText('tasty snack');
  await page.getByRole('button', { name: 'Play +3 coins' }).click();
  await expect(page.getByTestId('coins')).toHaveText('28');
  await page.getByRole('button', { name: 'Clean Free' }).click();
  await expect(page.getByRole('status')).toContainText('fresh and cosy');
  await page.getByRole('button', { name: 'Sleep Rest' }).click();
  await expect(page.getByRole('button', { name: 'Feed 5 coins' })).toBeDisabled();
  await page.getByRole('button', { name: 'Wake up' }).click();
  await page.getByRole('button', { name: 'Pause care' }).click();
  await expect(page.getByRole('button', { name: 'Feed 5 coins' })).toBeDisabled();
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.getByRole('checkbox', { name: 'Still mode' }).check();
  await page.locator('.game-launch').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: /Let’s play/ }).click();
  const sequences = [
    ['ArrowUp', 'ArrowLeft', 'ArrowDown'],
    ['ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft'],
    ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'],
  ];
  for (let round = 0; round < sequences.length; round++) {
    await expect(page.getByRole('dialog').getByRole('status')).toContainText('Your turn', { timeout: 10000 });
    for (const key of sequences[round]) { await page.keyboard.press(key); await page.waitForTimeout(100); }
    if (round < 2) await page.getByRole('button', { name: 'Next round' }).click();
    else await page.getByRole('button', { name: 'See my score' }).click();
  }
  await expect(page.locator('.game-score')).toHaveText('10 / 10');
  await page.screenshot({ path: 'artifacts/berry-reward.png', fullPage: true });
  await page.getByRole('button', { name: 'Collect reward' }).click();
  await expect(page.getByTestId('coins')).toHaveText('38');
  await page.getByRole('button', { name: 'Little bow 25 coins' }).click();
  await expect(page.getByTestId('coins')).toHaveText('13');
  await expect(page.getByRole('img', { name: /mint bunny wearing a bow/ })).toBeVisible();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByTestId('coins')).toHaveText('13');
  await expect(page.getByRole('checkbox', { name: 'Still mode' })).toBeChecked();
  await expect(page.getByRole('img', { name: /mint bunny wearing a bow/ })).toBeVisible();
  await page.screenshot({ path: 'artifacts/pet-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  await expect(page.getByRole('button', { name: 'Feed 5 coins' })).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasOverflow).toBe(false);
  await page.screenshot({ path: 'artifacts/pet-mobile.png', fullPage: true });
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'New pet', exact: true }).click();
  await expect(page.getByTestId('coins')).toHaveText('13');
  await page.locator('.game-launch').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Feed 5 coins' }).click();
  await expect(page.getByTestId('coins')).toHaveText('8');
  expect(errors).toEqual([]);
  console.log(`PASS ${baseURL}: adoption, care, sleep, pause, perfect game +10 coins, accessory, reload, motion, reset cancel, 320px layout, final care. No browser/HTTP errors.`);
} finally {
  await browser.close();
}
