import type { BankAccountConfig, CardDashboard, CreditCardConfig } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export interface SummaryStripProps {
  accounts: BankAccountConfig[]
  cards: CreditCardConfig[]
  dashboards: Map<number, CardDashboard>
}

export function SummaryStrip({ accounts, cards, dashboards }: SummaryStripProps) {
  const totalFaturas = cards.reduce(
    (sum, card) =>
      sum + (dashboards.get(card.id)?.latest_invoice?.computed_total ?? 0),
    0,
  )
  const avgMensal = cards.reduce(
    (sum, card) => sum + (dashboards.get(card.id)?.monthly_average ?? 0),
    0,
  )

  const tiles = [
    {
      label: 'Contas',
      value: String(accounts.length),
      color: 'var(--text-primary)',
      mono: false,
    },
    {
      label: 'Faturas abertas',
      value: formatCurrency(totalFaturas),
      color: 'var(--red-400)',
      mono: true,
    },
    {
      label: 'Média mensal',
      value: formatCurrency(avgMensal),
      color: 'var(--text-primary)',
      mono: true,
    },
  ]

  if (cards.length === 0 && accounts.length === 0) return null

  return (
    <div
      className="mb-3 grid overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--surface-card)]"
      style={{ gridTemplateColumns: `repeat(${tiles.length}, 1fr)` }}
    >
      {tiles.map((tile, index) => (
        <div
          key={tile.label}
          className={cn(
            'px-4 py-3.5 text-center',
            index < tiles.length - 1 && 'border-r border-white/[0.06]',
          )}
        >
          <div className="mb-[7px] text-[10px] font-semibold tracking-[0.07em] text-[var(--text-muted)] uppercase">
            {tile.label}
          </div>
          <div
            className="text-sm font-bold tracking-[-0.02em]"
            style={{
              fontFamily: tile.mono ? 'var(--font-mono)' : 'inherit',
              color: tile.color,
            }}
          >
            {tile.value}
          </div>
        </div>
      ))}
    </div>
  )
}
