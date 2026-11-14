import { cn } from '../../utils/cn';

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-sage-200/50', className)}
    />
  );
}

export function KpiSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((idx) => (
        <div
          key={idx}
          className="rounded-xl border border-soga-400/40 bg-white p-5 shadow-soft"
        >
          <SkeletonBox className="h-3 w-28" />
          <SkeletonBox className="mt-3 h-7 w-40" />
          <SkeletonBox className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-xl border border-soga-400/40 bg-white p-4">
      <SkeletonBox className="h-4 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 border-t border-canvas-200 pt-3"
        >
          <SkeletonBox className="h-4 w-1/3" />
          <SkeletonBox className="h-4 w-1/5" />
          <SkeletonBox className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}
