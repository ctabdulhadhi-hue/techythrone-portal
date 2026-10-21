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
    .select('id, title, slug, description, category, difficulty, points, status, flag_hash, challenge_attachments(id, file_name, file_size_bytes, mime_type, created_at)')
    .eq('id', id)
    .single();

  if (error || !challenge) {
    notFound();
  }

  const rawAtt = challenge.challenge_attachments;
  const attachment = Array.isArray(rawAtt) ? rawAtt[0] : rawAtt;

  return (
    <div className="max-w-5xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Edit Challenge: <span className="text-blue-400">{challenge.title}</span>
        </h1>
        <p className="text-xs text-[#94A3B8]">
          Update challenge metadata, status lifecycle, or manage private storage attachments.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-[#111C2E] border border-[#243247]">
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
