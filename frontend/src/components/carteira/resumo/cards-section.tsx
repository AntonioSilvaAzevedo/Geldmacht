import Link from 'next/link'

import { SectionLabel } from '@/components/carteira/resumo/section-label'
import { ResumoRow } from '@/components/carteira/resumo/resumo-row'
import type { CardDashboard, CreditCardConfig } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

export interface CardsSectionProps {
  cards: CreditCardConfig[]
  dashboards: Map<number, CardDashboard>
}

export function CardsSection({ cards, dashboards }: CardsSectionProps) {
  if (cards.length === 0) return null

  return (
    <div className="mb-2.5 overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--surface-card)]">
      <SectionLabel label="Cartões de crédito" />
      {cards.map((card, index) => {
        const invoice =
          dashboards.get(card.id)?.latest_invoice?.computed_total ?? 0

        return (
          <ResumoRow key={card.id} last={index === cards.length - 1}>
            <div>
              <div className="mb-[3px] text-sm font-semibold tracking-[-0.01em]">
                {card.name}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Fecha {card.closing_day} · Vence {card.due_day}
                {card.credit_limit != null && (
                  <span className="ml-1.5">
                    · Limite {formatCurrency(card.credit_limit)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="text-right">
                <div className="font-[family-name:var(--font-mono)] text-[13px] font-semibold text-[var(--red-400)]">
                  {formatCurrency(invoice)}
                </div>
                <div className="mt-px text-[10px] text-[var(--text-muted)]">
                  fatura
                </div>
              </div>
              <Link
                href={`/home/cartao/${card.id}`}
                className="text-xs text-[var(--blue-400)] no-underline"
              >
                Faturas →
              </Link>
            </div>
          </ResumoRow>
        )
      })}
    </div>
  )
}
