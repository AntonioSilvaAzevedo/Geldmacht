'use client'

import Link from 'next/link'
import { useState } from 'react'

import { cn } from '@/lib/utils'

export function QuickActions() {
  const [hoverImport, setHoverImport] = useState(false)
  const [hoverNew, setHoverNew] = useState(false)

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Link
        href="/home/lancamentos/novo"
        onMouseEnter={() => setHoverNew(true)}
        onMouseLeave={() => setHoverNew(false)}
        className={cn(
          'rounded-xl bg-[var(--blue-400)] px-[13px] py-[13px] text-center text-sm font-bold tracking-[-0.01em] text-white no-underline transition-opacity duration-[120ms]',
          hoverNew && 'opacity-[0.88]',
        )}
      >
        + Novo lançamento
      </Link>
      <Link
        href="/home/upload"
        onMouseEnter={() => setHoverImport(true)}
        onMouseLeave={() => setHoverImport(false)}
        className={cn(
          'rounded-xl border border-white/10 px-[13px] py-[13px] text-center text-sm font-medium tracking-[-0.01em] no-underline transition-[background,color] duration-[120ms]',
          hoverImport
            ? 'bg-[#3A3A3C] text-white'
            : 'bg-[var(--surface-2)] text-[var(--text-secondary)]',
        )}
      >
        Importar extrato
      </Link>
    </div>
  )
}
