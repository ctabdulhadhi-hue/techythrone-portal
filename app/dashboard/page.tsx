import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ProfileSettingsForm } from '@/components/dashboard/ProfileSettingsForm';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser, getAuthProfile } from '@/lib/auth/session';
import { isUserEmailVerified } from '@/lib/auth/verification';
import {
  FolderCode,
  CheckCircle,
  Trophy,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Award,
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login?error=unauthorized');
  }

  const profile = await getAuthProfile();

  if (!profile) {
    redirect('/login');
  }

  const supabase = await createServerClient();

  // Fetch telemetry: published challenges count, user solves, and leaderboard standings
  const [
    { count: publishedCount },
    { data: solves },
    { data: topLeaderboard },
    { data: userRankData },
  ] = await Promise.all([
    supabase
      .from('challenges')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('challenge_solves')
      .select('challenge_id, solved_at, points_awarded, challenges(id, title, slug, category, difficulty, points)')
      .eq('user_id', user.id)
      .order('solved_at', { ascending: false }),
    supabase
      .from('leaderboard')
      .select('rank, user_id, username, display_name, total_points, solves_count')
      .order('rank', { ascending: true })
      .limit(4),
    supabase
      .from('leaderboard')
      .select('rank, total_points, solves_count')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const totalPublished = publishedCount || 0;
  const userSolves = solves || [];
  const solveCount = userSolves.length;
  const pointsEarned = userRankData?.total_points ?? userSolves.reduce(
    (acc, s) => acc + (s.points_awarded || (s.challenges as { points?: number } | null)?.points || 0),
    0
  );
  const completionPercentage = totalPublished > 0 ? Math.round((solveCount / totalPublished) * 100) : 0;
  const isEmailVerified = isUserEmailVerified({
    download_verified_at: profile.download_verified_at,
  });

  return (
    <div className="space-y-6 w-full max-w-7xl">
      {/* Unverified Email Warning if needed */}
      {!isEmailVerified && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold block text-amber-100">Email Verification Required</span>
              <span className="text-[11px] text-amber-200/80">
                Please confirm your email address to unlock challenge attachment downloads.
              </span>
            </div>
          </div>
          <Link
            href={`/verify-email?email=${encodeURIComponent(user.email || '')}`}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs transition-colors shrink-0"
          >
            Verify Email
          </Link>
        </div>
      )}

      {/* TOP ROW: Welcome Banner + Circular Progress Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Welcome Banner */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-[#111C2E] border border-[#243247] p-6 sm:p-8 flex flex-col justify-between">
          {/* Subtle scenic mountain silhouette styling in background */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-20 pointer-events-none hidden sm:block">
            <svg viewBox="0 0 400 200" fill="none" className="w-full h-full object-cover">
              <path
                d="M50 200L160 80L240 150L310 90L400 200Z"
                fill="url(#mountainGrad)"
              />
              <defs>
                <linearGradient id="mountainGrad" x1="200" y1="80" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B82F6" />
                  <stop offset="1" stopColor="#0B1220" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 space-y-2 max-w-md">
            <span className="text-xs text-[#94A3B8] font-medium tracking-wide">Welcome back,</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
              <span>{profile.display_name || user.email}</span>
              <span>👋</span>
            </h1>
            <p className="text-sm text-[#94A3B8] pt-1">
              Keep solving, keep learning. You&apos;re doing great!
            </p>
          </div>

          <div className="relative z-10 pt-6 flex items-center gap-3">
            <Link
              href="/challenges"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm"
            >
              <span>Explore Challenges</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Circular Progress Widget: "Your Progress" */}
        <div className="lg:col-span-4 rounded-2xl bg-[#111C2E] border border-[#243247] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Your Progress</h3>
            <Link href="/challenges" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="py-4 flex items-center justify-center gap-6">
            {/* Donut Progress Ring */}
            <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3.5"
                  strokeDasharray="88"
                  strokeDashoffset={88 - (88 * Math.min(completionPercentage, 100)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-[#F8FAFC]">{solveCount}/{totalPublished}</span>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <div className="text-base font-bold text-[#F8FAFC]">{solveCount}/{totalPublished}</div>
              <div className="text-xs text-[#94A3B8]">Challenges Solved</div>
              <div className="text-[11px] text-blue-400 font-medium">{completionPercentage}% Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Challenges */}
        <div className="rounded-xl bg-[#111C2E] border border-[#243247] p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <FolderCode className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#F8FAFC]">{totalPublished}</div>
            <div className="text-xs text-[#94A3B8]">Available Challenges</div>
          </div>
        </div>

        {/* Solved Challenges */}
        <div className="rounded-xl bg-[#111C2E] border border-[#243247] p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#F8FAFC]">{solveCount}</div>
            <div className="text-xs text-[#94A3B8]">Solved Challenges</div>
          </div>
        </div>

        {/* Total Points */}
        <div className="rounded-xl bg-[#111C2E] border border-[#243247] p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#F8FAFC]">{pointsEarned}</div>
            <div className="text-xs text-[#94A3B8]">Total Points</div>
          </div>
        </div>

        {/* Verified Status */}
        <div className="rounded-xl bg-[#111C2E] border border-[#243247] p-5 flex items-center gap-4">
          <div className={`h-11 w-11 rounded-lg border flex items-center justify-center shrink-0 ${
            isEmailVerified
              ? 'bg-purple-600/10 border-purple-500/20 text-purple-400'
              : 'bg-amber-600/10 border-amber-500/20 text-amber-400'
          }`}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold text-[#F8FAFC]">
              {isEmailVerified ? 'Verified' : 'Pending'}
            </div>
            <div className="text-[11px] text-[#94A3B8]">
              {isEmailVerified ? 'Download access enabled' : 'Verification required'}
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: Recent Activity & Top Players */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-7 rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#243247] pb-4">
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Recent Activity</h3>
            <Link
              href="#solved"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {userSolves.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Award className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-xs text-[#94A3B8]">No challenge solves recorded yet.</p>
              <Link
                href="/challenges"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/30 text-xs font-medium hover:bg-blue-600/20 transition-all"
              >
                Start First Challenge
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userSolves.slice(0, 5).map((solve) => {
                const chal = solve.challenges as {
                  title?: string;
                  slug?: string;
                  category?: string;
                  points?: number;
                } | null;
                const pts = solve.points_awarded || chal?.points || 0;
                const dateStr = new Date(solve.solved_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={solve.challenge_id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0B1220] border border-[#243247] hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-semibold shrink-0">
                        ⚡
                      </div>
                      <div>
                        <Link
                          href={`/challenges/${chal?.slug || solve.challenge_id}`}
                          className="text-xs font-semibold text-[#F8FAFC] hover:text-blue-400 transition-colors block"
                        >
                          {chal?.title || 'CTF Challenge'}
                        </Link>
                        <span className="text-[11px] text-[#94A3B8] capitalize">
                          {chal?.category || 'General'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-emerald-400">
                        +{pts} pts
                      </span>
                      <span className="text-[11px] text-[#94A3B8] hidden sm:inline-block">
                        {dateStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Top Players */}
        <div className="lg:col-span-5 rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#243247] pb-4">
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Top Players</h3>
            <Link
              href="/leaderboard"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <span>View Full Leaderboard</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {(!topLeaderboard || topLeaderboard.length === 0) ? (
              <p className="text-xs text-[#94A3B8] py-8 text-center">No leaderboard entries available yet.</p>
            ) : (
              topLeaderboard.map((player) => {
                const isCurrentUser = player.user_id === user.id;
                const rankNum = player.rank;

                return (
                  <div
                    key={player.user_id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurrentUser
                        ? 'bg-blue-600/10 border-blue-500/40 text-blue-200'
                        : 'bg-[#0B1220] border-[#243247] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div className="w-5 text-center font-bold text-xs shrink-0">
                        {rankNum === 1 ? (
                          <span className="text-amber-400">🥇</span>
                        ) : rankNum === 2 ? (
                          <span className="text-slate-300">🥈</span>
                        ) : rankNum === 3 ? (
                          <span className="text-amber-600">🥉</span>
                        ) : (
                          <span className="text-xs text-[#94A3B8]">{rankNum}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
                        {player.display_name ? player.display_name.charAt(0).toUpperCase() : 'U'}
                      </div>

                      <div className="truncate max-w-[130px]">
                        <span className="text-xs font-semibold text-[#F8FAFC] truncate block">
                          {player.username || player.display_name}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-[#F8FAFC]">
                      {Number(player.total_points || 0).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ANCHOR SECTION: All Solved Challenges */}
      <div id="solved" className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#243247] pb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Solved Challenges</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">Complete record of objectives captured by your account.</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {solveCount} Solved
          </span>
        </div>

        {userSolves.length === 0 ? (
          <p className="text-xs text-[#94A3B8] py-6 text-center">You have not solved any challenges yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {userSolves.map((s) => {
              const c = s.challenges as {
                id?: string;
                title?: string;
                slug?: string;
                category?: string;
                difficulty?: string;
                points?: number;
              } | null;

              return (
                <div key={s.challenge_id} className="p-4 rounded-xl bg-[#0B1220] border border-[#243247] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide">
                      {c?.category || 'General'}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      +{s.points_awarded || c?.points || 0} PTS
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">{c?.title || 'Challenge'}</h4>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>{new Date(s.solved_at).toLocaleDateString()}</span>
                    <Link
                      href={`/challenges/${c?.slug || s.challenge_id}`}
                      className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                    >
                      <span>Review</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ANCHOR SECTION: Profile Settings */}
      <div id="profile" className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-6">
        <div className="border-b border-[#243247] pb-4">
          <h3 className="text-sm font-semibold text-[#F8FAFC]">Profile Settings</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">Manage your operative identity, callsign, and account metadata.</p>
        </div>

        <ProfileSettingsForm profile={profile} />
      </div>
    </div>
  );
}
