import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { isUserEmailVerified } from '@/lib/auth/verification';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { origin, searchParams } = new URL(request.url);
  const attachmentId = searchParams.get('attachmentId');
  const supabase = await createServerClient();

  // FACTOR 1: Authenticated Identity Verification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const returnPath = `/challenges/${slug}?download=1${attachmentId ? `&attachmentId=${encodeURIComponent(attachmentId)}` : ''}`;

  if (authError || !user) {
    return NextResponse.redirect(
      `${origin}/login?error=unauthorized&redirect=${encodeURIComponent(returnPath)}`,
      { status: 307 }
    );
  }

  // FACTOR 3: Active Account Profile Check
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active, download_verified_at')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    return NextResponse.redirect(`${origin}/login?error=account_deactivated`, { status: 307 });
  }

  // FACTOR 2: Genuine Download Verification Barrier (profiles.download_verified_at)
  const isAuthorized = isUserEmailVerified({
    download_verified_at: profile.download_verified_at,
  });

  if (!isAuthorized) {
    return NextResponse.redirect(
      `${origin}/verify-email?error=unconfirmed&next=${encodeURIComponent(returnPath)}&email=${encodeURIComponent(user.email || '')}`,
      { status: 307 }
    );
  }

  // FACTOR 4: Published Challenge Check (Admins can preview drafts/archived)
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('id, title, status')
    .eq('slug', slug)
    .single();

  if (challengeError || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  if (challenge.status !== 'published' && profile.role !== 'admin') {
    return NextResponse.json(
      { error: 'Challenge is not currently published.' },
      { status: 403 }
    );
  }

  // FACTOR 5: Attachment-to-Challenge Association Verification
  let attachQuery = supabase
    .from('challenge_attachments')
    .select('id, storage_path, file_name')
    .eq('challenge_id', challenge.id);

  if (attachmentId) {
    attachQuery = attachQuery.eq('id', attachmentId);
  }

  const { data: attachment, error: attachError } = await attachQuery.maybeSingle();

  if (attachError || !attachment || !attachment.storage_path) {
    return NextResponse.json(
      { error: 'No attachment found for this challenge.' },
      { status: 404 }
    );
  }

  // Generate Ephemeral Signed Download URL (TTL: 60 seconds)
  const serviceRole = getServiceRoleClient();
  const { data: signedData, error: signError } = await serviceRole.storage
    .from('challenge-files')
    .createSignedUrl(attachment.storage_path, 60, {
      download: attachment.file_name,
    });

  if (signError || !signedData?.signedUrl) {
    return NextResponse.json(
      { error: 'Failed to generate secure download authorization.' },
      { status: 500 }
    );
  }

  // Return temporary 307 redirect to the signed download endpoint
  return NextResponse.redirect(signedData.signedUrl, { status: 307 });
}
