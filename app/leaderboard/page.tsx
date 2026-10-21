import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createServerClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/session';
import { Trophy, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leaderboard — Techythrone',
  description: 'Top players in the Techythrone cybersecurity community.',
};

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  total_points: number;
  solves_count: number;
  last_solve_at: string | null;
}

export default async function LeaderboardPage() {
  const supabase = await createServerClient();
  const user = await getAuthUser();

  // Fetch authoritative leaderboard from database view
  const { data: leaderboardData } = await supabase
    .from('leaderboard')
    .select('rank, user_id, username, display_name, total_points, solves_count, last_solve_at')
    .order('rank', { ascending: true })
    .limit(100);

  const leaderboard: LeaderboardEntry[] = (leaderboardData as LeaderboardEntry[]) || [];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0B1220]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#F8FAFC]">
              Leaderboard
            </h1>
            <p className="text-sm text-[#94A3B8]">
              Top players in the Techythrone community.
            </p>
          </div>

          {/* Timeframe Dropdown */}
          <div className="relative self-start sm:self-auto">
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-[#111C2E] border border-[#243247] text-xs font-medium text-[#F8FAFC] rounded-lg px-4 py-2 hover:bg-[#1A273F] transition-colors"
            >
              <span>All Time</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Leaderboard Table Card */}
        <div className="rounded-2xl bg-[#111C2E] border border-[#243247] overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="text-center py-20 p-6 space-y-3">
              <Trophy className="h-10 w-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-semibold text-[#F8FAFC]">No rankings recorded yet</h3>
              <p className="text-xs text-[#94A3B8]">
                Be the first operative to capture a challenge flag and claim the top rank!
              </p>
              <Link
                href="/challenges"
                className="inline-flex px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                Explore Challenges
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#243247] text-xs text-[#94A3B8] font-medium bg-[#0B1220]/40">
                    <th className="py-3.5 px-6 w-16">#</th>
                    <th className="py-3.5 px-6">User</th>
                    <th className="py-3.5 px-6 text-right">Points</th>
                    <th className="py-3.5 px-6 text-right">Solved</th>
                    <th className="py-3.5 px-6 text-right w-20">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243247] text-sm">
                  {leaderboard.map((entry) => {
                    const isCurrentUser = user && entry.user_id === user.id;

                    return (
                      <tr
                        key={entry.user_id}
                        className={`transition-colors hover:bg-[#1A273F]/40 ${
                          isCurrentUser ? 'bg-blue-600/10' : ''
                        }`}
                      >
                        {/* Rank Icon / Number */}
                        <td className="py-4 px-6 text-xs font-semibold">
                          {entry.rank === 1 ? (
                            <span className="text-base">🏆</span>
                          ) : entry.rank === 2 ? (
                            <span className="text-base">🥈</span>
                          ) : entry.rank === 3 ? (
                            <span className="text-base">🥉</span>
                          ) : (
                            <span className="text-[#94A3B8]">{entry.rank}</span>
                          )}
                        </td>

                        {/* User Profile */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
                              {entry.display_name
                                ? entry.display_name.charAt(0).toUpperCase()
                                : entry.username
                                ? entry.username.charAt(0).toUpperCase()
                                : 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-[#F8FAFC]">
                                {entry.username || entry.display_name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              {entry.display_name && entry.display_name !== entry.username && (
                                <div className="text-[11px] text-[#94A3B8]">
                                  {entry.display_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Points */}
                        <td className="py-4 px-6 text-right font-bold text-xs text-[#F8FAFC]">
                          {Number(entry.total_points || 0).toLocaleString()}
                        </td>

                        {/* Solved Count */}
                        <td className="py-4 px-6 text-right text-xs text-[#94A3B8]">
                          {entry.solves_count}
                        </td>

                        {/* Rank Pill Badge */}
                        <td className="py-4 px-6 text-right">
                          <span
                            className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                              entry.rank === 1
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : entry.rank === 2
                                ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                                : entry.rank === 3
                                ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30'
                                : 'bg-[#0B1220] text-[#94A3B8] border border-[#243247]'
                            }`}
                          >
                            {entry.rank}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
