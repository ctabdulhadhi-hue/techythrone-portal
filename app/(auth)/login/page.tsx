import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  let initialError: string | undefined;

  if (params.error === 'unauthorized') {
    initialError = 'Session expired or authentication required to access this resource.';
  } else if (params.error === 'account_deactivated') {
    initialError = 'Your account has been deactivated. Please contact an administrator.';
  } else if (params.error === 'verification_failed') {
    initialError = 'Email verification link is invalid or has expired. Please try again.';
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <LoginForm initialError={initialError} />
      </main>
      <Footer />
    </div>
  );
}
