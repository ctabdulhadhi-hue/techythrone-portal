import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { ChallengeRowActions } from '@/components/admin/ChallengeRowActions';
import { Plus, Paperclip } from 'lucide-react';

export default async function AdminChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from('challenges')
    .select('id, title, slug, category, difficulty, points, status, created_at, challenge_attachments(id, file_name, file_size)')
    .order('created_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.category) {
    query = query.eq('category', params.category);
  }

  const { data: challenges } = await query;
  const chals = challenges || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
            CHALLENGE_MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Create, edit, publish, archive challenges and manage private attachment payloads.
          </p>
        </div>

        <Link
          href="/admin/challenges/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-xs hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          CREATE_NEW_CHALLENGE
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <Link
          href="/admin/challenges"
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            !params.status
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          ALL ({chals.length})
        </Link>
        <Link
          href="/admin/challenges?status=published"
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            params.status === 'published'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          PUBLISHED
        </Link>
        <Link
          href="/admin/challenges?status=draft"
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            params.status === 'draft'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          DRAFTS
        </Link>
        <Link
          href="/admin/challenges?status=archived"
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            params.status === 'archived'
              ? 'bg-slate-700/50 text-slate-300 border-slate-600'
              : 'border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          ARCHIVED
        </Link>
      </div>

      {/* Challenges Table */}
      <div className="rounded-xl cyber-card overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#05080f] text-slate-400 border-b border-slate-800 uppercase">
              <tr>
                <th className="p-3.5 pl-4">Title & Slug</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Difficulty</th>
                <th className="p-3.5">Points</th>
                <th className="p-3.5">Attachment</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {chals.map((c) => {
                const attachment = Array.isArray(c.challenge_attachments)
                  ? c.challenge_attachments[0]
                  : c.challenge_attachments;

                return (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 pl-4">
                      <div className="font-bold text-slate-100">{c.title}</div>
                      <div className="text-[11px] text-slate-500">/{c.slug}</div>
                    </td>
                    <td className="p-3.5 uppercase text-emerald-400 font-semibold">{c.category}</td>
                    <td className="p-3.5 capitalize">{c.difficulty}</td>
                    <td className="p-3.5 text-cyan-400 font-bold">{c.points} pts</td>
                    <td className="p-3.5">
                      {attachment ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                          <Paperclip className="h-3 w-3 text-cyan-400" />
                          <span className="max-w-[120px] truncate">{attachment.file_name}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600">None</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                    <td className="p-3.5 pr-4 text-right">
                      <ChallengeRowActions challengeId={c.id} currentStatus={c.status} />
                    </td>
                  </tr>
                );
              })}
              {chals.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No challenges match current filter criteria.
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
