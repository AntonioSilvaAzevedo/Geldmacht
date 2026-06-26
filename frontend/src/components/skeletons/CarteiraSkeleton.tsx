import { Skeleton } from '@/components/ui/skeleton'

function InstitutionCardSkeleton() {
  return (
    <div className="rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[var(--surface-1)] p-5">
      <div className="mb-4 flex items-start gap-3">
        <Skeleton className="size-[42px] shrink-0 rounded-[12px]" />
        <div className="min-w-0 flex-1 pt-0.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-11 rounded-[12px]" />
        <Skeleton className="h-11 rounded-[12px]" />
      </div>
      <div className="mt-3.5 flex justify-end">
        <Skeleton className="h-3.5 w-20" />
      </div>
    </div>
  )
}

export function CarteiraSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: 12,
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <InstitutionCardSkeleton key={i} />
      ))}
    </div>
  )
}
