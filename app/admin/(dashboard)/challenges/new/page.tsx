import { ChallengeForm } from '@/components/admin/ChallengeForm';

export default function NewChallengePage() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Create New Challenge
        </h1>
        <p className="text-xs text-[#94A3B8]">
          Configure a new CTF challenge. Once created, you will be able to upload attachments.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-[#111C2E] border border-[#243247]">
        <ChallengeForm />
      </div>
    </div>
  );
}
