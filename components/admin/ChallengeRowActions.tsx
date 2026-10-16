'use client';

import { useState } from 'react';
import Link from 'next/link';
import { setChallengeStatusAction, deleteChallengeAction } from '@/actions/admin/challenges';
import { Edit, Trash2, Globe, Archive, FileText, Loader2 } from 'lucide-react';

export function ChallengeRowActions({
  challengeId,
  currentStatus,
}: {
  challengeId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(status: string) {
    if (loading) return;
    setLoading(true);
    try {
      await setChallengeStatusAction(challengeId, status);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (loading) return;
    if (!confirm('Are you sure you want to permanently delete this challenge and any associated storage attachments?')) {
      return;
    }
    setLoading(true);
    try {
      await deleteChallengeAction(challengeId);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-emerald-400 inline-block" />;
  }

  return (
    <div className="flex items-center justify-end space-x-2">
      {/* Quick Status Toggles */}
      {currentStatus !== 'published' && (
        <button
          onClick={() => handleStatusChange('published')}
          title="Publish Challenge"
          className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
        </button>
      )}

      {currentStatus !== 'draft' && (
        <button
          onClick={() => handleStatusChange('draft')}
          title="Revert to Draft"
          className="p-1.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
        </button>
      )}

      {currentStatus !== 'archived' && (
        <button
          onClick={() => handleStatusChange('archived')}
          title="Archive Challenge"
          className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
      )}

      <Link
        href={`/admin/challenges/${challengeId}`}
        title="Edit & Attachments"
        className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
      >
        <Edit className="h-3.5 w-3.5" />
      </Link>

      <button
        onClick={handleDelete}
        title="Delete Challenge"
        className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
