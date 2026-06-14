import { AccountsSection } from '@/components/carteira/resumo/accounts-section'
import { CardsSection } from '@/components/carteira/resumo/cards-section'
import { QuickActions } from '@/components/carteira/resumo/quick-actions'
import { StatsSection } from '@/components/carteira/resumo/stats-section'
import { SummaryStrip } from '@/components/carteira/resumo/summary-strip'
import type { BankAccountConfig, CardDashboard, CreditCardConfig } from '@/lib/api'

export interface ResumoTabProps {
  accounts: BankAccountConfig[]
  cards: CreditCardConfig[]
  dashboards: Map<number, CardDashboard>
  displayName: string
}

export function ResumoTab({
  accounts,
  cards,
  dashboards,
  displayName,
}: ResumoTabProps) {
  return (
    <div>
      <SummaryStrip accounts={accounts} cards={cards} dashboards={dashboards} />
      <AccountsSection accounts={accounts} />
      <CardsSection cards={cards} dashboards={dashboards} />
      <StatsSection displayName={displayName} />
      <QuickActions />
    </div>
  )
}
