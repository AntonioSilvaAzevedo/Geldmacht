'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useInstitution } from '@/components/carteira/institution-context'
import { cn } from '@/lib/utils'

export interface InstitutionNavProps {
  className?: string
}

export function InstitutionNav({ className }: InstitutionNavProps) {
  const pathname = usePathname()
  const { slug, accounts, cards } = useInstitution()

  const tabs = [
    {
      id: 'resumo',
      label: 'Resumo',
      href: `/home/carteira/${slug}`,
      active: pathname === `/home/carteira/${slug}`,
    },
    ...(accounts.length > 0
      ? [{
          id: 'conta-corrente',
          label: 'Conta corrente',
          href: `/home/carteira/${slug}/extrato`,
          active: pathname.endsWith('/extrato'),
        }]
      : []),
    ...(cards.length > 0
      ? [{
          id: 'cartao-credito',
          label: 'Cartão de crédito',
          href: `/home/carteira/${slug}/cartao/faturas`,
          active: pathname.includes('/cartao/faturas'),
        }]
      : []),
  ]

  const activeIndex = tabs.findIndex((tab) => tab.active)

  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)
  const [animate, setAnimate] = useState(false)

  const measure = useCallback(() => {
    const container = containerRef.current
    const el = tabRefs.current[activeIndex]
    if (!container || !el) {
      setIndicator(null)
      return
    }
    const containerRect = container.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    setIndicator({ left: rect.left - containerRect.left, width: rect.width })
  }, [activeIndex])

  useEffect(() => {
    measure()
  }, [measure, tabs.length])

  useEffect(() => {
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  useEffect(() => {
    if (!indicator || animate) return
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [indicator, animate])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-flex gap-1 self-center rounded-[10px] bg-[var(--surface-2)] p-[3px]',
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className="absolute bottom-[3px] left-0 top-[3px] rounded-[8px] bg-[var(--surface-0)] shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
            transition: animate
              ? 'transform 240ms cubic-bezier(0.22,1,0.36,1), width 240ms cubic-bezier(0.22,1,0.36,1)'
              : 'none',
          }}
        />
      )}
      {tabs.map((tab, index) => (
        <Link
          key={tab.id}
          href={tab.href}
          ref={(el) => { tabRefs.current[index] = el }}
          className={cn(
            'relative z-[1] cursor-pointer rounded-[8px] px-3.5 py-1.5 text-[13px]/[1] no-underline outline-none transition-[color] duration-150 ease-out',
            'focus-visible:ring-[3px] focus-visible:ring-[rgba(10,132,255,0.45)]',
            tab.active
              ? 'font-semibold text-[var(--text-primary)]'
              : 'font-normal text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
