'use client'

import { RefreshCw } from 'lucide-react'
import { useParams } from 'next/navigation'
import type { ReactNode } from 'react'

import {
  InstitutionProvider,
  useInstitution,
} from '@/components/carteira/institution-context'
import { InstitutionNav } from '@/components/carteira/institution-nav'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { PageBreadcrumb } from '@/components/ui/breadcrumb'
import { useIsMobile } from '@/hooks/useIsMobile'

function InstitutionLayoutContent({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  const px = isMobile ? 14 : 32
  const padding = isMobile ? '0 14px 32px' : '0 32px 40px'
  const { displayName, loading, error, refetch } = useInstitution()

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <LoadingSpinner />
      </main>
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
    <>
      <PageBreadcrumb
        items={[{ href: '/home/carteira', label: 'Carteira' }]}
        currentPage={displayName}
        px={px}
      />
      <main
        className="mx-auto flex w-full max-w-[860px] flex-1 flex-col"
        style={{ padding }}
      >
        <InstitutionNav className="mb-5" />
        {children}
      </main>
    </>
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
