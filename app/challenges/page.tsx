import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createServerClient } from '@/lib/supabase/server';
import {
  Shield,
  Terminal,
  KeyRound,
  Cpu,
  Search,
  Paperclip,
  ArrowRight,
  Filter,
} from 'lucide-react';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  web: Terminal,
  crypto: KeyRound,
  reverse: Cpu,
  forensics: Search,
  pwn: Shield,
  osint: Search,
  misc: Shield,
};

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; difficulty?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from('challenges')
    .select('id, title, slug, description, category, difficulty, points, status, challenge_attachments(id, file_name, file_size_bytes)')
    .eq('status', 'published')
    .order('points', { ascending: true });

  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.difficulty) {
    query = query.eq('difficulty', params.difficulty);
  }

  const { data: challenges } = await query;
  let chals = challenges || [];

  if (params.q) {
    const qLower = params.q.toLowerCase();
    chals = chals.filter(
      (c) =>
        c.title.toLowerCase().includes(qLower) ||
        c.description.toLowerCase().includes(qLower)
    );
  }

  const categories = [
    { label: 'All', value: '' },
    { label: 'Web', value: 'web' },
    { label: 'Crypto', value: 'crypto' },
    { label: 'Reverse', value: 'reverse' },
    { label: 'Forensics', value: 'forensics' },
    { label: 'Pwn', value: 'pwn' },
  ];

  const difficulties = [
    { label: 'All Difficulties', value: '' },
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
    { label: 'Insane', value: 'insane' },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 mb-1">
              <Shield className="h-4 w-4" />
              OPERATIVE_CHALLENGE_PERIMETER
            </div>
            <h1 className="text-3xl font-extrabold font-mono tracking-tight text-slate-100">
              ACTIVE_CHALLENGES
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Select an objective, download sanitized artifacts, exploit vulnerabilities, and capture flags.
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {chals.length}
            </div>
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Available Labs
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-xl cyber-card border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500 mr-1" />
            {categories.map((cat) => (
              <Link
                key={cat.value}
                href={`/challenges?category=${cat.value}${params.difficulty ? `&difficulty=${params.difficulty}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  (params.category || '') === cat.value
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Difficulty Dropdown & Search Form */}
          <form className="flex items-center gap-2 w-full md:w-auto">
            <select
              name="difficulty"
              defaultValue={params.difficulty || ''}
              className="bg-[#05080f] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              {difficulties.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            <input
              name="q"
              type="text"
              defaultValue={params.q || ''}
              placeholder="Search challenges..."
              className="bg-[#05080f] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />

            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-xs hover:bg-emerald-400 transition-all cursor-pointer"
            >
              FILTER
            </button>
          </form>
        </div>

        {/* Challenge Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chals.map((c) => {
            const Icon = categoryIcons[c.category] || Shield;
            const attachment = Array.isArray(c.challenge_attachments)
              ? c.challenge_attachments[0]
              : c.challenge_attachments;

            return (
              <div
                key={c.id}
                className="rounded-xl cyber-card border border-slate-800/80 p-5 flex flex-col justify-between group hover:-translate-y-1 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      <Icon className="h-3.5 w-3.5" />
                      {c.category}
                    </span>

                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                        c.difficulty === 'easy'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : c.difficulty === 'medium'
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          : c.difficulty === 'hard'
                          ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                          : 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
                      }`}
                    >
                      {c.difficulty}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold font-mono text-slate-100 group-hover:text-emerald-300 transition-colors">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 mt-2 font-sans leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="text-cyan-400 font-bold">{c.points} PTS</span>
                    {attachment && (
                      <span className="text-slate-500 flex items-center gap-1" title="Includes private download payload">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        Payload
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/challenges/${c.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    ENTER_LAB
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {chals.length === 0 && (
          <div className="p-12 text-center rounded-xl cyber-card border border-slate-800 text-slate-500 font-mono text-xs">
            No published challenges found matching your filters.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
