'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createChallengeAction, updateChallengeAction } from '@/actions/admin/challenges';
import { Save, ArrowLeft, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import Link from 'next/link';

interface ChallengeData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  status: string;
  flag_hash?: string | null;
}

export function ChallengeForm({ initialData }: { initialData?: ChallengeData }) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');

  // Form action binding
  const boundAction = isEditing && initialData?.id
    ? updateChallengeAction.bind(null, initialData.id)
    : createChallengeAction;

  const [state, formAction, isPending] = useActionState(boundAction, null);

  function generateSlug() {
    const generated = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  }

  // If newly created, redirect to edit view so admin can upload attachments
  if (state?.success && state.challengeId && !isEditing) {
    router.push(`/admin/challenges/${state.challengeId}`);
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{state.error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
            Challenge Title *
          </label>
          <input
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Reverse Engineering Vault 101"
            className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-all"
          />
          {state?.fieldErrors?.title && (
            <p className="mt-1 text-xs text-rose-400 font-mono">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        {/* Slug */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase">
              Slug (kebab-case) *
            </label>
            <button
              type="button"
              onClick={generateSlug}
              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Wand2 className="h-3 w-3" />
              Generate from Title
            </button>
          </div>
          <input
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="reverse-engineering-vault-101"
            className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-all"
          />
          {state?.fieldErrors?.slug && (
            <p className="mt-1 text-xs text-rose-400 font-mono">{state.fieldErrors.slug[0]}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
            Category *
          </label>
          <select
            name="category"
            defaultValue={initialData?.category || 'web'}
            className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition-all"
          >
            <option value="web">Web Exploitation</option>
            <option value="crypto">Cryptography</option>
            <option value="reverse">Reverse Engineering</option>
            <option value="forensics">Digital Forensics</option>
            <option value="pwn">Binary Exploitation / Pwn</option>
            <option value="osint">OSINT</option>
            <option value="misc">Miscellaneous</option>
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
            Difficulty Tier *
          </label>
          <select
            name="difficulty"
            defaultValue={initialData?.difficulty || 'easy'}
            className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition-all"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="insane">Insane</option>
          </select>
        </div>

        {/* Points */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
            Points Awarded *
          </label>
          <input
            name="points"
            type="number"
            min={0}
            defaultValue={initialData?.points ?? 100}
            className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition-all"
          />
          {state?.fieldErrors?.points && (
            <p className="mt-1 text-xs text-rose-400 font-mono">{state.fieldErrors.points[0]}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
            Initial Status *
          </label>
          <select
            name="status"
            defaultValue={initialData?.status || 'draft'}
            className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono transition-all"
          >
            <option value="draft">Draft (Admin Only)</option>
            <option value="published">Published (Visible to Operatives)</option>
            <option value="archived">Archived (Read-Only)</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
          Description & Objective (Markdown Supported) *
        </label>
        <textarea
          name="description"
          rows={6}
          required
          defaultValue={initialData?.description || ''}
          placeholder="Detailed vulnerability scenario, instructions, and hint notes..."
          className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg p-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-all"
        ></textarea>
        {state?.fieldErrors?.description && (
          <p className="mt-1 text-xs text-rose-400 font-mono">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      {/* Optional Flag Hash */}
      <div>
        <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
          Flag Hash / Solution String (Optional)
        </label>
        <input
          name="flag_hash"
          type="text"
          defaultValue={initialData?.flag_hash || ''}
          placeholder="e.g. SHA-256 hash or flag{sample_flag}"
          className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-all"
        />
      </div>

      {/* Submit / Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <Link
          href="/admin/challenges"
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-xs hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>SAVING_CHALLENGE...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'UPDATE_CHALLENGE' : 'SAVE_AND_CONTINUE'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
