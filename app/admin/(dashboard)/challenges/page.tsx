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
    .select('id, title, slug, category, difficulty, points, status, created_at, challenge_attachments(id, file_name, file_size_bytes)')
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
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243247] pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Manage Challenges
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Create, edit, publish, and manage CTF challenges and private attachments.
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Link
          href="/admin/challenges"
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            !params.status
              ? 'bg-blue-600 text-white border-blue-600 font-medium'
              : 'bg-[#111C2E] border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          All ({chals.length})
        </Link>
        <Link
          href="/admin/challenges?status=published"
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            params.status === 'published'
              ? 'bg-blue-600 text-white border-blue-600 font-medium'
              : 'bg-[#111C2E] border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          Published
        </Link>
        <Link
          href="/admin/challenges?status=draft"
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            params.status === 'draft'
              ? 'bg-blue-600 text-white border-blue-600 font-medium'
              : 'bg-[#111C2E] border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          Drafts
        </Link>
        <Link
          href="/admin/challenges?status=archived"
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            params.status === 'archived'
              ? 'bg-blue-600 text-white border-blue-600 font-medium'
              : 'bg-[#111C2E] border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          Archived
        </Link>
      </div>

      {/* Challenges Table */}
      <div className="rounded-2xl bg-[#111C2E] border border-[#243247] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1220] text-[#94A3B8] border-b border-[#243247]">
              <tr>
                <th className="p-3.5 pl-4 font-medium">Title & Slug</th>
                <th className="p-3.5 font-medium">Category</th>
                <th className="p-3.5 font-medium">Difficulty</th>
                <th className="p-3.5 font-medium">Points</th>
                <th className="p-3.5 font-medium">Attachment</th>
                <th className="p-3.5 font-medium">Status</th>
                <th className="p-3.5 pr-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243247]">
              {chals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#94A3B8]">
                    No challenges matching the selected filters.
                  </td>
                </tr>
              ) : (
                chals.map((c) => {
                  const rawAtt = c.challenge_attachments;
                  const attachment = Array.isArray(rawAtt) ? rawAtt[0] : rawAtt;

                  return (
                    <tr key={c.id} className="hover:bg-[#1A273F]/40 transition-colors">
                      <td className="p-3.5 pl-4 font-semibold text-[#F8FAFC]">
                        <div>{c.title}</div>
                        <div className="text-[11px] text-[#94A3B8] font-mono">/{c.slug}</div>
                      </td>
                      <td className="p-3.5 capitalize text-[#94A3B8]">{c.category}</td>
                      <td className="p-3.5 capitalize text-[#94A3B8]">{c.difficulty}</td>
                      <td className="p-3.5 font-bold text-amber-400">{c.points}</td>
                      <td className="p-3.5">
                        {attachment ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-400">
                            <Paperclip className="h-3 w-3" />
                            <span>Attached</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">None</span>
                        )}
                      </td>
                      <td className="p-3.5">
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
                      <td className="p-3.5 pr-4 text-right">
                        <ChallengeRowActions challenge={c} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
