import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TerminalSimulation } from '@/components/landing/TerminalSimulation';
import { createServerClient } from '@/lib/supabase/server';
import {
  Shield,
  Terminal,
  Cpu,
  Search,
  KeyRound,
  ArrowRight,
  CheckCircle,
  Download,
  Users,
} from 'lucide-react';

export default async function HomePage() {
  const supabase = await createServerClient();

  // Query published metrics
  let totalChallenges = 0;
  let totalPoints = 0;

  try {
    const { data: challenges } = await supabase
      .from('challenges')
      .select('points')
      .eq('status', 'published');

    if (challenges) {
      totalChallenges = challenges.length;
      totalPoints = challenges.reduce((sum, c) => sum + (c.points || 0), 0);
    }
  } catch {
    // Graceful fallback for initial setup before DB connection
    totalChallenges = 12;
    totalPoints = 3500;
  }

  const categories = [
    {
      name: 'Web Exploitation',
      code: 'web',
      icon: Terminal,
      color: 'emerald',
      desc: 'SQL injection, SSRF, XSS, and broken access controls.',
    },
    {
      name: 'Cryptography',
      code: 'crypto',
      icon: KeyRound,
      color: 'cyan',
      desc: 'Cipher decoding, padding oracles, and custom crypto flaws.',
    },
    {
      name: 'Reverse Engineering',
      code: 'reverse',
      icon: Cpu,
      color: 'amber',
      desc: 'Decompile binaries, bypass anti-debugging, and analyze assembly.',
    },
    {
      name: 'Digital Forensics',
      code: 'forensics',
      icon: Search,
      color: 'purple',
      desc: 'Memory dump analysis, packet inspection, and steganography.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                TRYHACKME-INSPIRED CTF ARENA
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-mono text-slate-100">
                MASTER OFFENSIVE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  & DEFENSIVE CYBER
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
                Level up your cybersecurity skills through real vulnerability labs. Download sanitized binaries, analyze memory dumps, solve reverse-engineering challenges, and capture flags.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/challenges"
                  className="px-6 py-3 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-sm hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <Shield className="h-4 w-4" />
                  EXPLORE_CHALLENGES
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/signup"
                  className="px-6 py-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-mono text-sm border border-slate-700/80 hover:border-emerald-500/50 transition-all flex items-center gap-2"
                >
                  JOIN_NOW
                </Link>
              </div>

              {/* Security badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Verified-Email Only Downloads
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Zero-Trust Private Storage
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Terminal */}
            <div className="lg:col-span-5">
              <TerminalSimulation />
            </div>
          </div>
        </section>

        {/* METRICS COUNTER BAR */}
        <section className="border-y border-slate-800/80 bg-[#070a12]/70 backdrop-blur-sm py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800">
              <div className="text-3xl font-extrabold font-mono text-emerald-400">
                {totalChallenges > 0 ? totalChallenges : 12}+
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
                Live Challenges
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800">
              <div className="text-3xl font-extrabold font-mono text-cyan-400">
                {totalPoints > 0 ? totalPoints : 3500}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
                Total Points Pool
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800">
              <div className="text-3xl font-extrabold font-mono text-amber-400">4</div>
              <div className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
                Difficulty Tiers
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800">
              <div className="text-3xl font-extrabold font-mono text-emerald-400">60s</div>
              <div className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
                Signed URL Ephemeral TTL
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES GRID */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
              SPECIALIZED TRACKS
            </h2>
            <h3 className="text-3xl font-bold font-mono text-slate-100">
              EXPLORE CTF DISCIPLINES
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.code}
                  className="p-6 rounded-xl cyber-card flex flex-col justify-between group hover:-translate-y-1 transition-all"
                >
                  <div>
                    <div className="h-12 w-12 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:border-emerald-400 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold font-mono text-slate-100 mb-2">{cat.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{cat.desc}</p>
                  </div>

                  <Link
                    href={`/challenges?category=${cat.code}`}
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    VIEW TRACK
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECURITY & ARCHITECTURE HIGHLIGHTS */}
        <section className="py-16 border-t border-slate-800/80 bg-[#060911]/60 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
                DEFENSE-IN-DEPTH ARCHITECTURE
              </h2>
              <h3 className="text-3xl font-bold font-mono text-slate-100">
                BUILT WITH ZERO TRUST BY DESIGN
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl cyber-card">
                <div className="h-10 w-10 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                  <Download className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold font-mono text-slate-100 mb-2">
                  5-Factor Download Barrier
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  Attachments are strictly inaccessible directly. A short-lived (60s) signed URL is generated only when authenticated session, confirmed email, active status, published status, and file association are verified.
                </p>
              </div>

              <div className="p-6 rounded-xl cyber-card">
                <div className="h-10 w-10 rounded-lg bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                  <Shield className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold font-mono text-slate-100 mb-2">
                  Multi-Layer PostgreSQL RLS
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  Every query is strictly constrained by database row-level security. Ordinary authenticated users have column-level UPDATE grants on display_name only, with trigger-level privilege escalation prevention.
                </p>
              </div>

              <div className="p-6 rounded-xl cyber-card">
                <div className="h-10 w-10 rounded-lg bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold font-mono text-slate-100 mb-2">
                  Isolated Admin Operations
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  Role updates and storage mutations execute through server-only service-role modules strictly after independent server-side session and active-admin verification.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
