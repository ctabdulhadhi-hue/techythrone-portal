import 'server-only';

export interface SendDownloadVerificationEmailParams {
  toEmail: string;
  verificationUrl: string;
  recipientName?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  error?: string;
  provider?: 'resend' | 'smtp' | 'dev-console';
}

/**
 * Sends a private challenge download verification email containing the single-use verification link.
 *
 * Security rules:
 * 1. In production, never log or expose plaintext verification tokens or verification URLs.
 * 2. Fail safely if production email delivery is unconfigured.
 * 3. Uses verified sender identity.
 */
export async function sendDownloadVerificationEmail({
  toEmail,
  verificationUrl,
  recipientName,
}: SendDownloadVerificationEmailParams): Promise<EmailDeliveryResult> {
  const isProd = process.env.NODE_ENV === 'production';
  const resendApiKey = process.env.RESEND_API_KEY;
  const defaultFrom = resendApiKey
    ? 'Techythrone Security <onboarding@resend.dev>'
    : 'Techythrone Security <security@techythrone.ctf>';
  const fromEmail = process.env.EMAIL_FROM || defaultFrom;

  const smtpHost = process.env.SMTP_HOST;

  // 1. Production Provider A: Resend REST API
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: '🔒 Techythrone Challenge Portal — Verify Download Access',
          html: renderVerificationEmailHtml({
            recipientName: recipientName || 'Operative',
            verificationUrl,
          }),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errData = errJson as { message?: string; name?: string; statusCode?: number };
        const detailedMsg = errData?.message || `HTTP ${response.status} ${response.statusText}`;
        return {
          success: false,
          error: `Resend provider error: ${detailedMsg}`,
          provider: 'resend',
        };
      }

      return { success: true, provider: 'resend' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error communicating with email provider.';
      return { success: false, error: `Email delivery network error: ${msg}`, provider: 'resend' };
    }
  }

  // 2. Production Provider B: Standard SMTP via fetch/REST gateway or custom driver
  if (smtpHost) {
    // If SMTP host is configured, we can dispatch via an SMTP endpoint or driver
    // For universal Next.js server compatibility without external binary dependencies:
    return {
      success: false,
      error: 'SMTP transport driver not active. Please configure RESEND_API_KEY for direct HTTP delivery.',
      provider: 'smtp',
    };
  }

  // 3. Environment check: If in production without configured credentials, FAIL SAFELY
  if (isProd) {
    return {
      success: false,
      error: 'Production email delivery service is not configured. Please contact portal administration.',
    };
  }

  // 4. Development-only preview mode (strictly disabled in production)
  // Securely outputs verification URL only to developer terminal in non-production environments
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('⚡ [DEV ONLY] Download Verification Email Dispatch');
  console.log(`   Recipient: ${toEmail}`);
  console.log(`   Action URL: ${verificationUrl}`);
  console.log('   (Note: Plaintext link logging is automatically disabled in production)');
  console.log('─────────────────────────────────────────────────────────────────');

  return { success: true, provider: 'dev-console' };
}

function renderVerificationEmailHtml({
  recipientName,
  verificationUrl,
}: {
  recipientName: string;
  verificationUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Download Access</title>
</head>
<body style="background-color: #030712; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #0b1329; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <div style="display: flex; align-items: center; margin-bottom: 24px;">
      <h2 style="color: #06b6d4; margin: 0; font-family: monospace; font-size: 20px; letter-spacing: 0.05em;">TECHYTHRONE // CHALLENGE PERIMETER</h2>
    </div>
    
    <p style="font-size: 15px; color: #94a3b8; line-height: 1.6;">Operative <strong style="color: #ffffff;">${recipientName}</strong>,</p>
    
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      A request was initiated from your account to download private cybersecurity challenge files. To authorize binary downloads, verify your email ownership using the secure link below.
    </p>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${verificationUrl}" style="background-color: #06b6d4; color: #030712; font-weight: bold; font-family: monospace; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; font-size: 14px; letter-spacing: 0.05em;">
        AUTHORIZE_CHALLENGE_DOWNLOADS &rarr;
      </a>
    </div>

    <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
      🛡️ <strong>Security Notice:</strong> This authorization link is single-use and will expire in <strong>15 minutes</strong>. If you did not initiate this request, no action is required and private downloads will remain locked.
    </p>

    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;">

    <p style="font-size: 11px; color: #475569; font-family: monospace; word-break: break-all;">
      Or paste this URL into your browser:<br>
      <a href="${verificationUrl}" style="color: #06b6d4; text-decoration: none;">${verificationUrl}</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
