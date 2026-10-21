export default function DashboardLoading() {
  return (
    <div className="space-y-6 w-full max-w-7xl animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl bg-[#111C2E] border border-[#243247] p-8 space-y-4">
          <div className="h-4 w-32 bg-slate-800 rounded"></div>
          <div className="h-8 w-64 bg-slate-800 rounded"></div>
          <div className="h-4 w-80 bg-slate-800/60 rounded"></div>
          <div className="pt-4 h-9 w-40 bg-blue-600/30 rounded-lg"></div>
        </div>
        <div className="lg:col-span-4 rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4 flex flex-col justify-between">
          <div className="h-4 w-28 bg-slate-800 rounded"></div>
          <div className="h-24 w-24 mx-auto rounded-full border-4 border-slate-800 border-t-blue-500"></div>
          <div className="h-4 w-36 mx-auto bg-slate-800/60 rounded"></div>
        </div>
      </div>

      {/* 4 Stat Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-[#111C2E] border border-[#243247] space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-800 rounded"></div>
              <div className="h-8 w-8 rounded-lg bg-slate-800"></div>
            </div>
            <div className="h-7 w-20 bg-slate-800 rounded"></div>
            <div className="h-3 w-28 bg-slate-800/50 rounded"></div>
          </div>
        ))}
      </div>

      {/* Bottom Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4">
          <div className="h-5 w-40 bg-slate-800 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-[#0B1220] border border-[#243247]/60"></div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#111C2E] border border-[#243247] p-6 space-y-4">
          <div className="h-5 w-32 bg-slate-800 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-[#0B1220] border border-[#243247]/60"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
