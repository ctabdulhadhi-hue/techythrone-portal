import { redirect } from 'next/navigation';
import { getAuthUser, getAuthProfile } from '@/lib/auth/session';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const params = await searchParams;

  // Check if session already exists for an active admin (memoized per-request)
  const user = await getAuthUser();
  if (user) {
    const profile = await getAuthProfile();
    if (profile?.role === 'admin' && profile?.is_active) {
      redirect('/admin');
    }
  }

  let initialError: string | undefined;
  if (params.error === 'unauthorized') {
    initialError = 'Administrative authentication required to access this console.';
  } else if (params.error === 'forbidden') {
    initialError = 'Access denied: Active administrative privileges required.';
  } else if (params.error) {
    initialError = params.error;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#080c16]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <AdminLoginForm initialError={initialError} />
      </main>
      <Footer />
    </div>
  );
}
