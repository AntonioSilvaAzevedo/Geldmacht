'use client'

import { useEffect, useState } from 'react'

import { ExtratoPanel } from '@/components/carteira/extrato/extrato-panel'
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
    <ExtratoPanel
      accounts={accounts}
      activeAccountId={activeAccountId}
      setActiveAccountId={setActiveAccountId}
    />
  )
}
