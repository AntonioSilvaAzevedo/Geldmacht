import { Skeleton } from '@/components/ui/skeleton'

function InvoiceGroupSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface-1)]">
      <div className="flex items-center gap-3 px-5 py-4">
        <Skeleton className="size-9 shrink-0 rounded-[10px]" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1.5 h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-20 shrink-0" />
        <Skeleton className="size-4 shrink-0" />
      </div>
    </div>
  )
}

export function InvoiceDetailSkeleton() {
  return (
    <div>
      <header className="mb-5 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-16" />
      </header>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <InvoiceGroupSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
