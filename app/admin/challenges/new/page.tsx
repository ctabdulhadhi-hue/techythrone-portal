import { ChallengeForm } from '@/components/admin/ChallengeForm';

export default function NewChallengePage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
          CREATE_NEW_CHALLENGE
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Configure a new CTF challenge. Once created, you will be able to upload private binary attachments.
        </p>
      </div>

      <div className="p-6 rounded-xl cyber-card border border-slate-800">
        <ChallengeForm />
      </div>
    </div>
  );
}
