import { TechythroneLogo } from '@/components/TechythroneLogo';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#243247] bg-[#0B1220] text-[#94A3B8] py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <TechythroneLogo className="h-6 w-6" />
          <div>
            <p className="text-sm font-semibold text-[#F8FAFC]">Techythrone</p>
            <p className="text-xs text-[#94A3B8]">Hands-on Cybersecurity Learning Platform</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#94A3B8]">
          <Link href="/challenges" className="hover:text-[#F8FAFC] transition-colors">
            Challenges
          </Link>
          <Link href="/leaderboard" className="hover:text-[#F8FAFC] transition-colors">
            Leaderboard
          </Link>
          <Link href="/dashboard" className="hover:text-[#F8FAFC] transition-colors">
            Dashboard
          </Link>
          <Link href="/#about" className="hover:text-[#F8FAFC] transition-colors">
            About
          </Link>
          <span>•</span>
          <span>© 2026 Techythrone. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
