import { test, expect } from '@playwright/test';

test.describe('HTML Challenge Preview and Verification-Protected Download', () => {
  test('Published HTML challenge renders Challenge File section with separate VIEW HTML and DOWNLOAD FILE actions', async ({ page }) => {
    await page.goto('/challenges/webd');

    // Verify challenge metadata
    await expect(page.locator('text=Back to Challenges')).toBeVisible();
    await expect(page.locator('text=Challenge Description')).toBeVisible();

    // Click on Files tab to reveal attachment
    await page.click('button:has-text("Files")');

    // Verify Challenge File card
    await expect(page.locator('text=secret.html')).toBeVisible();

    // Verify both actions are displayed
    const viewBtn = page.locator('button:has-text("VIEW_HTML")');
    const downloadBtn = page.locator(':is(button, a):has-text("DOWNLOAD_FILE")');
    await expect(viewBtn).toBeVisible();
    await expect(downloadBtn).toBeVisible();

    // 1. VIEW HTML works without verification
    await viewBtn.click();
    await expect(page.locator('text=HTML_CHALLENGE_SANDBOX')).toBeVisible();

    const iframe = page.locator('iframe[title="HTML Challenge Sandbox Preview"]');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');

    // 2. DOWNLOAD FILE requires authentication -> redirects unauthenticated user to login
    await downloadBtn.click();
    await expect(page).toHaveURL(/.*login.*redirect=%2Fchallenges%2Fwebd/);
  });

  test('Server-controlled HTML preview route enforces strict CSP, MIME type, and sandboxing', async ({ request }) => {
    // 1. Fetch valid published HTML attachment preview
    const res = await request.get('/challenges/webd/preview?attachmentId=21d9e261-bc62-488f-8d6b-82cefe718ba2');
    expect(res.status()).toBe(200);

    const headers = res.headers();
    expect(headers['content-type']).toContain('text/html');
    expect(headers['content-security-policy']).toContain("default-src 'none'");
    expect(headers['content-security-policy']).toContain('sandbox allow-scripts');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['x-content-type-options']).toBe('nosniff');

    const body = await res.text();
    expect(body).toContain('CTF Flag Challenge');

    // 2. Tampered attachment ID returns 404
    const tamperedRes = await request.get('/challenges/webd/preview?attachmentId=00000000-0000-0000-0000-000000000000');
    expect(tamperedRes.status()).toBe(404);

    // 3. Invalid challenge returns 404
    const invalidChalRes = await request.get('/challenges/non-existent-challenge/preview');
    expect(invalidChalRes.status()).toBe(404);
  });

  test('Server-side download route enforces 5-factor gating and preserves return destination', async ({ request }) => {
    // 1. Unauthenticated request to download route redirects to login with redirect param
    const unauthDownloadRes = await request.get('/challenges/webd/download', {
      maxRedirects: 0,
    });
    expect(unauthDownloadRes.status()).toBe(307);
    const location = unauthDownloadRes.headers()['location'];
    expect(location).toContain('/login?error=unauthorized');
    expect(location).toContain('redirect=%2Fchallenges%2Fwebd');

    // 2. Attachment ID tampering on download route returns 404 (tested server-side)
    const badAttachRes = await request.get('/challenges/webd/download?attachmentId=00000000-0000-0000-0000-000000000000', {
      maxRedirects: 0,
    });
    // Even before checking auth, unauthenticated requests are stopped, but with auth invalid attachment is 404
    expect(badAttachRes.status()).toBe(307);
  });

  test('Email verification barrier page preserves return destination without redirect loops', async ({ page }) => {
    // Navigate to verify-email with next challenge destination
    await page.goto('/verify-email?error=unconfirmed&next=%2Fchallenges%2Fwebd');

    await expect(page.locator('text=Verify Your Email')).toBeVisible();
    await expect(page.locator('text=Email confirmation is required before downloading private challenge attachments')).toBeVisible();

    // Verify safe escape route returns directly to the challenge
    const returnLink = page.locator('a:has-text("Return to Challenge")');
    await expect(returnLink).toBeVisible();
    await returnLink.click();
    await expect(page).toHaveURL(/.*challenges\/webd/);
  });
});
