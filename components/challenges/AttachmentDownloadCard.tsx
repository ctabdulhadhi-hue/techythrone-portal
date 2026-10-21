'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  AlertCircle,
  FileArchive,
  CheckCircle2,
  Loader2,
  Send,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  Code2,
  ShieldAlert,
} from 'lucide-react';
import { requestDownloadVerificationAction } from '@/actions/download-verification';

interface AttachmentDownloadCardProps {
  challengeSlug: string;
  attachment: {
    id: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
  };
  user: {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
    download_verified_at?: string | null;
    is_verified?: boolean;
  } | null;
  autoDownload?: boolean;
  verifiedStatus?: string | null;
  targetAttachmentId?: string | null;
  onRequireVerification?: () => void;
}

export function AttachmentDownloadCard({
  challengeSlug,
  attachment,
  user,
  autoDownload = false,
  verifiedStatus = null,
  targetAttachmentId = null,
  onRequireVerification,
}: AttachmentDownloadCardProps) {
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const autoTriggeredRef = useRef(false);

  const isVerified = Boolean(user?.is_verified ?? user?.download_verified_at);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Seamless Automatic Download Effect
  useEffect(() => {
    if (!autoDownload || !isVerified || autoTriggeredRef.current) {
      return;
    }

    if (targetAttachmentId && targetAttachmentId !== attachment.id) {
      return;
    }

    const sessionKey = `downloaded_${challengeSlug}_${attachment.id}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
      return;
    }

    autoTriggeredRef.current = true;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, Date.now().toString());
    }

    // Clean URL parameters smoothly without a full page reload so refresh doesn't trigger again
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('download');
      url.searchParams.delete('verified');
      url.searchParams.delete('attachmentId');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch {
      // Ignore if history state update is unavailable
    }

    // Trigger the verified download in the current window
    const downloadUrl = `/challenges/${challengeSlug}/download?attachmentId=${encodeURIComponent(attachment.id)}`;
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.setAttribute('download', attachment.file_name);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }, [autoDownload, isVerified, targetAttachmentId, challengeSlug, attachment.id, attachment.file_name]);

  // Trusted server-side metadata and extension check for HTML attachments
  const isHtml =
    attachment.mime_type === 'text/html' ||
    attachment.file_name.toLowerCase().endsWith('.html') ||
    attachment.file_name.toLowerCase().endsWith('.htm');

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function handleResendVerification() {
    if (!user?.email || resending || resendCooldown > 0) return;
    setResending(true);
    setResendStatus(null);
    try {
      const returnUrl = `/challenges/${challengeSlug}?download=1&attachmentId=${encodeURIComponent(attachment.id)}`;
      const result = await requestDownloadVerificationAction(returnUrl);
      setResendStatus(result.message);
      if (result.success || result.rateLimited) {
        setResendCooldown(60);
      }
    } catch {
      setResendStatus('Failed to send verification email. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="rounded-xl cyber-card border border-slate-800 p-6 space-y-6">
      {/* Verified Download Status Banner */}
      {(verifiedStatus === 'download_authorized' || autoDownload) && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block text-emerald-200">
                DOWNLOAD_AUTHORIZATION_VERIFIED
              </span>
              <span className="text-emerald-300/80 text-[11px]">
                Your email has been verified. Download initiated automatically in this window.
              </span>
            </div>
          </div>
          <a
            href={`/challenges/${challengeSlug}/download?attachmentId=${encodeURIComponent(attachment.id)}`}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold font-mono text-xs hover:bg-emerald-400 transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Click to Download</span>
          </a>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
          <FileArchive className="h-4 w-4" />
          <span>CHALLENGE FILE</span>
        </div>
        <div className="flex items-center gap-2">
          {isHtml && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              <Code2 className="h-3 w-3" />
              HTML_PREVIEW_AVAILABLE
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline-block">
            5-FACTOR SERVER VERIFIED
          </span>
        </div>
      </div>

      {/* Attachment info & Action buttons */}
      <div className="p-4 rounded-lg bg-[#05080f] border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-mono text-sm font-bold text-slate-100 break-all flex items-center gap-2">
            <span>{attachment.file_name}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>Size: {formatBytes(attachment.file_size_bytes)}</span>
            <span>•</span>
            <span>Type: {attachment.mime_type}</span>
          </div>
        </div>

        {/* Dual Actions: View HTML + Download File */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Action 1: View HTML Preview (unrestricted for published challenges) */}
          {isHtml && (
            <button
              type="button"
              onClick={() => setIsPreviewOpen((open) => !open)}
              className={`px-4 py-2.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                isPreviewOpen
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/20'
              }`}
            >
              {isPreviewOpen ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>HIDE_PREVIEW</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>VIEW_HTML</span>
                </>
              )}
            </button>
          )}

          {/* Action 2: Download File (Server-enforced 5-factor verification) */}
          <a
            href={`/challenges/${challengeSlug}/download?attachmentId=${encodeURIComponent(attachment.id)}`}
            onClick={(e) => {
              const downloadTargetUrl = `/challenges/${challengeSlug}?download=1&attachmentId=${encodeURIComponent(attachment.id)}`;
              if (!user) {
                e.preventDefault();
                router.push(`/login?error=unauthorized&redirect=${encodeURIComponent(downloadTargetUrl)}`);
                return;
              }
              if (!isVerified) {
                e.preventDefault();
                if (onRequireVerification) {
                  onRequireVerification();
                  return;
                }
                router.push(`/verify-email?error=unconfirmed&email=${encodeURIComponent(user.email || '')}&next=${encodeURIComponent(downloadTargetUrl)}`);
                return;
              }
            }}
            className="px-4 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-bold font-mono text-xs hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>DOWNLOAD_FILE</span>
          </a>
        </div>
      </div>

      {/* Verification status guidance banner */}
      {user && !isVerified && (
        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Email verification is required to download challenge attachments.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onRequireVerification ? (
              <button
                type="button"
                onClick={onRequireVerification}
                className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Verify Email
              </button>
            ) : (
              <Link
                href={`/verify-email?email=${encodeURIComponent(user.email || '')}&error=unconfirmed&next=${encodeURIComponent(`/challenges/${challengeSlug}?download=1&attachmentId=${encodeURIComponent(attachment.id)}`)}`}
                className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition-colors"
              >
                Verify Email
              </Link>
            )}
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending || resendCooldown > 0}
              className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-500/40 text-slate-300 text-[11px] flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
            >
              {resending ? (
                <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
              ) : (
                <Send className="h-3 w-3 text-amber-400" />
              )}
              <span>{resending ? 'Sending...' : resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Verification Notice when user is unverified */}
      {user && !isVerified && (
        <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-mono space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
            <span>DOWNLOAD_BARRIER: UNVERIFIED_OPERATIVE</span>
          </div>
          <p className="text-[11px] text-amber-200/80 pl-6">
            Your registered email (<span className="text-white font-bold">{user.email}</span>) must be verified before downloading original binary and payload files. You can preview published HTML challenges immediately without verification.
          </p>
          {resendStatus && (
            <p className="text-[11px] text-emerald-400 pl-6 pt-1 font-bold">
              ✓ {resendStatus}
            </p>
          )}
        </div>
      )}

      {/* Dedicated HTML Sandbox Preview Area */}
      {isHtml && isPreviewOpen && (
        <div className="rounded-xl cyber-terminal border border-emerald-500/40 overflow-hidden shadow-2xl transition-all">
          {/* Preview Window Header */}
          <div className="bg-[#070b14] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                HTML_CHALLENGE_SANDBOX
              </span>
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                • ISOLATED_NULL_ORIGIN
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPreviewReloadKey((k) => k + 1)}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Reload preview iframe"
              >
                <RefreshCw className="h-3 w-3" />
                <span className="hidden sm:inline">Reload</span>
              </button>

              <a
                href={`/challenges/${challengeSlug}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 font-mono text-xs flex items-center gap-1 transition-colors"
                title="Open preview in isolated new tab"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Open in Tab</span>
              </a>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-rose-400 font-mono text-xs cursor-pointer"
                title="Close preview"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Sandboxed iframe container */}
          <div className="p-3 bg-[#03060d]">
            <iframe
              key={previewReloadKey}
              src={`/challenges/${challengeSlug}/preview`}
              sandbox="allow-scripts"
              className="w-full h-[520px] bg-white rounded-lg border border-slate-800 shadow-inner"
              title="HTML Challenge Sandbox Preview"
            />
          </div>

          {/* Sandbox Security Footer */}
          <div className="bg-[#070b14] px-4 py-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-emerald-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Restricted CSP Active: connect-src &apos;none&apos;, script isolated from session</span>
            </span>
            <span className="text-slate-500 text-[10px]">
              Sandboxed with sandbox=&quot;allow-scripts&quot;
            </span>
          </div>
        </div>
      )}

      {/* Security footnote */}
      <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        Protected attachments require authenticated email verification before short-lived signed URLs are issued.
      </p>
    </div>
  );
}
