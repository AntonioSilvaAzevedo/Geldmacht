'use client'

import { ResumoTab } from '@/components/carteira/resumo/resumo-tab'
import { useInstitution } from '@/components/carteira/institution-context'

export default function InstitutionResumoPage() {
  const { accounts, cards, dashboards, displayName } = useInstitution()

  return (
    <ResumoTab
      accounts={accounts}
      cards={cards}
      dashboards={dashboards}
      displayName={displayName}
    />
  )
}
