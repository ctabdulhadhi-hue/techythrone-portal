import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Techythrone — Hands-on Cybersecurity Challenges',
  description: 'Solve real-world inspired challenges, improve your skills, and climb the leaderboard. Built for learners, by learners.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark h-full antialiased ${inter.variable}`}>
      <body className="min-h-full flex flex-col bg-[#0B1220] text-[#F8FAFC] selection:bg-blue-600 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
