import { assertAdminSession } from '@/lib/auth/assert-admin';
import { adminGetUsers } from '@/actions/admin/users';
import { UserManagementTable, ProfileItem } from '@/components/admin/UserManagementTable';

export default async function AdminUsersPage() {
  const adminSession = await assertAdminSession();
  const users = await adminGetUsers();

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1 border-b border-[#243247] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Users & Roles
        </h1>
        <p className="text-xs text-[#94A3B8]">
          Review registered platform users, manage administrative roles, and activate or suspend accounts.
        </p>
      </div>

      <UserManagementTable
        initialUsers={users as ProfileItem[]}
        currentAdminId={adminSession.user.id}
      />
    </div>
  );
}
