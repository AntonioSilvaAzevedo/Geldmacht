import { Skeleton } from '@/components/ui/skeleton'

function InvoiceCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface-1)] px-5 py-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-2 h-6 w-28" />
    </div>
  )
}

export function InvoiceListSkeleton() {
  return (
    <div>
      <header className="mb-5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-16" />
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <InvoiceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
