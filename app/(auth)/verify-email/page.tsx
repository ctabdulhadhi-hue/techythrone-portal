import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VerifyEmailCard } from '@/components/auth/VerifyEmailCard';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <VerifyEmailCard email={params.email} error={params.error} />
      </main>
      <Footer />
    </div>
  );
}
