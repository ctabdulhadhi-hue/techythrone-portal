import { assertAdminSession } from '@/lib/auth/assert-admin';
import { adminGetUsers } from '@/actions/admin/users';
import { UserManagementTable, ProfileItem } from '@/components/admin/UserManagementTable';

export default async function AdminUsersPage() {
  const adminSession = await assertAdminSession();
  const users = await adminGetUsers();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
          OPERATIVE_REGISTRY & ROLES
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Review registered operatives, promote vetted users to administrative rank, and manage access statuses.
        </p>
      </div>

      <UserManagementTable
        initialUsers={users as ProfileItem[]}
        currentAdminId={adminSession.user.id}
      />
    </div>
  );
}
