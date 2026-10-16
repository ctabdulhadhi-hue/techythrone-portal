import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileSettingsForm } from '@/components/dashboard/ProfileSettingsForm';
import { createServerClient } from '@/lib/supabase/server';
import {
  Shield,
  ShieldCheck,
  Mail,
  User,
  Award,
  ArrowRight,
  Terminal,
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?error=unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, username, display_name, role, is_active, created_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Fetch solve telemetry if available
  const { data: solves } = await supabase
    .from('challenge_solves')
    .select('challenge_id')
    .eq('user_id', user.id);

  const solveCount = solves?.length || 0;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              SESSION_ACTIVE
            </div>
            <h1 className="text-3xl font-extrabold font-mono tracking-tight text-slate-100">
              OPERATIVE_DASHBOARD
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Welcome back, <span className="text-emerald-400 font-bold">{profile.display_name}</span>. Review telemetry and mission objectives.
            </p>
          </div>

          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-xs hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] self-start sm:self-auto cursor-pointer"
          >
            <Shield className="h-4 w-4" />
            GO_TO_CHALLENGES
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl cyber-card border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">Identity Status</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
              <span>CONFIRMED</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              Verified email attached to operative profile.
            </p>
          </div>

          <div className="p-5 rounded-xl cyber-card border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">Privilege Level</span>
              <Terminal className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-cyan-400 uppercase">
              {profile.role}
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              {profile.role === 'admin'
                ? 'Full administrative control over CTF perimeter.'
                : 'Standard challenge participant clearance.'}
            </p>
          </div>

          <div className="p-5 rounded-xl cyber-card border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">Objectives Solved</span>
              <Award className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {solveCount}
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              CTF objectives completed.
            </p>
          </div>
        </div>

        {/* Profile Details & Callsign Update Form */}
        <div className="rounded-xl cyber-card border border-slate-800 p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-400" />
              OPERATIVE_PROFILE_SETTINGS
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Manage your publicly visible callsign. System security settings remain strictly immutable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Unique Username</span>
              <span className="text-slate-200 font-bold">@{profile.username}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Registered Email</span>
              <span className="text-slate-200 font-bold flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {profile.email}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <ProfileSettingsForm currentDisplayName={profile.display_name} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
