/** Pulse skeleton shimmer primitives + composed skeletons for PCP cards */

function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`rounded bg-slate-200 animate-pulse ${className}`}
    />
  );
}

/** Single order card skeleton */
function OrderSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-3.5 space-y-3">
      <div className="flex items-center gap-2">
        <Shimmer className="h-4 w-16" />
        <Shimmer className="h-5 w-20 rounded-full" />
        <Shimmer className="h-5 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1">
            <Shimmer className="h-3 w-12" />
            <Shimmer className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Shimmer className="h-1.5 flex-1 rounded-full" />
        <Shimmer className="h-4 w-8" />
      </div>
      <div className="flex items-center gap-2">
        <Shimmer className="h-3 w-3 rounded-full" />
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-3 w-14" />
      </div>
    </div>
  );
}

/** Single piece row skeleton */
function PieceSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 flex items-start gap-3">
        <Shimmer className="w-4 h-4 mt-0.5 shrink-0 rounded" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Shimmer className="h-4 w-28" />
            <Shimmer className="h-4 w-10 ml-auto" />
          </div>
          <Shimmer className="h-3 w-48" />
          <div className="flex items-center gap-2">
            <Shimmer className="h-3 w-3 rounded-full" />
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-3 w-14" />
          </div>
        </div>
        <Shimmer className="w-4 h-4 shrink-0 rounded mt-0.5" />
      </div>
    </div>
  );
}

/** Full prefix group skeleton (1 group with N pieces) */
function GroupSkeleton({ pieces = 3 }: { pieces?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Group header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
        <Shimmer className="w-9 h-9 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-3 w-56" />
        </div>
        <Shimmer className="w-4 h-4 rounded shrink-0" />
      </div>
      {/* Pieces */}
      <div className="px-5 py-4 space-y-2.5">
        {[...Array(pieces)].map((_, i) => (
          <PieceSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Full dashboard skeleton — mimics real layout */
export function DashboardSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Toolbar row */}
      <div className="flex justify-end">
        <Shimmer className="h-7 w-28 rounded-lg" />
      </div>
      <GroupSkeleton pieces={4} />
      <GroupSkeleton pieces={2} />
      <GroupSkeleton pieces={3} />
    </div>
  );
}

/** Inline spinner for buttons */
export function ButtonSpinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}