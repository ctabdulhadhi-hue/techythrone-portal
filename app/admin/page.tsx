import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  Clock,
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
    supabase.from('challenge_attachments').select('id, file_size'),
  ]);

  const chals = challenges || [];
  const profs = profiles || [];
  const atts = attachments || [];

  const publishedCount = chals.filter((c) => c.status === 'published').length;
  const draftCount = chals.filter((c) => c.status === 'draft').length;
  const archivedCount = chals.filter((c) => c.status === 'archived').length;
  const activeUsersCount = profs.filter((p) => p.is_active).length;
  const adminCount = profs.filter((p) => p.role === 'admin').length;
  const totalAttachmentBytes = atts.reduce((acc, a) => acc + (a.file_size || 0), 0);
  const totalAttachmentMB = (totalAttachmentBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            ACTIVE_SECURITY_SESSION
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100 mt-1">
            SECURITY_OPERATIONS_CENTER
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            System overview, challenge state machine telemetry, and operative controls.
          </p>
        </div>

        <Link
          href="/admin/challenges/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-xs hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          CREATE_CHALLENGE
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl cyber-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Total Challenges</span>
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-100">{chals.length}</div>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
            <span className="text-emerald-400">{publishedCount} published</span>
            <span>•</span>
            <span className="text-amber-400">{draftCount} draft</span>
            <span>•</span>
            <span className="text-slate-500">{archivedCount} archived</span>
          </div>
        </div>

        <div className="p-5 rounded-xl cyber-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Registered Operatives</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-100">{profs.length}</div>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
            <span className="text-cyan-400">{activeUsersCount} active</span>
            <span>•</span>
            <span className="text-amber-400">{adminCount} admins</span>
          </div>
        </div>

        <div className="p-5 rounded-xl cyber-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Private Attachments</span>
            <HardDrive className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-100">{atts.length}</div>
          <div className="text-[11px] font-mono text-slate-400 mt-2">
            <span>{totalAttachmentMB} MB total encrypted storage</span>
          </div>
        </div>

        <div className="p-5 rounded-xl cyber-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Security Architecture</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400">RLS_STRICT</div>
          <div className="text-[11px] font-mono text-slate-400 mt-2">
            <span>Zero-Trust Storage • 60s Signed URLs</span>
          </div>
        </div>
      </div>

      {/* Recent Challenges Table Preview */}
      <div className="rounded-xl cyber-card overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-mono font-bold text-slate-200">RECENT_CHALLENGES</h3>
          </div>
          <Link
            href="/admin/challenges"
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            VIEW_ALL <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#05080f] text-slate-400 border-b border-slate-800 uppercase">
              <tr>
                <th className="p-3 pl-4">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Points</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {chals.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 pl-4 font-semibold text-slate-100">{c.title}</td>
                  <td className="p-3 uppercase text-emerald-400">{c.category}</td>
                  <td className="p-3 capitalize">{c.difficulty}</td>
                  <td className="p-3 text-cyan-400 font-bold">{c.points} pts</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : c.status === 'draft'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700/30 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <Link
                      href={`/admin/challenges/${c.id}`}
                      className="text-emerald-400 hover:underline"
                    >
                      EDIT / ATTACH
                    </Link>
                  </td>
                </tr>
              ))}
              {chals.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No challenges created yet. Create your first challenge to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
