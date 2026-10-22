import { assertAdminSession } from '@/lib/auth/assert-admin';
import { createServerClient } from '@/lib/supabase/server';
import { UserManagementTable, ProfileItem } from '@/components/admin/UserManagementTable';

export default async function AdminUsersPage() {
  const adminSession = await assertAdminSession();
  const supabase = await createServerClient();

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, username, display_name, role, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

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
        initialUsers={(users || []) as ProfileItem[]}
        currentAdminId={adminSession.user.id}
      />
    </div>
  );
}

