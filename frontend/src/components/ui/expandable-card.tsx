'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ExpandableCardProps {
  title: ReactNode
  value?: ReactNode
  leading?: ReactNode
  subtitle?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function ExpandableCard({
  title,
  value,
  leading,
  subtitle,
  defaultOpen = false,
  children,
  className,
}: ExpandableCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface-1)]',
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left outline-none transition-colors duration-150 hover:bg-white/[0.02] focus-visible:ring-[3px] focus-visible:ring-[rgba(10,132,255,0.45)]"
      >
        {leading}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            {title}
          </div>
          {subtitle != null && (
            <div className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{subtitle}</div>
          )}
        </div>
        {value != null && (
          <div className="shrink-0 font-[family-name:var(--font-mono)] text-[15px] font-bold text-[var(--text-primary)]">
            {value}
          </div>
        )}
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="max-h-[55vh] overflow-y-auto overscroll-contain border-t border-[var(--separator)]">
          {children}
        </div>
      )}
    </div>
  )
}
