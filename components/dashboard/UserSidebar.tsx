'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TechythroneLogo } from '@/components/TechythroneLogo';
import {
  LayoutDashboard,
  Shield,
  Trophy,
  Award,
  User,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { signOutAction } from '@/actions/auth';

interface UserSidebarProps {
  isAdmin?: boolean;
}

export function UserSidebar({ isAdmin }: UserSidebarProps) {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Challenges', href: '/challenges', icon: Shield },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Solved Challenges', href: '/dashboard#solved', icon: Award },
    { name: 'Profile', href: '/dashboard#profile', icon: User },
  ];

  return (
    <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-[#243247] bg-[#0B1220] flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#243247] hidden md:flex items-center gap-2.5">
        <TechythroneLogo className="h-6 w-6" />
        <span className="font-bold text-base text-[#F8FAFC]">Techythrone</span>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1.5 text-sm font-medium flex-1">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2E]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-[#94A3B8]'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-3 border-t border-[#243247] mt-3">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Admin Panel</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Sign Out Action */}
      <div className="p-3 border-t border-[#243247]">
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
