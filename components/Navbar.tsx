import Link from 'next/link';
import { getAuthUser, getAuthProfile } from '@/lib/auth/session';
import { TechythroneLogo } from '@/components/TechythroneLogo';
import { Bell, Search, LogOut } from 'lucide-react';
import { signOutAction } from '@/actions/auth';

export async function Navbar() {
  const user = await getAuthUser();
  const profile = user ? await getAuthProfile() : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#243247] bg-[#0B1220]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <TechythroneLogo className="h-7 w-7" />
            <span className="font-bold text-lg text-[#F8FAFC] tracking-tight group-hover:text-blue-400 transition-colors">
              Techythrone
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/challenges"
              className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              Challenges
            </Link>
            <Link
              href="/leaderboard"
              className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/dashboard"
              className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors flex items-center gap-1.5"
            >
              <span>Dashboard</span>
            </Link>
            <Link
              href="/#about"
              className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              About
            </Link>
          </nav>
        </div>

        {/* Search Bar (center/right on larger screens if user logged in or browsing) */}
        {user && (
          <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search challenges, categories..."
                className="w-full bg-[#111C2E] border border-[#243247] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Right Action / Auth Area */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                type="button"
                aria-label="Notifications"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#111C2E] border border-transparent hover:border-[#243247] transition-all"
              >
                <Bell className="h-4 w-4" />
              </button>

              {/* User Profile Card */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-[#243247]">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#111C2E] transition-colors group"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-semibold text-xs overflow-hidden shrink-0">
                    {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-[#F8FAFC] leading-none group-hover:text-blue-400 transition-colors">
                      {profile?.display_name || 'Operative'}
                    </div>
                    <div className="text-[11px] text-[#94A3B8] leading-tight">
                      @{profile?.username || 'user'}
                    </div>
                  </div>
                </Link>

                {profile?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-600/20 transition-all"
                  >
                    Admin
                  </Link>
                )}

                <form action={signOutAction}>
                  <button
                    type="submit"
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
