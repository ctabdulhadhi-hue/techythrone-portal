'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createChallengeAction, updateChallengeAction } from '@/actions/admin/challenges';
import { uploadAttachmentAction } from '@/actions/admin/attachments';
import { Save, Loader2, AlertCircle, Wand2, CheckCircle2, UploadCloud, X } from 'lucide-react';
import Link from 'next/link';

interface ChallengeData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  status: string;
  flag_hash?: string | null;
}

export function ChallengeForm({ initialData }: { initialData?: ChallengeData }) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);
  const hasNavigatedRef = useRef(false);

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form action binding
  const boundAction = isEditing && initialData?.id
    ? updateChallengeAction.bind(null, initialData.id)
    : createChallengeAction;

  const [state, formAction, isPending] = useActionState(boundAction, null);

  function generateSlug() {
    const generated = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  }

  // Handle post-creation attachment upload and redirection
  useEffect(() => {
    async function handlePostCreate() {
      if (state?.success && state.challengeId && !isEditing && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        if (selectedFile) {
          setIsUploadingFile(true);
          try {
            const fileData = new FormData();
            fileData.append('challengeId', state.challengeId);
            fileData.append('file', selectedFile);
            await uploadAttachmentAction(fileData);
          } catch (err) {
            console.error('Initial attachment upload error:', err);
          }
          setIsUploadingFile(false);
        }
        router.push(`/admin/challenges/${state.challengeId}`);
      }
    }
    handlePostCreate();
  }, [state?.success, state?.challengeId, isEditing, selectedFile, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  function removeSelectedFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{state.error}</div>
        </div>
      )}

      {state?.success && isEditing && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <div>Challenge updated successfully.</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Core Fields */}
        <div className="lg:col-span-8 space-y-5">
          {/* Title & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
                Title *
              </label>
              <input
                name="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reverse Engineering Vault 101"
                className="w-full bg-[#0B1220] border border-[#243247] rounded-lg px-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {state?.fieldErrors?.title && (
                <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.title[0]}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#F8FAFC]">
                  Slug (kebab-case) *
                </label>
                <button
                  type="button"
                  onClick={generateSlug}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Wand2 className="h-3 w-3" />
                  <span>Generate</span>
                </button>
              </div>
              <input
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. reverse-vault-101"
                className="w-full bg-[#0B1220] border border-[#243247] rounded-lg px-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {state?.fieldErrors?.slug && (
                <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.slug[0]}</p>
              )}
            </div>
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
                Category *
              </label>
              <select
                name="category"
                defaultValue={initialData?.category || 'web'}
                className="w-full bg-[#0B1220] border border-[#243247] rounded-lg px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="web">Web Exploitation</option>
                <option value="reverse">Reverse Engineering</option>
                <option value="crypto">Cryptography</option>
                <option value="forensics">Digital Forensics</option>
                <option value="pwn">Binary Exploitation / Pwn</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
                Difficulty *
              </label>
              <select
                name="difficulty"
                defaultValue={initialData?.difficulty || 'easy'}
                className="w-full bg-[#0B1220] border border-[#243247] rounded-lg px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="insane">Insane</option>
              </select>
            </div>
          </div>

          {/* Points & Expected Flag */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
                Points *
              </label>
              <input
                name="points"
                type="number"
                min={0}
                max={5000}
                defaultValue={initialData?.points ?? 100}
                className="w-full bg-[#0B1220] border border-[#243247] rounded-lg px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-blue-500 transition-colors"
              />
              {state?.fieldErrors?.points && (
                <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.points[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
                {isEditing ? 'Expected Flag (Optional)' : 'Expected Flag *'}
              </label>
              <input
                name="flag"
                type="text"
                required={!isEditing}
                placeholder={isEditing ? 'Leave blank to preserve existing flag' : 'THR{...}'}
                className="w-full bg-[#0B1220] border border-[#243247] rounded-lg px-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {state?.fieldErrors?.flag && (
                <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.flag[0]}</p>
              )}
            </div>
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
              Initial Status *
            </label>
            <select
              name="status"
              defaultValue={initialData?.status || 'draft'}
              className="w-full bg-[#0B1220] border border-[#243247] rounded-lg px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="draft">Draft (Admin Only)</option>
              <option value="published">Published (Visible to Operatives)</option>
              <option value="archived">Archived (Read-Only)</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
              Description *
            </label>
            <textarea
              name="description"
              rows={5}
              required
              defaultValue={initialData?.description || ''}
              placeholder="Detailed challenge description, instructions, and hints..."
              className="w-full bg-[#0B1220] border border-[#243247] rounded-lg p-3 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            ></textarea>
            {state?.fieldErrors?.description && (
              <p className="mt-1 text-xs text-rose-400">{state.fieldErrors.description[0]}</p>
            )}
          </div>
        </div>

        {/* Right Column: Challenge Attachments Upload Dropzone (Optional) */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5">
              Challenge Attachments (Optional)
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl border-2 border-dashed border-[#243247] hover:border-blue-500/60 bg-[#0B1220] p-6 text-center cursor-pointer transition-colors space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                <UploadCloud className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#F8FAFC]">
                  {selectedFile ? selectedFile.name : 'Upload File'}
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB selected`
                    : 'Drag & drop or click to upload'}
                </p>
                <p className="text-[10px] text-slate-500">
                  HTML, ZIP, or other files
                </p>
              </div>

              {selectedFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelectedFile();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] hover:bg-rose-500/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                  <span>Remove File</span>
                </button>
              )}
            </div>

            <p className="mt-2 text-[11px] text-[#94A3B8]">
              Files are securely stored in private Supabase Storage and served via signed tokens.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#243247]">
        <Link
          href="/admin/challenges"
          className="px-4 py-2 rounded-lg bg-[#111C2E] border border-[#243247] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending || isUploadingFile}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {isPending || isUploadingFile ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Challenge...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Challenge</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
