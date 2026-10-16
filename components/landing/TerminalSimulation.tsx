'use client';

import { useState } from 'react';
import { ShieldCheck, CheckCircle2, Copy, Check } from 'lucide-react';

export function TerminalSimulation() {
  const [copied, setCopied] = useState(false);

  const command = 'ncat --ssl ctf.techythrone.internal 1337';

  function handleCopy() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full rounded-xl cyber-terminal shadow-2xl overflow-hidden border border-emerald-500/30">
      {/* Terminal Titlebar */}
      <div className="bg-[#0a0f1d] px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80"></div>
          <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
          <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
          <span className="ml-2 text-xs font-mono text-slate-400">bash — agent@techythrone-ctf:~</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {/* Terminal Body */}
      <div className="p-5 font-mono text-xs space-y-2 text-slate-300">
        <div className="text-slate-500">
          # Techythrone Cybersecurity Portal — Zero-Trust Session Active
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-emerald-400 font-bold">$</span>
          <span className="text-slate-100">whoami --verified-security-level</span>
        </div>
        <div className="text-emerald-300 pl-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>[PASS] Authenticated Identity • Email Confirmed • Active Profile</span>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <span className="text-emerald-400 font-bold">$</span>
          <span className="text-slate-100">ctf-cli request-attachment --slug sql-injection-101</span>
        </div>
        <div className="text-slate-400 pl-4 space-y-1">
          <div>[INFO] Validating attachment link to target challenge... <span className="text-emerald-400">OK</span></div>
          <div>[INFO] Generating ephemeral signed URL (TTL: 60s)... <span className="text-emerald-400">OK</span></div>
          <div className="text-cyan-400">
            [DOWNLOAD] https://challenge-files.storage/obj/sql-lab.zip?token=exp_60s
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <span className="text-emerald-400 font-bold">$</span>
          <span className="text-slate-100">{command}</span>
        </div>
        <div className="text-emerald-400 pl-4 flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="h-4 w-4" />
          <span>Connected to sandbox target daemon. Enter flag: flag&#123;...&#125;</span>
        </div>
      </div>
    </div>
  );
}
