import { test, expect } from '@playwright/test';

test.describe('Cybersecurity Challenge Portal Navigation & Views', () => {
  test('Landing page renders TryHackMe branding, cyber hero, and tracks', async ({ page }) => {
    await page.goto('/');

    // Check title and branding
    await expect(page).toHaveTitle(/Cybersecurity Challenge Portal/);
    await expect(page.locator('text=TECHYTHRONE')).toBeVisible();

    // Check Hero and CTA buttons
    await expect(page.locator('text=MASTER OFFENSIVE')).toBeVisible();
    await expect(page.locator('text=EXPLORE_CHALLENGES')).toBeVisible();

    // Check Specialized Tracks
    await expect(page.locator('text=Web Exploitation')).toBeVisible();
    await expect(page.locator('text=Cryptography')).toBeVisible();
  });

  test('Public challenges catalog renders filtering perimeter', async ({ page }) => {
    await page.goto('/challenges');

    await expect(page.locator('text=ACTIVE_CHALLENGES')).toBeVisible();
    await expect(page.locator('text=OPERATIVE_CHALLENGE_PERIMETER')).toBeVisible();
  });

  test('Login form renders inputs and allows navigation to signup', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('text=AGENT_LOGIN')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("ESTABLISH_SESSION")')).toBeVisible();

    // Click link to signup
    await page.click('text=Register new credentials');
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('text=JOIN_CTF_PORTAL')).toBeVisible();
  });

  test('Verify email barrier page displays instructions', async ({ page }) => {
    await page.goto('/verify-email?email=test%40example.com');

    await expect(page.locator('text=EMAIL_VERIFICATION_REQUIRED')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
    await expect(page.locator('text=RESEND_CONFIRMATION_EMAIL')).toBeVisible();
  });
});
