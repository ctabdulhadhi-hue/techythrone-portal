'use client';

import { useState } from 'react';
import { uploadAttachmentAction, deleteAttachmentAction } from '@/actions/admin/attachments';
import { Paperclip, Upload, Trash2, Download, AlertCircle, CheckCircle2, Loader2, FileArchive } from 'lucide-react';

interface AttachmentData {
  id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
}

export function AttachmentManager({
  challengeId,
  challengeSlug,
  initialAttachment,
}: {
  challengeId: string;
  challengeSlug: string;
  initialAttachment?: AttachmentData | null;
}) {
  const [attachment, setAttachment] = useState<AttachmentData | null>(initialAttachment || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      setFeedback({ message: 'File exceeds 50MB limit.', isError: true });
      return;
    }

    setUploading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('challengeId', challengeId);
    formData.append('file', selectedFile);

    try {
      const res = await uploadAttachmentAction(formData);
      if (res.error) {
        setFeedback({ message: res.error, isError: true });
      } else {
        setFeedback({ message: 'Attachment successfully uploaded to private storage.', isError: false });
        setAttachment({
          id: res.attachmentId || 'new-id',
          file_name: selectedFile.name,
          file_size_bytes: selectedFile.size,
          mime_type: selectedFile.type || 'application/octet-stream',
          created_at: new Date().toISOString(),
        });
        setSelectedFile(null);
      }
    } catch {
      setFeedback({ message: 'Upload failed due to network or server error.', isError: true });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!attachment) return;
    if (!confirm('Are you sure you want to permanently delete this attachment file?')) {
      return;
    }

    setDeleting(true);
    setFeedback(null);

    try {
      const res = await deleteAttachmentAction(attachment.id);
      if (res.error) {
        setFeedback({ message: res.error, isError: true });
      } else {
        setFeedback({ message: 'Attachment removed from storage and database.', isError: false });
        setAttachment(null);
      }
    } catch {
      setFeedback({ message: 'Failed to delete attachment.', isError: true });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#243247] pb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-blue-400" />
            <span>Challenge Attachments</span>
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Encrypted private bucket (challenge-files). Downloadable via signed URLs exclusively by verified operatives.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            feedback.isError
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
          )}
          <div>{feedback.message}</div>
        </div>
      )}

      {/* Current Attachment Card */}
      {attachment ? (
        <div className="p-4 rounded-xl bg-[#0B1220] border border-[#243247] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <FileArchive className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F8FAFC] break-all">
                {attachment.file_name}
              </div>
              <div className="text-[11px] text-[#94A3B8] flex items-center gap-2 mt-0.5">
                <span>{formatBytes(attachment.file_size_bytes)}</span>
                <span>•</span>
                <span className="text-blue-400">{attachment.mime_type}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Download Test Route */}
            <a
              href={`/challenges/${challengeSlug}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-600/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Test Signed Download"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Test Download</span>
            </a>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Delete</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-[#0B1220] border border-dashed border-[#243247] text-center text-xs text-[#94A3B8]">
          No payload attached to this challenge yet. Upload an archive, binary, or forensic file below.
        </div>
      )}

      {/* Upload or Replace Form */}
      <form onSubmit={handleUpload} className="space-y-3 pt-2">
        <label className="block text-xs font-semibold text-[#F8FAFC]">
          {attachment ? 'Replace Existing Attachment (Max 50MB)' : 'Upload New Attachment (Max 50MB)'}
        </label>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-[#94A3B8] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#111C2E] file:text-[#F8FAFC] file:border file:border-[#243247] hover:file:bg-[#1A273F] file:cursor-pointer"
          />

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>{attachment ? 'Replace File' : 'Upload File'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
