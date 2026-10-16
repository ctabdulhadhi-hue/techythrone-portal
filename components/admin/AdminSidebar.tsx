import Link from 'next/link';
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  ArrowLeft,
  Terminal,
  FileCode,
} from 'lucide-react';

export function AdminSidebar() {
  return (
    <aside className="w-64 border-r border-slate-800 bg-[#070a12] flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-xs font-mono text-amber-400">
          <Terminal className="h-4 w-4" />
          <span className="font-bold tracking-wider">ADMIN_PERIMETER</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono mt-0.5">High-Privilege Operations</p>
      </div>

      <nav className="p-3 space-y-1 text-xs font-mono flex-1">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4 text-emerald-400" />
          <span>Overview</span>
        </Link>

        <Link
          href="/admin/challenges"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <ShieldAlert className="h-4 w-4 text-cyan-400" />
          <span>Manage Challenges</span>
        </Link>

        <Link
          href="/admin/challenges/new"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors pl-6"
        >
          <FileCode className="h-3.5 w-3.5 text-slate-500" />
          <span>Create Challenge</span>
        </Link>

        <Link
          href="/admin/users"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <Users className="h-4 w-4 text-amber-400" />
          <span>Operatives & Roles</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to User Portal</span>
        </Link>
      </div>
    </aside>
  );
}
