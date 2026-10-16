import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { Terminal, Shield, LogOut, LayoutDashboard, Lock } from 'lucide-react';
import { signOutAction } from '@/actions/auth';

export async function Navbar() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, display_name, username')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="h-9 w-9 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wider text-slate-100 flex items-center gap-1.5 font-mono">
              TECHY<span className="text-emerald-400">THRONE</span>
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono tracking-widest block -mt-1">
              CYBER_PORTAL v2.6
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
          <Link
            href="/challenges"
            className="px-3.5 py-1.5 rounded-md text-slate-300 hover:text-emerald-400 hover:bg-slate-800/50 transition-colors flex items-center gap-1.5"
          >
            <Shield className="h-4 w-4" />
            Challenges
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-md text-slate-300 hover:text-emerald-400 hover:bg-slate-800/50 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}
          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className="px-3 py-1 rounded-md text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 font-mono text-xs"
            >
              <Lock className="h-3.5 w-3.5" />
              ADMIN_PANEL
            </Link>
          )}
        </nav>

        {/* Right Auth Area */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
                <span className="text-emerald-400">●</span> {profile?.display_name || user.email}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md text-xs font-mono text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-md text-sm font-mono text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 rounded-md text-sm font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                Join CTF
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
