import { redirect } from 'next/navigation';
import { assertAdminSession } from '@/lib/auth/assert-admin';
import { Navbar } from '@/components/Navbar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await assertAdminSession();
  } catch {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080c16]">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
