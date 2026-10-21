'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TechythroneLogo } from '@/components/TechythroneLogo';
import {
  LayoutDashboard,
  ShieldAlert,
  PlusCircle,
  Users,
  Trophy,
  Settings,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { signOutAction } from '@/actions/auth';

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Manage Challenges', href: '/admin/challenges', icon: ShieldAlert },
    { name: 'Create Challenge', href: '/admin/challenges/new', icon: PlusCircle, isCreate: true },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Settings', href: '/admin#settings', icon: Settings },
  ];

  return (
    <aside className="w-60 border-r border-[#243247] bg-[#0B1220] flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Brand & Subheader */}
      <div className="p-4 border-b border-[#243247] space-y-1">
        <div className="flex items-center gap-2.5">
          <TechythroneLogo className="h-6 w-6" />
          <span className="font-bold text-base text-[#F8FAFC]">Techythrone</span>
        </div>
        <p className="text-[11px] text-[#94A3B8] font-medium pl-8">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1.5 text-xs font-medium flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2E]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-[#94A3B8]'}`} />
              <span>{item.isCreate ? '+ Create Challenge' : item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-[#243247] space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Portal</span>
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
