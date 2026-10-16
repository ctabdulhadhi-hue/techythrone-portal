import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ChallengeForm } from '@/components/admin/ChallengeForm';
import { AttachmentManager } from '@/components/admin/AttachmentManager';

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('id, title, slug, description, category, difficulty, points, status, flag_hash, challenge_attachments(id, file_name, file_size, mime_type, created_at)')
    .eq('id', id)
    .single();

  if (error || !challenge) {
    notFound();
  }

  const rawAtt = challenge.challenge_attachments;
  const attachment = Array.isArray(rawAtt) ? rawAtt[0] : rawAtt;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
          EDIT_CHALLENGE: <span className="text-emerald-400">{challenge.title}</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Update challenge metadata, status lifecycle, or manage encrypted storage attachments.
        </p>
      </div>

      <div className="p-6 rounded-xl cyber-card border border-slate-800">
        <ChallengeForm initialData={challenge} />
      </div>

      <div>
        <AttachmentManager
          challengeId={challenge.id}
          challengeSlug={challenge.slug}
          initialAttachment={attachment}
        />
      </div>
    </div>
  );
}
