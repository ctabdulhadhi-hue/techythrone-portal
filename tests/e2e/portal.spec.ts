import { test, expect } from '@playwright/test';

test.describe('Cybersecurity Challenge Portal Navigation & Views', () => {
  test('Landing page renders Techythrone branding, hero, and tracks', async ({ page }) => {
    await page.goto('/');

    // Check title and branding
    await expect(page).toHaveTitle(/Techythrone/);
    await expect(page.locator('text=Techythrone').first()).toBeVisible();

    // Check Hero and CTA buttons
    await expect(page.locator('text=Cybersecurity').first()).toBeVisible();
    await expect(page.locator('text=Explore Challenges').first()).toBeVisible();

    // Check Specialized Tracks
    await expect(page.locator('text=Web Exploitation').first()).toBeVisible();
    await expect(page.locator('text=Cryptography').first()).toBeVisible();
  });

  test('Public challenges catalog renders filtering perimeter', async ({ page }) => {
    await page.goto('/challenges');

    await expect(page.locator('h1:has-text("Challenges")')).toBeVisible();
    await expect(page.locator('text=Reverse Engineering').first()).toBeVisible();
  });

  test('Login form renders inputs and allows navigation to signup', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('text=Sign In to Techythrone')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Sign In")')).toBeVisible();

    // Click link to signup
    await page.click('text=Create Account');
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('h1:has-text("Create Techythrone Account")')).toBeVisible();
  });

  test('Verify email barrier page displays instructions and dashboard escape route', async ({ page }) => {
    await page.goto('/verify-email?email=test%40example.com');

    await expect(page.locator('text=Verify Your Email')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
    await expect(page.locator('text=Resend Confirmation Email')).toBeVisible();
    await expect(page.locator('text=Go to Dashboard')).toBeVisible();
  });

  test('Admin login page renders admin username and password inputs', async ({ page }) => {
    await page.goto('/admin/login');

    await expect(page.locator('text=Admin Gateway')).toBeVisible();
    await expect(page.locator('text=High-privilege console access')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Access Console")')).toBeVisible();
  });

  test('Unauthenticated user accessing /dashboard is safely redirected to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login.*redirect=%2Fdashboard/);
  });

  test('Unauthenticated user accessing /admin is safely redirected to /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*admin\/login.*redirect=%2Fadmin/);
  });

  test('Unauthorized page renders access denied security banner', async ({ page }) => {
    await page.goto('/unauthorized');
    await expect(page.locator('text=ACCESS_DENIED')).toBeVisible();
  });

  test('Leaderboard page renders operative rankings, global telemetry, and deterministic scoring rules', async ({ page }) => {
    await page.goto('/leaderboard');

    await expect(page).toHaveTitle(/Leaderboard — Techythrone/);
    await expect(page.locator('h1:has-text("Leaderboard")')).toBeVisible();
    await expect(page.locator('text=Top players in the Techythrone community')).toBeVisible();
  });

  test('Challenge detail page renders Flag Submission Perimeter with THR{...} format indicator', async ({ page }) => {
    await page.goto('/challenges/webd');

    await expect(page.locator('text=Submit Flag')).toBeVisible();
    await expect(page.locator('text=THR{...}')).toBeVisible();
  });
});

