'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownRight, ArrowUpRight, CalendarClock, CreditCard, Wallet } from 'lucide-react'

import { useInstitution } from '@/components/carteira/institution-context'
import { AccountSettingsMenu } from '@/components/carteira/AccountSettingsMenu'
import LoadingSpinner from '@/components/LoadingSpinner'
import SummaryCard from '@/components/summary/SummaryCard'
import { api, type FinancialSummary } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

export default function InstitutionIndexPage() {
  const router = useRouter()
  const { institutionId, displayName, loading } = useInstitution()
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      setSummary(await api.getSummary(institutionId ?? undefined))
    } finally {
      setSummaryLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  if (loading) return null

  const count = summary?.active_installments_count ?? 0

  const cards = summary
    ? [
        {
          label: 'Saldo disponível',
          value: formatCurrency(summary.available_balance),
          helper: 'Conta corrente',
          icon: <Wallet size={16} />,
          accent: 'var(--blue)',
        },
        {
          label: 'Futuro comprometido',
          value: formatCurrency(summary.future_committed_amount),
          helper:
            summary.future_committed_amount > 0
              ? 'Próximos meses'
              : 'Nenhum valor futuro comprometido',
          icon: <CalendarClock size={16} />,
          accent: 'var(--orange)',
        },
        {
          label: 'Parcelamentos ativos',
          value: `${count} ${count === 1 ? 'compra' : 'compras'}`,
          helper: count > 0 ? 'Cartão de crédito' : 'Nenhum parcelamento ativo',
          icon: <CreditCard size={16} />,
          accent: 'var(--purple)',
        },
        {
          label: 'Receitas do mês',
          value: formatCurrency(summary.monthly_income),
          helper: summary.monthly_income > 0 ? 'Entradas confirmadas' : 'Nenhuma entrada neste mês',
          icon: <ArrowUpRight size={16} />,
          accent: 'var(--green)',
        },
        {
          label: 'Despesas do mês',
          value: formatCurrency(summary.monthly_expenses),
          helper: summary.monthly_expenses > 0 ? 'Saídas confirmadas' : 'Nenhuma saída neste mês',
          icon: <ArrowDownRight size={16} />,
          accent: 'var(--red)',
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {summary && (
          <div className="text-[15px] font-medium text-[var(--text-secondary)]">
            {summary.period_label}
          </div>
        )}
        {institutionId != null && (
          <div className="ml-auto">
            <AccountSettingsMenu
              institutionId={institutionId}
              institutionName={displayName}
              onDeleted={() => router.push('/home/carteira')}
            />
          </div>
        )}
      </div>

      {summaryLoading && !summary ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <SummaryCard
              key={c.label}
              label={c.label}
              value={c.value}
              helper={c.helper}
              icon={c.icon}
              accent={c.accent}
            />
          ))}
        </div>
      )}
    </div>
  )
}
