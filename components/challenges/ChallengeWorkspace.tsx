'use client';

import { useState } from 'react';
import { AttachmentDownloadCard } from '@/components/challenges/AttachmentDownloadCard';
import { FlagSubmissionCard } from '@/components/challenges/FlagSubmissionCard';
import { DownloadVerificationPanel } from '@/components/challenges/DownloadVerificationPanel';
import {
  Lightbulb,
  FileCode,
  Info,
  Layers,
  Award,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface ChallengeWorkspaceProps {
  challengeSlug: string;
  challengeId: string;
  challengeTitle: string;
  challengeDescription: string;
  challengeCategory: string;
  challengeDifficulty: string;
  challengePoints: number;
  challengeStatus: string;
  attachment: {
    id: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
  } | null;
  user: {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
    download_verified_at?: string | null;
    is_verified?: boolean;
  } | null;
  userSolve: {
    id: string;
    solved_at: string;
    points_awarded: number;
  } | null;
  isAdmin?: boolean;
  autoDownload?: boolean;
  verifiedStatus?: string | null;
  targetAttachmentId?: string | null;
}

export function ChallengeWorkspace({
  challengeSlug,
  challengeId,
  challengeTitle,
  challengeDescription,
  challengeCategory,
  challengeDifficulty,
  challengePoints,
  challengeStatus,
  attachment,
  user,
  userSolve,
  isAdmin = false,
  autoDownload = false,
  verifiedStatus = null,
  targetAttachmentId = null,
}: ChallengeWorkspaceProps) {
  const initialVerified = Boolean(user?.download_verified_at || user?.is_verified);
  const [isVerified, setIsVerified] = useState(initialVerified);
  const [highlightTrigger, setHighlightTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'hints'>('overview');

  function handleRequireVerification() {
    setActiveTab('files');
    setHighlightTrigger((prev) => prev + 1);
  }

  function handleVerifiedDownload() {
    setIsVerified(true);
    if (!attachment) return;
    const downloadUrl = `/challenges/${challengeSlug}/download?attachmentId=${encodeURIComponent(attachment.id)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', attachment.file_name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getDifficultyBadgeColor(diff: string) {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'hard':
      case 'insane':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  }

  return (
    <div className="space-y-6">
      {/* Challenge Title Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            {challengeTitle}
          </h1>
          <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border capitalize ${getDifficultyBadgeColor(challengeDifficulty)}`}>
            {challengeDifficulty}
          </span>
        </div>
        <p className="text-sm text-[#94A3B8]">
          Category: <span className="text-[#F8FAFC] capitalize">{challengeCategory}</span> • Target: <span className="font-mono text-xs text-blue-400">/{challengeSlug}</span>
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-6 border-b border-[#243247] text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'files'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          <span>Files</span>
          {attachment && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-300">
              1
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hints')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'hints'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          Hints
        </button>
      </div>

      {/* 2-COLUMN WORKSPACE: Content Area on Left + Information & Flag Submit on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Challenge Description Card */}
              <div className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4">
                <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <span>Challenge Description</span>
                </h3>
                <div className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap">
                  {challengeDescription}
                </div>
              </div>

              {/* Mission Hint Card */}
              <div className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">Mission Hint</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Inspect the challenge environment and analyze source files carefully. Look for flags adhering strictly to the <code className="text-blue-400 font-semibold font-mono">THR&#123;...&#125;</code> format.
                  </p>
                </div>
              </div>

              {/* Attachment Shortcut if exists */}
              {attachment && (
                <div className="rounded-2xl bg-[#111C2E] border border-[#243247] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileCode className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#F8FAFC]">{attachment.file_name}</div>
                      <div className="text-[11px] text-[#94A3B8]">
                        {(attachment.file_size_bytes / 1024).toFixed(1)} KB • Challenge Artifact
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('files')}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/30 text-xs font-medium hover:bg-blue-600/20 transition-all cursor-pointer"
                  >
                    View File
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              {attachment ? (
                <>
                  <AttachmentDownloadCard
                    challengeSlug={challengeSlug}
                    attachment={attachment}
                    user={
                      user
                        ? {
                            ...user,
                            download_verified_at: isVerified ? new Date().toISOString() : null,
                            is_verified: isVerified,
                          }
                        : null
                    }
                    autoDownload={autoDownload}
                    verifiedStatus={verifiedStatus}
                    targetAttachmentId={targetAttachmentId}
                    onRequireVerification={handleRequireVerification}
                  />

                  {user && (
                    <DownloadVerificationPanel
                      challengeSlug={challengeSlug}
                      attachmentId={attachment.id}
                      fileName={attachment.file_name}
                      userEmail={user.email}
                      initialVerified={isVerified}
                      highlightTrigger={highlightTrigger}
                      onVerifiedDownload={handleVerifiedDownload}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-12 rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-2">
                  <FileCode className="h-8 w-8 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">No Attachments Provided</h4>
                  <p className="text-xs text-[#94A3B8]">This challenge does not require downloading external files.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hints' && (
            <div className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-400" />
                <span>Hints & Guidance</span>
              </h3>
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#243247] text-xs text-[#94A3B8] leading-relaxed">
                <p className="font-semibold text-slate-200 mb-1">General Strategy:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verify all response headers and embedded scripts.</li>
                  <li>In reverse engineering labs, look for string references and decompiled entrypoints.</li>
                  <li>Check comments, network calls, and cookies for hidden keys.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Submit Flag Card & Challenge Information Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Submit Flag Card */}
          <FlagSubmissionCard
            challengeId={challengeId}
            challengeSlug={challengeSlug}
            challengePoints={challengePoints}
            initialIsSolved={Boolean(userSolve)}
            solvedAt={userSolve?.solved_at}
            isAuthenticated={Boolean(user)}
            isAdmin={isAdmin}
          />

          {/* Challenge Information Card */}
          <div className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4">
            <h4 className="text-sm font-semibold text-[#F8FAFC] border-b border-[#243247] pb-3">
              Challenge Information
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Layers className="h-4 w-4" />
                  <span>Category</span>
                </div>
                <span className="font-medium text-[#F8FAFC] capitalize">{challengeCategory}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Shield className="h-4 w-4" />
                  <span>Difficulty</span>
                </div>
                <span className="font-medium text-[#F8FAFC] capitalize">{challengeDifficulty}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Award className="h-4 w-4" />
                  <span>Points</span>
                </div>
                <span className="font-bold text-amber-400">{challengePoints}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Info className="h-4 w-4" />
                  <span>Status</span>
                </div>
                <span className="font-medium text-emerald-400 capitalize">{challengeStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
