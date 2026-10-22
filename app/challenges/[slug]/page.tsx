import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { getAuthUser, getAuthProfile } from '@/lib/auth/session';
import { ChallengeWorkspace } from '@/components/challenges/ChallengeWorkspace';
import { ArrowLeft, Pencil, ShieldAlert } from 'lucide-react';

export default async function ChallengeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    verified?: string;
    download?: string;
    attachmentId?: string;
  }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const supabase = await createServerClient();

  // Fetch challenge and attachment
  let { data: challenge } = await supabase
    .from('challenges')
    .select('id, title, slug, description, category, difficulty, points, status, challenge_attachments(id, file_name, file_size_bytes, mime_type)')
    .eq('slug', slug)
    .single();

  // If user is unverified or anonymous, fallback to service client for published challenges
  if (!challenge) {
    const serviceClient = getServiceRoleClient();
    const { data: pubChal } = await serviceClient
      .from('challenges')
      .select('id, title, slug, description, category, difficulty, points, status, challenge_attachments(id, file_name, file_size_bytes, mime_type)')
      .eq('slug', slug)
      .single();
    if (pubChal) {
      challenge = pubChal;
    }
  }

  if (!challenge) {
    notFound();
  }

  // Get current user session to determine download gating state and admin role (memoized)
  const user = await getAuthUser();
  let isAdmin = false;
  let profile = null;
  let userSolve = null;
  if (user) {
    profile = await getAuthProfile();
    isAdmin = Boolean(profile?.role === 'admin' && profile?.is_active);

    const { data: solve } = await supabase
      .from('challenge_solves')
      .select('id, solved_at, points_awarded')
      .eq('challenge_id', challenge.id)
      .eq('user_id', user.id)
      .maybeSingle();
    userSolve = solve;
  }

  // Normal users can ONLY view published challenges; admins can preview drafts/archived
  if (challenge.status !== 'published' && !isAdmin) {
    notFound();
  }

  const rawAtt = challenge.challenge_attachments;
  const attachment = Array.isArray(rawAtt) ? rawAtt[0] : rawAtt;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0B1220]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full space-y-6">
        {/* Breadcrumb Navigation & Admin Control */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/challenges"
            className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Challenges</span>
          </Link>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admin Preview Mode</span>
              </span>
              <Link
                href={`/admin/challenges/${challenge.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit Challenge</span>
              </Link>
            </div>
          )}
        </div>

        {/* Interactive Workspace */}
        <ChallengeWorkspace
          challengeSlug={challenge.slug}
          challengeId={challenge.id}
          challengeTitle={challenge.title}
          challengeDescription={challenge.description}
          challengeCategory={challenge.category}
          challengeDifficulty={challenge.difficulty}
          challengePoints={challenge.points}
          challengeStatus={challenge.status}
          attachment={attachment}
          user={
            user
              ? {
                  id: user.id,
                  email: user.email,
                  email_confirmed_at: user.email_confirmed_at,
                  download_verified_at: profile?.download_verified_at,
                  is_verified: Boolean(profile?.download_verified_at),
                }
              : null
          }
          userSolve={userSolve}
          isAdmin={isAdmin}
          autoDownload={resolvedSearchParams.download === 'auto'}
          verifiedStatus={resolvedSearchParams.verified}
          targetAttachmentId={resolvedSearchParams.attachmentId}
        />
      </main>

      <Footer />
    </div>
  );
}
