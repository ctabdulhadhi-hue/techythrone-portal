import { NextResponse } from 'next/server';
import { redeemDownloadVerificationToken } from '@/lib/auth/download-verification';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get('token');
  const rawNext = searchParams.get('next');
  const directAttachmentId = searchParams.get('attachmentId');
  const directDownload = searchParams.get('download');

  // Sanitize redirect target to prevent open redirect vulnerabilities
  let next = '/challenges';
  if (rawNext) {
    try {
      // Must be a relative path and not protocol-relative (//) or backslash (\)
      if (rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('\\')) {
        const parsed = new URL(rawNext, origin);
        if (parsed.origin === origin && parsed.pathname.startsWith('/')) {
          next = parsed.pathname + parsed.search + parsed.hash;
        }
      }
    } catch {
      next = '/challenges';
    }
  }

  if (!token) {
    return NextResponse.redirect(`${origin}/verify-email?error=missing_token&next=${encodeURIComponent(next)}`);
  }

  // Atomically validate and consume token
  const result = await redeemDownloadVerificationToken(token);

  if (!result.success) {
    const errorParam = result.errorCode ? result.errorCode.toLowerCase() : 'invalid_token';
    return NextResponse.redirect(`${origin}/verify-email?error=${errorParam}&next=${encodeURIComponent(next)}`);
  }

  // Verification successful: redirect to target challenge or destination
  const targetUrl = new URL(next, origin);
  targetUrl.searchParams.set('verified', 'download_authorized');

  if (directAttachmentId && !targetUrl.searchParams.has('attachmentId')) {
    targetUrl.searchParams.set('attachmentId', directAttachmentId);
  }

  if (directDownload === '1' || targetUrl.searchParams.get('download') === '1') {
    targetUrl.searchParams.set('download', '1');
  }

  return NextResponse.redirect(targetUrl.toString());
}
