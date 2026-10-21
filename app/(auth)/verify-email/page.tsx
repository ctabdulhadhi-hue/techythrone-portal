import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VerifyEmailCard } from '@/components/auth/VerifyEmailCard';
import { getAuthUser, getAuthProfile } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const user = await getAuthUser();
  const email = params.email || user?.email;
  let isAlreadyVerified = false;

  if (user) {
    const profile = await getAuthProfile();
    if (profile?.download_verified_at || user.email_confirmed_at) {
      isAlreadyVerified = true;
      if (!profile?.download_verified_at && user.email_confirmed_at) {
        try {
          const serviceRole = createServiceRoleClient();
          await serviceRole
            .from('profiles')
            .update({ download_verified_at: user.email_confirmed_at })
            .eq('id', user.id);
        } catch {
          // ignore error
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <VerifyEmailCard
          email={email}
          error={isAlreadyVerified ? undefined : params.error}
          next={params.next}
          isAuthenticated={Boolean(user)}
          isAlreadyVerified={isAlreadyVerified}
        />
      </main>
      <Footer />
    </div>
  );
}
