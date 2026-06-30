import { Skeleton } from '@/components/ui/skeleton'

function SummaryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-9 shrink-0 rounded-[10px]" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="mt-3 h-6 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  )
}

export function SummarySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="ml-auto size-8 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SummaryCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
