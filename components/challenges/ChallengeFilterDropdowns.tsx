'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface ChallengeFilterDropdownsProps {
  currentDifficulty?: string;
  currentSort?: string;
}

export function ChallengeFilterDropdowns({
  currentDifficulty,
  currentSort,
}: ChallengeFilterDropdownsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (!value || (key === 'sort' && value === 'latest')) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.push(`/challenges${query ? `?${query}` : ''}`);
  };

  return (
    <div className="flex items-center gap-3 self-end md:self-auto">
      {/* Difficulty Dropdown */}
      <div className="relative">
        <select
          aria-label="Filter by Difficulty"
          value={currentDifficulty || ''}
          onChange={(e) => updateParam('difficulty', e.target.value)}
          className="appearance-none bg-[#111C2E] border border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-medium rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">Difficulty: All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="insane">Insane</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <select
          aria-label="Sort Challenges"
          value={currentSort || 'latest'}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="appearance-none bg-[#111C2E] border border-[#243247] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-medium rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="latest">Sort: Latest</option>
          <option value="points">Sort: Points</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
      </div>
    </div>
  );
}
