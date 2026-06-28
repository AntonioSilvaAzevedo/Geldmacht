import { Skeleton } from '@/components/ui/skeleton'

const FILTER_WIDTHS = ['w-16', 'w-20', 'w-20', 'w-28', 'w-20']

function IndicatorCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 shrink-0 rounded-[10px]" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <Skeleton className="mt-2.5 h-5 w-24" />
      <Skeleton className="mt-1.5 h-2.5 w-20" />
    </div>
  )
}

function AccordionSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface-1)]">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1.5 h-3 w-28" />
        </div>
        <Skeleton className="size-4 shrink-0" />
      </div>
      <div className="divide-y divide-[var(--separator)] border-t border-[var(--separator)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="mt-1.5 h-3 w-24" />
            </div>
            <Skeleton className="h-3.5 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExtratoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <IndicatorCardSkeleton key={i} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTER_WIDTHS.map((w, i) => (
          <Skeleton key={i} className={`h-8 rounded-full ${w}`} />
        ))}
      </div>
      <AccordionSkeleton />
    </div>
  )
}
