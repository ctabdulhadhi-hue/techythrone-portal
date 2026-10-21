import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  Shield,
  Layers,
  TrendingUp,
  Trophy,
  ArrowRight,
  Code,
  Terminal,
  KeyRound,
  Cpu,
  Search,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { getAuthUser } from '@/lib/auth/session';

export default async function HomePage() {
  const user = await getAuthUser();

  const features = [
    {
      title: 'Practical Challenges',
      subtitle: 'Real-world concepts',
      icon: Code,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-600/10 border-blue-500/20',
    },
    {
      title: 'Multiple Categories',
      subtitle: 'Web, Reverse, Crypto & more',
      icon: Layers,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-600/10 border-purple-500/20',
    },
    {
      title: 'Track Your Progress',
      subtitle: 'See your improvement',
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-600/10 border-emerald-500/20',
    },
    {
      title: 'Compete',
      subtitle: 'Climb the leaderboard',
      icon: Trophy,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-600/10 border-amber-500/20',
    },
  ];

  const categories = [
    {
      name: 'Web Exploitation',
      code: 'web',
      icon: Terminal,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      desc: 'SQL injection, SSRF, XSS, and broken access controls.',
    },
    {
      name: 'Reverse Engineering',
      code: 'reverse',
      icon: Cpu,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      desc: 'Decompile binaries, bypass protections, and analyze assembly.',
    },
    {
      name: 'Cryptography',
      code: 'crypto',
      icon: KeyRound,
      color: 'text-blue-400',
      border: 'border-blue-500/30',
      desc: 'Cipher decoding, padding oracles, and cryptographic protocols.',
    },
    {
      name: 'Digital Forensics',
      code: 'forensics',
      icon: Search,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      desc: 'Memory dump analysis, packet inspection, and steganography.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0B1220]">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span>LEARN • PRACTICE • GROW</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F8FAFC] leading-[1.15]">
                Hands-on <br />
                <span className="text-blue-500">Cybersecurity</span> <br />
                Challenges
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#94A3B8] max-w-xl leading-relaxed">
                Solve real-world inspired challenges, improve your skills, and climb the leaderboard. Built for learners, by learners.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer"
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/challenges"
                      className="px-6 py-3 rounded-lg bg-[#111C2E] hover:bg-[#1A273F] text-[#F8FAFC] font-medium text-sm border border-[#243247] transition-all flex items-center gap-2"
                    >
                      Explore Challenges
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/challenges"
                      className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer"
                    >
                      <span>Explore Challenges</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/signup"
                      className="px-6 py-3 rounded-lg bg-[#111C2E] hover:bg-[#1A273F] text-[#F8FAFC] font-medium text-sm border border-[#243247] transition-all flex items-center gap-2"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>

              {/* Security Features */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Verified Email Downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  <span>Real-time CTF Leaderboard</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Ambient glow behind laptop */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-cyan-500/10 rounded-2xl blur-2xl" />

                {/* Cyber Card Visual Simulation */}
                <div className="relative rounded-2xl bg-[#111C2E] border border-[#243247] p-6 shadow-2xl space-y-4">
                  {/* Laptop Mockup Header */}
                  <div className="flex items-center justify-between border-b border-[#243247] pb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                      <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                      <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="text-xs font-mono text-[#94A3B8]">techythrone-ctf.local</div>
                    <div className="h-4 w-4 text-blue-400">
                      <Shield className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Visual Content: Floating Badges & Challenge Preview */}
                  <div className="p-4 rounded-xl bg-[#0B1220] border border-[#243247] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-400">MISSION LAB 01</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#F8FAFC]">
                      Reverse Engineering & Web Vault
                    </div>
                    <div className="h-2 w-full bg-[#111C2E] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-3/4" />
                    </div>
                  </div>

                  {/* Floating Action Pills */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="p-2.5 rounded-lg bg-[#0B1220] border border-blue-500/30 flex flex-col items-center justify-center text-center">
                      <Sparkles className="h-4 w-4 text-blue-400 mb-1" />
                      <span className="text-[11px] font-medium text-slate-200">Learn Skills</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0B1220] border border-purple-500/30 flex flex-col items-center justify-center text-center">
                      <Shield className="h-4 w-4 text-purple-400 mb-1" />
                      <span className="text-[11px] font-medium text-slate-200">Solve Labs</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0B1220] border border-emerald-500/30 flex flex-col items-center justify-center text-center">
                      <TrendingUp className="h-4 w-4 text-emerald-400 mb-1" />
                      <span className="text-[11px] font-medium text-slate-200">Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-CARD FEATURE ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-[#111C2E] border border-[#243247] p-5 hover:border-blue-500/40 transition-all flex items-center gap-4"
                >
                  <div className={`h-11 w-11 rounded-lg border flex items-center justify-center shrink-0 ${feat.iconBg}`}>
                    <Icon className={`h-5 w-5 ${feat.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F8FAFC]">{feat.title}</h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{feat.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section id="about" className="py-16 border-t border-[#243247] bg-[#0B1220]/50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
              Curated Challenge Categories
            </h2>
            <p className="text-sm text-[#94A3B8] mt-2">
              Explore specialized cybersecurity domains with progressively challenging tasks and realistic environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.code}
                  href={`/challenges?category=${cat.code}`}
                  className="rounded-xl bg-[#111C2E] border border-[#243247] p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all group block"
                >
                  <div className={`h-10 w-10 rounded-lg bg-[#0B1220] border ${cat.border} flex items-center justify-center ${cat.color} mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[#F8FAFC] group-hover:text-blue-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
