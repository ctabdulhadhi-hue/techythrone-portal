'use client';

import { useState } from 'react';
import Link from 'next/link';
import { setChallengeStatusAction, deleteChallengeAction } from '@/actions/admin/challenges';
import { Edit, Trash2, Globe, Archive, FileText, Loader2 } from 'lucide-react';

export function ChallengeRowActions({
  challengeId,
  currentStatus,
  challenge,
}: {
  challengeId?: string;
  currentStatus?: string;
  challenge?: { id: string; status: string };
}) {
  const targetId = challenge?.id || challengeId || '';
  const targetStatus = challenge?.status || currentStatus || 'draft';

  const [loading, setLoading] = useState(false);

  async function handleStatusChange(status: string) {
    if (loading || !targetId) return;
    setLoading(true);
    try {
      await setChallengeStatusAction(targetId, status);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (loading || !targetId) return;
    if (!confirm('Are you sure you want to permanently delete this challenge and any associated storage attachments?')) {
      return;
    }
    setLoading(true);
    try {
      await deleteChallengeAction(targetId);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-blue-400 inline-block" />;
  }

  return (
    <div className="flex items-center justify-end space-x-2">
      {/* Quick Status Toggles */}
      {targetStatus !== 'published' && (
        <button
          onClick={() => handleStatusChange('published')}
          title="Publish Challenge"
          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
        >
          <Globe className="h-3.5 w-3.5" />
        </button>
      )}

      {targetStatus !== 'draft' && (
        <button
          onClick={() => handleStatusChange('draft')}
          title="Revert to Draft"
          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
        </button>
      )}

      {targetStatus !== 'archived' && (
        <button
          onClick={() => handleStatusChange('archived')}
          title="Archive Challenge"
          className="p-1.5 rounded-lg bg-[#0B1220] border border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
      )}

      <Link
        href={`/admin/challenges/${targetId}`}
        title="Edit & Attachments"
        className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/30 transition-colors"
      >
        <Edit className="h-3.5 w-3.5" />
      </Link>

      <button
        onClick={handleDelete}
        title="Delete Challenge"
        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
