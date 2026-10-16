import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createServerClient } from '@/lib/supabase/server';
import {
  Shield,
  Download,
  Lock,
  ArrowLeft,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  Flag,
} from 'lucide-react';

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerClient();

  // Fetch challenge and attachment
  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('id, title, slug, description, category, difficulty, points, status, challenge_attachments(id, file_name, file_size, mime_type)')
    .eq('slug', slug)
    .single();

  if (error || !challenge) {
    notFound();
  }

  // Get current user session to determine download gating state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rawAtt = challenge.challenge_attachments;
  const attachment = Array.isArray(rawAtt) ? rawAtt[0] : rawAtt;

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Breadcrumb Navigation */}
        <Link
          href="/challenges"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK_TO_CHALLENGES
        </Link>

        {/* Challenge Header Card */}
        <div className="rounded-xl cyber-card border border-slate-800 p-6 md:p-8 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30 font-bold">
                {challenge.category}
              </span>
              <span className="uppercase text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded border border-cyan-500/30 font-bold">
                {challenge.difficulty}
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400">
              {challenge.points} POINTS
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-100">
            {challenge.title}
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            TARGET_SLUG: /{challenge.slug}
          </p>
        </div>

        {/* Scenario / Description Briefing */}
        <div className="rounded-xl cyber-terminal p-6 md:p-8 space-y-4 text-slate-300">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 border-b border-slate-800 pb-3">
            <Shield className="h-4 w-4" />
            MISSION_BRIEFING & LAB_INSTRUCTIONS
          </div>

          <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {challenge.description}
          </div>
        </div>

        {/* Protected Download Attachment Section */}
        {attachment && (
          <div className="rounded-xl cyber-card border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
                <FileArchive className="h-4 w-4" />
                PROTECTED_CHALLENGE_ATTACHMENT
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                5-FACTOR VERIFICATION ACTIVE
              </span>
            </div>

            <div className="p-4 rounded-lg bg-[#05080f] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-mono text-sm font-bold text-slate-100 break-all">
                  {attachment.file_name}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Size: {formatBytes(attachment.file_size)} • Type: {attachment.mime_type}
                </div>
              </div>

              {/* Download Action Gate */}
              {user ? (
                user.email_confirmed_at ? (
                  <a
                    href={`/challenges/${challenge.slug}/download`}
                    className="px-5 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-xs hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    DOWNLOAD_ATTACHMENT
                  </a>
                ) : (
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(user.email || '')}`}
                    className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-mono text-xs flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    VERIFY_EMAIL_TO_DOWNLOAD
                  </Link>
                )
              ) : (
                <Link
                  href="/login?error=unauthorized"
                  className="px-5 py-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Lock className="h-4 w-4" />
                  AUTHENTICATE_TO_DOWNLOAD
                </Link>
              )}
            </div>

            <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              Download links are dynamically generated signed URLs that expire after 60 seconds.
            </p>
          </div>
        )}

        {/* Flag Submission Arena Card */}
        <div className="rounded-xl cyber-card border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Flag className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-mono text-slate-100">FLAG_SUBMISSION_PERIMETER</h4>
              <p className="text-xs font-mono text-slate-400">
                Found the secret flag? Format: <code className="text-emerald-400 font-bold">flag&#123;...&#125;</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="flag{...}"
              className="w-full md:w-64 bg-[#05080f] border border-slate-700/80 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-xs hover:bg-emerald-400 transition-all shrink-0 cursor-pointer"
            >
              SUBMIT
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
