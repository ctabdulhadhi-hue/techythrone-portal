'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Send,
  Download,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  requestDownloadVerificationAction,
  checkDownloadVerificationStatusAction,
  devAuthorizeDownloadAction,
} from '@/actions/download-verification';

interface DownloadVerificationPanelProps {
  challengeSlug: string;
  attachmentId: string;
  fileName: string;
  userEmail?: string;
  initialVerified: boolean;
  highlightTrigger?: number;
  onVerifiedDownload?: () => void;
}

export function DownloadVerificationPanel({
  challengeSlug,
  attachmentId,
  fileName,
  userEmail,
  initialVerified,
  highlightTrigger = 0,
  onVerifiedDownload,
}: DownloadVerificationPanelProps) {
  const [localVerified, setLocalVerified] = useState(false);
  const isVerified = initialVerified || localVerified;

  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [isAwaitingInbox, setIsAwaitingInbox] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const triggerDownload = useCallback(() => {
    if (onVerifiedDownload) {
      onVerifiedDownload();
      return;
    }
    const downloadUrl = `/challenges/${challengeSlug}/download?attachmentId=${encodeURIComponent(attachmentId)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [challengeSlug, attachmentId, fileName, onVerifiedDownload]);

  // Flash / pulse animation when user clicks download button on the main card
  useEffect(() => {
    if (highlightTrigger > 0 && !isVerified) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const pulseTimer = setTimeout(() => {
        setHighlightActive(true);
      }, 0);
      const clearTimer = setTimeout(() => {
        setHighlightActive(false);
      }, 2500);
      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightTrigger, isVerified]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Active Poller: Listens for user confirming email in inbox without changing the screen
  useEffect(() => {
    if (isVerified || !isAwaitingInbox) return;

    const poller = setInterval(async () => {
      try {
        const status = await checkDownloadVerificationStatusAction();
        if (status.isVerified) {
          setLocalVerified(true);
          setIsAwaitingInbox(false);
          setFeedback({
            message: 'Email authorization confirmed! Downloading challenge file...',
            isError: false,
          });
          // Automatically trigger download on the current screen
          triggerDownload();
        }
      } catch {
        // Continue polling silently
      }
    }, 2500);

    return () => clearInterval(poller);
  }, [isVerified, isAwaitingInbox, triggerDownload]);

  async function handleSendEmail() {
    if (!userEmail || isSending || cooldown > 0) return;
    setIsSending(true);
    setFeedback(null);

    try {
      const returnUrl = `/challenges/${challengeSlug}?download=1&attachmentId=${encodeURIComponent(attachmentId)}`;
      const result = await requestDownloadVerificationAction(returnUrl);

      if (result.success) {
        setFeedback({ message: result.message, isError: false });
        setIsAwaitingInbox(true);
        setCooldown(60);
      } else {
        setFeedback({ message: result.message, isError: true });
        if (result.rateLimited) {
          setCooldown(60);
        }
      }
    } catch {
      setFeedback({
        message: 'Network error communicating with verification dispatch.',
        isError: true,
      });
    } finally {
      setIsSending(false);
    }
  }

  async function handleDevBypass() {
    try {
      const res = await devAuthorizeDownloadAction();
      if (res.success) {
        setLocalVerified(true);
        setIsAwaitingInbox(false);
        setFeedback({ message: 'Dev authorization confirmed! Downloading file...', isError: false });
        triggerDownload();
      }
    } catch {
      // ignore
    }
  }

  return (
    <div
      ref={panelRef}
      className={`rounded-xl cyber-card p-6 transition-all duration-300 relative overflow-hidden ${
        highlightActive
          ? 'border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.5)] ring-2 ring-cyan-400/50'
          : isVerified
          ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          : 'border-slate-800'
      }`}
    >
      {/* Top Cyber Ribbon */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          {isVerified ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400">DOWNLOAD_UNLOCKED</span>
            </>
          ) : (
            <>
              <ShieldAlert className={`h-4 w-4 ${highlightActive ? 'text-cyan-400 animate-pulse' : 'text-amber-400'}`} />
              <span className={highlightActive ? 'text-cyan-400' : 'text-amber-400'}>
                VERIFY_EMAIL_TO_DOWNLOAD
              </span>
            </>
          )}
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
          {isVerified ? 'AUTHORIZED' : 'GATE_LOCKED'}
        </span>
      </div>

      {/* VERIFIED STATE */}
      {isVerified ? (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>EMAIL_AUTHENTICATION_ACTIVE</span>
            </div>
            <p className="text-[11px] text-emerald-300/80 leading-relaxed">
              Your registered address is authorized. Challenge attachments can be downloaded freely.
            </p>
          </div>

          <button
            type="button"
            onClick={triggerDownload}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>DOWNLOAD_FILE_NOW</span>
          </button>
        </div>
      ) : (
        /* UNVERIFIED VERIFICATION WORKFLOW */
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-300 font-mono leading-relaxed">
            Private attachments require 1-click email confirmation. The screen will not change. Proceed in your email to start the download.
          </p>

          <div className="p-2.5 bg-[#05080f] border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-400 break-all">
            {userEmail || 'registered operative email'}
          </div>

          {/* Feedback & Delivery status */}
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs font-mono flex items-start gap-2 ${
                feedback.isError
                  ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                  : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
              }`}
            >
              {feedback.isError ? (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              )}
              <span className="leading-snug">{feedback.message}</span>
            </div>
          )}

          {/* Awaiting inbox pulse indicator */}
          {isAwaitingInbox && (
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-2.5">
              <RefreshCw className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
              <div className="text-[11px] leading-snug">
                <span className="font-bold block text-cyan-200">AWAITING_INBOX_CONFIRMATION</span>
                Click the authorization link in your email. This page will automatically download the file.
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={isSending || cooldown > 0}
            className={`w-full py-2.5 px-4 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              cooldown > 0
                ? 'bg-slate-900 border border-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
          >
            {isSending ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>DISPATCHING_EMAIL...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="h-3.5 w-3.5" />
                <span>RESEND_IN_{cooldown}s</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>DISPATCH_VERIFICATION_EMAIL</span>
              </>
            )}
          </button>

          {/* Dev Quick Test Button (non-production only) */}
          {process.env.NODE_ENV !== 'production' && (
            <button
              type="button"
              onClick={handleDevBypass}
              className="w-full py-1.5 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 text-slate-400 hover:text-emerald-400 font-mono text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Simulates clicking the verification link in dev mode"
            >
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>[DEV] SIMULATE_EMAIL_CONFIRMATION</span>
            </button>
          )}
        </div>
      )}

      {/* Cyber Security Footnote */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>SECURITY_PROTOCOL</span>
        <span>SHA-256 EXPIRING TOKEN</span>
      </div>
    </div>
  );
}
