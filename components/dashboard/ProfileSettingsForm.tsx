'use client';

import { useActionState } from 'react';
import { updateDisplayNameAction } from '@/actions/user/profile';
import { User, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ProfileSettingsForm({
  currentDisplayName,
}: {
  currentDisplayName: string;
}) {
  const [state, formAction, isPending] = useActionState(updateDisplayNameAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{state.error}</div>
        </div>
      )}

      {state?.success && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <div>Display callsign updated successfully.</div>
        </div>
      )}

      <div>
        <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
          Operative Callsign / Display Name
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            name="displayName"
            type="text"
            required
            defaultValue={currentDisplayName}
            placeholder="ShadowByte"
            className="w-full bg-[#05080f] border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-all"
          />
        </div>
        {state?.fieldErrors?.displayName && (
          <p className="mt-1 text-xs text-rose-400 font-mono">{state.fieldErrors.displayName[0]}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] font-mono text-slate-500">
          Column-level security grants update access exclusively to display_name.
        </p>

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-xs hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>SAVING...</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>UPDATE_CALLSIGN</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
