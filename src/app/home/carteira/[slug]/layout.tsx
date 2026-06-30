'use client'

import { RefreshCw } from 'lucide-react'
import { useParams } from 'next/navigation'
import type { ReactNode } from 'react'

import {
  InstitutionProvider,
  useInstitution,
} from '@/components/carteira/institution-context'
import { InstitutionNav } from '@/components/carteira/institution-nav'
import { InstitutionNavSkeleton } from '@/components/skeletons/InstitutionNavSkeleton'
import { SummarySkeleton } from '@/components/skeletons/SummarySkeleton'
import { Button } from '@/components/ui/button'

function ShellMain({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  return (
    <main className="institution-shell mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col">
      {nav}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3.5 pb-[calc(56px+env(safe-area-inset-bottom)+12px)] sm:px-8 sm:pb-10">
        {children}
      </div>
    </main>
  )
}

function InstitutionLayoutContent({ children }: { children: ReactNode }) {
  const { loading, error, refetch } = useInstitution()

  if (loading) {
    return (
      <ShellMain nav={<InstitutionNavSkeleton className="mb-5 mt-5 shrink-0 sm:mt-6" />}>
        <SummarySkeleton />
      </ShellMain>
    )
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="mb-3 text-sm text-[var(--red-400)]">{error}</p>
        <Button
          variant="ghost"
          type="button"
          size="sm"
          onClick={refetch}
          className="inline-flex gap-2"
        >
          <RefreshCw size={14} /> Tentar novamente
        </Button>
      </main>
    )
  }

  return (
    <ShellMain nav={<InstitutionNav className="mb-5 mt-5 shrink-0 sm:mt-6" />}>
      {children}
    </ShellMain>
  )
}

export default function InstitutionLayout({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>()

  return (
    <InstitutionProvider slug={slug ?? ''}>
      <InstitutionLayoutContent>{children}</InstitutionLayoutContent>
    </InstitutionProvider>
  )
}
