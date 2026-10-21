import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import {
  Trophy,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ChallengeFilterDropdowns } from '@/components/challenges/ChallengeFilterDropdowns';

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; difficulty?: string; q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from('challenges')
    .select('id, title, slug, description, category, difficulty, points, status, created_at, challenge_attachments(id, file_name, file_size_bytes)')
    .eq('status', 'published');

  if (params.sort === 'points') {
    query = query.order('points', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.difficulty) {
    query = query.eq('difficulty', params.difficulty);
  }

  let { data: challenges } = await query;

  if (!challenges || challenges.length === 0) {
    const serviceClient = getServiceRoleClient();
    let pubQuery = serviceClient
      .from('challenges')
      .select('id, title, slug, description, category, difficulty, points, status, created_at, challenge_attachments(id, file_name, file_size_bytes)')
      .eq('status', 'published');

    if (params.sort === 'points') {
      pubQuery = pubQuery.order('points', { ascending: false });
    } else {
      pubQuery = pubQuery.order('created_at', { ascending: false });
    }

    if (params.category) {
      pubQuery = pubQuery.eq('category', params.category);
    }
    if (params.difficulty) {
      pubQuery = pubQuery.eq('difficulty', params.difficulty);
    }
    const { data: pubChallenges } = await pubQuery;
    if (pubChallenges && pubChallenges.length > 0) {
      challenges = pubChallenges;
    }
  }

  let chals = challenges || [];

  if (params.q) {
    const qLower = params.q.toLowerCase();
    chals = chals.filter(
      (c) =>
        c.title.toLowerCase().includes(qLower) ||
        c.description.toLowerCase().includes(qLower)
    );
  }

  const categoryOptions = [
    { label: 'All', value: '' },
    { label: 'Web', value: 'web' },
    { label: 'Reverse Engineering', value: 'reverse' },
    { label: 'Cryptography', value: 'crypto' },
    { label: 'Misc', value: 'misc' },
  ];

  function getCategoryBadgeColor(category: string) {
    switch (category.toLowerCase()) {
      case 'web':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'reverse':
      case 'reverse engineering':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'crypto':
      case 'cryptography':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'forensics':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  }

  function getDifficultyBadgeColor(diff: string) {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'hard':
      case 'insane':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  }

  function estimateMinutes(points: number, diff: string) {
    if (diff === 'easy') return '~ 10 mins';
    if (diff === 'medium') return '~ 15 mins';
    return points > 200 ? '~ 30 mins' : '~ 20 mins';
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0B1220]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full space-y-8">
        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Challenges
          </h1>
          <p className="text-sm text-[#94A3B8]">
            Explore a variety of cybersecurity challenges and test your skills.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categoryOptions.map((cat) => {
              const isSelected = (params.category || '') === cat.value;
              return (
                <Link
                  key={cat.label}
                  href={`/challenges?category=${cat.value}${params.difficulty ? `&difficulty=${params.difficulty}` : ''}`}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#111C2E] border border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A273F]'
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>

          {/* Right Filter Dropdowns */}
          <ChallengeFilterDropdowns
            currentDifficulty={params.difficulty}
            currentSort={params.sort}
          />
        </div>

        {/* Challenge Cards Grid */}
        {chals.length === 0 ? (
          <div className="text-center py-20 rounded-2xl bg-[#111C2E] border border-[#243247] p-8 space-y-3">
            <h3 className="text-base font-semibold text-[#F8FAFC]">No challenges found</h3>
            <p className="text-xs text-[#94A3B8]">
              Try adjusting your category or difficulty filters to view more challenges.
            </p>
            <Link
              href="/challenges"
              className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chals.map((chal) => {
              const catClass = getCategoryBadgeColor(chal.category);
              const diffClass = getDifficultyBadgeColor(chal.difficulty);
              const estTime = estimateMinutes(chal.points, chal.difficulty);

              return (
                <div
                  key={chal.id}
                  className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Badge Row */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border capitalize ${catClass}`}>
                        {chal.category}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border capitalize ${diffClass}`}>
                        {chal.difficulty}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-[#F8FAFC] tracking-tight">
                      {chal.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                      {chal.description}
                    </p>
                  </div>

                  {/* Metadata and Action */}
                  <div className="space-y-4 pt-2 border-t border-[#243247]/60">
                    <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <Trophy className="h-4 w-4" />
                        <span>{chal.points} pts</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#94A3B8]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{estTime}</span>
                      </div>
                    </div>

                    <Link
                      href={`/challenges/${chal.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <span>Start Challenge</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
