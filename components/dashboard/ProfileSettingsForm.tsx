'use client';

import { useActionState } from 'react';
import { updateDisplayNameAction } from '@/actions/user/profile';
import { User, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProfileSettingsFormProps {
  profile?: { display_name?: string | null };
  currentDisplayName?: string;
}

export function ProfileSettingsForm({
  profile,
  currentDisplayName,
}: ProfileSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateDisplayNameAction, null);
  const defaultVal = currentDisplayName || profile?.display_name || '';

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      {state?.error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{state.error}</div>
        </div>
      )}

      {state?.success && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <div>Display name updated successfully.</div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#F8FAFC]">
          Display Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            name="displayName"
            type="text"
            required
            defaultValue={defaultVal}
            placeholder="Your Name"
            className="w-full bg-[#0B1220] border border-[#243247] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        {state?.fieldErrors?.displayName && (
          <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.displayName[0]}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-[#94A3B8]">
          This is the name displayed on your profile and leaderboards.
        </p>

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
