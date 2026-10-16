import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cybersecurity Challenge Portal | Techythrone CTF',
  description: 'Hands-on cybersecurity challenges, reverse engineering, web security, and digital forensics. Level up your cyber defense skills.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100 selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
