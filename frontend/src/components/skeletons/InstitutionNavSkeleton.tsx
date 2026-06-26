import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const WIDTHS = ['w-16', 'w-28', 'w-32']

export function InstitutionNavSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex gap-1 self-center rounded-[10px] bg-[var(--surface-2)] p-[3px]',
        className,
      )}
    >
      {WIDTHS.map((w) => (
        <Skeleton key={w} className={cn('h-[26px] rounded-[8px]', w)} />
      ))}
    </div>
  )
}
