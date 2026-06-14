import { cn } from '@/lib/utils'

interface SegmentedControlProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
  size?: 'sm' | 'md'
  fullWidth?: boolean
  className?: string
}

export function SegmentedControl({
  tabs,
  active,
  onChange,
  size = 'md',
  fullWidth = false,
  className,
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        'gap-1',
        size === 'md'
          ? 'inline-flex rounded-[10px] bg-[var(--surface-2)] p-[3px]'
          : 'inline-flex rounded-[9px] bg-[var(--surface-2)] p-[2px]',
        !fullWidth && 'self-start',
        fullWidth && 'flex w-full',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={cn(
              'cursor-pointer border-none font-[family-name:var(--font-sans)] whitespace-nowrap',
              'outline-none transition-[background,color,box-shadow] duration-[120ms] ease-out',
              '[-webkit-tap-highlight-color:transparent]',
              'focus-visible:ring-[3px] focus-visible:ring-[rgba(10,132,255,0.45)]',
              size === 'md'
                ? 'rounded-[8px] px-3.5 py-1.5 text-[13px]/[1]'
                : 'rounded-[7px] px-[11px] py-1 text-[12px]/[1]',
              fullWidth && 'flex-1 text-center',
              isActive
                ? 'bg-[var(--surface-0)] font-semibold text-[var(--text-primary)] shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
                : 'bg-transparent font-normal text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}
