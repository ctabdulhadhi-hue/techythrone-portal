import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { UserSidebar } from '@/components/dashboard/UserSidebar';
import { getAuthProfile } from '@/lib/auth/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getAuthProfile();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0B1220]">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row">
        <UserSidebar isAdmin={profile?.role === 'admin'} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
