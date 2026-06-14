'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useInstitution } from '@/components/carteira/institution-context'
import { cn } from '@/lib/utils'

export interface InstitutionNavProps {
  className?: string
}

export function InstitutionNav({ className }: InstitutionNavProps) {
  const pathname = usePathname()
  const { slug, accounts } = useInstitution()
  const base = `/home/carteira/${slug}`

  const tabs = [
    { id: 'resumo', label: 'Resumo', href: `${base}/resumo` },
    ...(accounts.length > 0
      ? [{ id: 'extrato', label: 'Extrato', href: `${base}/extrato` }]
      : []),
  ]

  return (
    <div
      className={cn(
        'inline-flex gap-1 self-start rounded-[10px] bg-[var(--surface-2)] p-[3px]',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = pathname.endsWith(`/${tab.id}`)
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'rounded-[8px] px-3.5 py-1.5 text-[13px]/[1] no-underline outline-none transition-[background,color,box-shadow] duration-[120ms] ease-out',
              'focus-visible:ring-[3px] focus-visible:ring-[rgba(10,132,255,0.45)]',
              isActive
                ? 'bg-[var(--surface-0)] font-semibold text-[var(--text-primary)] shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
                : 'bg-transparent font-normal text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
