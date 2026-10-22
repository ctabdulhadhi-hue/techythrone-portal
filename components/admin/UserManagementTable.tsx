'use client';

import { useState } from 'react';
import { adminUpdateUserProfile } from '@/actions/admin/users';
import { AlertCircle } from 'lucide-react';

export interface ProfileItem {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

export function UserManagementTable({
  initialUsers,
  currentAdminId,
}: {
  initialUsers: ProfileItem[];
  currentAdminId: string;
}) {
  const [users, setUsers] = useState<ProfileItem[]>(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleRole(user: ProfileItem) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (user.id === currentAdminId && newRole === 'user') {
      setError('Self-demotion is prohibited. Another administrator must change your role.');
      return;
    }

    setLoadingId(user.id);
    setError(null);

    try {
      const res = await adminUpdateUserProfile(user.id, newRole, undefined);
      if (res.error) {
        setError(res.error);
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      }
    } catch {
      setError('Failed to update operative role.');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleToggleActive(user: ProfileItem) {
    const newActive = !user.is_active;
    if (user.id === currentAdminId && !newActive) {
      setError('Self-deactivation is prohibited. You cannot suspend your own account.');
      return;
    }

    setLoadingId(user.id);
    setError(null);

    try {
      const res = await adminUpdateUserProfile(user.id, undefined, newActive);
      if (res.error) {
        setError(res.error);
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: newActive } : u))
        );
      }
    } catch {
      setError('Failed to update operative active status.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="rounded-2xl bg-[#111C2E] border border-[#243247] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1220] text-[#94A3B8] border-b border-[#243247]">
              <tr>
                <th className="p-3.5 pl-4 font-medium">User Profile</th>
                <th className="p-3.5 font-medium">Email</th>
                <th className="p-3.5 font-medium">Role</th>
                <th className="p-3.5 font-medium">Status</th>
                <th className="p-3.5 font-medium">Joined</th>
                <th className="p-3.5 pr-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243247]">
              {users.map((u) => {
                const isSelf = u.id === currentAdminId;
                const isLoading = loadingId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-[#1A273F]/40 transition-colors">
                    <td className="p-3.5 pl-4 font-semibold text-[#F8FAFC]">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
                          {u.display_name ? u.display_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div>{u.display_name || u.username}</div>
                          <div className="text-[11px] text-[#94A3B8]">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-[#94A3B8]">{u.email}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        u.role === 'admin'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        u.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#94A3B8]" suppressHydrationWarning>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      {isSelf ? (
                        <span className="text-[11px] text-slate-500 italic">Current Admin</span>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleRole(u)}
                            disabled={isLoading}
                            className="px-2.5 py-1 rounded bg-[#0B1220] border border-[#243247] text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-slate-500 transition-colors cursor-pointer"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            disabled={isLoading}
                            className={`px-2.5 py-1 rounded border text-[11px] transition-colors cursor-pointer ${
                              u.is_active
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                          >
                            {u.is_active ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
