'use client';

import { useState } from 'react';
import { adminUpdateUserProfile } from '@/actions/admin/users';
import { ShieldCheck, ShieldAlert, UserCheck, UserX, Loader2, AlertCircle } from 'lucide-react';

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
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="rounded-xl cyber-card overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#05080f] text-slate-400 border-b border-slate-800 uppercase">
              <tr>
                <th className="p-3.5 pl-4">Operative</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">Enrolled</th>
                <th className="p-3.5 pr-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {users.map((u) => {
                const isCurrent = u.id === currentAdminId;
                const isLoading = loadingId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 pl-4">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        {u.display_name}
                        {isCurrent && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">@{u.username}</div>
                    </td>

                    <td className="p-3.5 text-slate-300">{u.email}</td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <ShieldAlert className="h-3 w-3" />
                        ) : (
                          <ShieldCheck className="h-3 w-3" />
                        )}
                        {u.role}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.is_active
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        }`}
                      >
                        {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 pr-4 text-right">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-400 inline-block" />
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={isCurrent && u.role === 'admin'}
                            title={u.role === 'admin' ? 'Demote to User' : 'Elevate to Admin'}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </button>

                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={isCurrent && u.is_active}
                            title={u.is_active ? 'Deactivate Operative' : 'Activate Operative'}
                            className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors disabled:opacity-30 cursor-pointer ${
                              u.is_active
                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                            }`}
                          >
                            {u.is_active ? (
                              <span className="flex items-center gap-1">
                                <UserX className="h-3 w-3" /> Deactivate
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3" /> Activate
                              </span>
                            )}
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
