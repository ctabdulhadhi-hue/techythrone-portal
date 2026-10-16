import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <SignupForm />
      </main>
      <Footer />
    </div>
  );
}
