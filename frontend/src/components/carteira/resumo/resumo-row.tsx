'use client'

import { useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface ResumoRowProps {
  children: ReactNode
  last: boolean
}

export function ResumoRow({ children, last }: ResumoRowProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'flex items-center justify-between px-4 py-[13px] transition-[background] duration-100',
        !last && 'border-b border-white/[0.07]',
        hovered ? 'bg-white/[0.025]' : 'bg-transparent',
      )}
    >
      {children}
    </div>
  )
}
