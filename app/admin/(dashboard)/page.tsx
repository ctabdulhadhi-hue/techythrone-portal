import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import {
  ShieldAlert,
  Users,
  Plus,
  ArrowRight,
  HardDrive,
} from 'lucide-react';

export default async function AdminOverviewPage() {
  const supabase = await createServerClient();

  const [
    { data: challenges },
    { data: profiles },
    { data: attachments },
  ] = await Promise.all([
    supabase.from('challenges').select('id, title, slug, status, category, difficulty, points, created_at').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, role, is_active'),
    supabase.from('challenge_attachments').select('id, file_size_bytes'),
  ]);

  const chals = challenges || [];
  const profs = profiles || [];
  const atts = attachments || [];

  const publishedCount = chals.filter((c) => c.status === 'published').length;
  const draftCount = chals.filter((c) => c.status === 'draft').length;
  const archivedCount = chals.filter((c) => c.status === 'archived').length;
  const activeUsersCount = profs.filter((p) => p.is_active).length;
  const adminCount = profs.filter((p) => p.role === 'admin').length;
  const totalAttachmentBytes = atts.reduce((acc, a) => acc + (a.file_size_bytes || 0), 0);
  const totalAttachmentMB = (totalAttachmentBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243247] pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Overview
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Platform metrics, challenge lifecycle telemetry, and administrative controls.
          </p>
        </div>

        <Link
          href="/admin/challenges/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Challenge</span>
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111C2E] border border-[#243247]">
          <div className="flex items-center justify-between text-[#94A3B8] mb-2">
            <span className="text-xs font-medium">Total Challenges</span>
            <ShieldAlert className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-[#F8FAFC]">{chals.length}</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-[#94A3B8]">
            <span className="text-emerald-400 font-medium">{publishedCount} published</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">{draftCount} draft</span>
            <span>•</span>
            <span>{archivedCount} archived</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111C2E] border border-[#243247]">
          <div className="flex items-center justify-between text-[#94A3B8] mb-2">
            <span className="text-xs font-medium">Registered Users</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-[#F8FAFC]">{profs.length}</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-[#94A3B8]">
            <span className="text-blue-400 font-medium">{activeUsersCount} active</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">{adminCount} admins</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111C2E] border border-[#243247]">
          <div className="flex items-center justify-between text-[#94A3B8] mb-2">
            <span className="text-xs font-medium">Private Storage Payloads</span>
            <HardDrive className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[#F8FAFC]">{atts.length} files</div>
          <div className="text-xs text-[#94A3B8] mt-2">
            <span>{totalAttachmentMB} MB total payload volume</span>
          </div>
        </div>
      </div>

      {/* Recent Challenges Table */}
      <div className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#243247] pb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Recent Challenges</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">Recently created CTF challenges across the system.</p>
          </div>
          <Link
            href="/admin/challenges"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>Manage All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {chals.length === 0 ? (
          <p className="text-xs text-[#94A3B8] py-8 text-center">No challenges created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#243247] text-[#94A3B8]">
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Difficulty</th>
                  <th className="pb-3 font-medium">Points</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243247]">
                {chals.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-[#1A273F]/40 transition-colors">
                    <td className="py-3 font-semibold text-[#F8FAFC]">{c.title}</td>
                    <td className="py-3 capitalize text-[#94A3B8]">{c.category}</td>
                    <td className="py-3 capitalize text-[#94A3B8]">{c.difficulty}</td>
                    <td className="py-3 font-bold text-amber-400">{c.points}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        c.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : c.status === 'draft'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/challenges/${c.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
