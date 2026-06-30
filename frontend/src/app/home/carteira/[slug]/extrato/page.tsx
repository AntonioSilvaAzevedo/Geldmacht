'use client'

import { Suspense, useEffect, useState } from 'react'

import { ExtratoPanel } from '@/components/carteira/extrato/extrato-panel'
import { ExtratoSkeleton } from '@/components/skeletons/ExtratoSkeleton'
import { useInstitution } from '@/components/carteira/institution-context'

export default function InstitutionExtratoPage() {
  const { accounts } = useInstitution()
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null)

  useEffect(() => {
    if (accounts.length === 0) {
      setActiveAccountId(null)
      return
    }

    if (
      activeAccountId == null ||
      !accounts.some((account) => account.id === activeAccountId)
    ) {
      setActiveAccountId(accounts[0].id)
    }
  }, [accounts, activeAccountId])

  return (
    <Suspense fallback={<ExtratoSkeleton />}>
      <ExtratoPanel
        accounts={accounts}
        activeAccountId={activeAccountId}
        setActiveAccountId={setActiveAccountId}
      />
    </Suspense>
  )
}
