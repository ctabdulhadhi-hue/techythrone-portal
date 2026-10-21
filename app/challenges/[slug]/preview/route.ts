import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { getAuthUser, getAuthProfile } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const requestedAttachmentId = url.searchParams.get('attachmentId');
  const serviceClient = getServiceRoleClient();

  // 1. Verify target challenge exists
  const { data: challenge, error: chalError } = await serviceClient
    .from('challenges')
    .select('id, title, slug, status')
    .eq('slug', slug)
    .single();

  if (chalError || !challenge) {
    return new NextResponse('Challenge not found', { status: 404 });
  }

  // 2. Publication authorization: Published challenges can be previewed without email verification or login.
  // Unpublished / draft / archived challenges strictly require active admin authorization.
  if (challenge.status !== 'published') {
    const user = await getAuthUser();
    let isAdmin = false;
    if (user) {
      const profile = await getAuthProfile();
      isAdmin = Boolean(profile?.role === 'admin' && profile?.is_active);
    }
    if (!isAdmin) {
      return new NextResponse('Access denied: Challenge is not currently published.', {
        status: 403,
      });
    }
  }

  // 3. Verify attachment belongs to this challenge
  let attachmentQuery = serviceClient
    .from('challenge_attachments')
    .select('id, file_name, file_size_bytes, mime_type, storage_path')
    .eq('challenge_id', challenge.id);

  if (requestedAttachmentId) {
    attachmentQuery = attachmentQuery.eq('id', requestedAttachmentId);
  }

  const { data: attachment, error: attachError } = await attachmentQuery.maybeSingle();

  if (attachError || !attachment || !attachment.storage_path) {
    return new NextResponse('No attachment found for this challenge.', { status: 404 });
  }

  // 4. Validate that the attachment is an eligible HTML file
  const isHtml =
    attachment.mime_type === 'text/html' ||
    attachment.file_name.toLowerCase().endsWith('.html') ||
    attachment.file_name.toLowerCase().endsWith('.htm');

  if (!isHtml) {
    return new NextResponse('Preview is only available for HTML challenge files.', {
      status: 400,
    });
  }

  // 5. Download the file content from private Supabase Storage using isolated server-side service role
  const serviceRole = getServiceRoleClient();
  const { data: fileBlob, error: downloadError } = await serviceRole.storage
    .from('challenge-files')
    .download(attachment.storage_path);

  if (downloadError || !fileBlob) {
    return new NextResponse('Failed to load challenge file content from storage.', {
      status: 500,
    });
  }

  const htmlContent = await fileBlob.text();

  // 6. Restrictive Content Security Policy & Security Headers
  // - sandbox allow-scripts: forces isolated null-origin execution, preventing access to application cookies, localStorage, session, or parent DOM
  // - connect-src 'none': blocks network requests back to APIs or external targets
  // - form-action 'none': blocks unauthorized form submissions
  // - frame-ancestors 'self': allows framing only within the Techythrone application
  const cspHeader = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "script-src 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
    "sandbox allow-scripts",
  ].join('; ');

  return new NextResponse(htmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': cspHeader,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
}
