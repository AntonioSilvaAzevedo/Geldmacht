'use client'

import { Suspense, use, useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownRight, ArrowUpRight, CalendarClock, CreditCard, Wallet } from 'lucide-react'

import { useInstitution } from '@/components/carteira/institution-context'
import { AccountSettingsMenu } from '@/components/carteira/AccountSettingsMenu'
import SummaryCard from '@/components/summary/SummaryCard'
import { SummarySkeleton } from '@/components/skeletons/SummarySkeleton'
import StatePanel from '@/components/StatePanel'
import { api, type FinancialSummary } from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

type SummaryResult =
  | { ok: true; summary: FinancialSummary }
  | { ok: false; error: string }

function loadSummary(institutionId?: number): Promise<SummaryResult> {
  return api
    .getSummary(institutionId ?? undefined)
    .then((summary) => ({ ok: true as const, summary }))
    .catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : 'Erro ao carregar o resumo.',
    }))
}

interface SummaryContentProps {
  promise: Promise<SummaryResult>
  institutionId: number | null
  displayName: string
  onReload: () => void
}

function SummaryContent({ promise, institutionId, displayName, onReload }: SummaryContentProps) {
  const router = useRouter()
  const res = use(promise)

  if (!res.ok) {
    return (
      <StatePanel
        variant="error"
        message={res.error}
        actionLabel="Tentar novamente"
        onAction={onReload}
      />
    )
  }

  const summary = res.summary
  const count = summary.active_installments_count

  const cards = [
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="text-[15px] font-medium text-[var(--text-secondary)]">
          {summary.period_label}
        </div>
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
    </div>
  )
}

export default function InstitutionIndexPage() {
  const { institutionId, displayName, loading } = useInstitution()
  const [promise, setPromise] = useState(() => loadSummary(institutionId ?? undefined))
  const [, startTransition] = useTransition()

  const reload = useCallback(() => {
    startTransition(() => setPromise(loadSummary(institutionId ?? undefined)))
  }, [institutionId])

  if (loading) return null

  return (
    <Suspense fallback={<SummarySkeleton />}>
      <SummaryContent
        promise={promise}
        institutionId={institutionId}
        displayName={displayName}
        onReload={reload}
      />
    </Suspense>
  )
}
