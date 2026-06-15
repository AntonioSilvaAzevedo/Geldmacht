'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useInstitution } from '@/components/carteira/institution-context'
import { CreditCardInvoiceCard } from '@/components/Cards/CreditCardInvoiceCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatePanel from '@/components/StatePanel'
import { api, type CardInvoice } from '@/lib/api'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function InstitutionCartaoFaturasPage() {
  const { slug, cards } = useInstitution()
  const card = cards[0]

  const [invoices, setInvoices] = useState<CardInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!card) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setInvoices(await api.getCardInvoices(card.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar faturas.')
    } finally {
      setLoading(false)
    }
  }, [card])

  useEffect(() => { void load() }, [load])

  const year = useMemo(() => {
    const months = invoices.map((i) => i.due_month).filter(Boolean).sort()
    const latest = months[months.length - 1]
    return latest ? Number(latest.slice(0, 4)) : new Date().getFullYear()
  }, [invoices])

  const monthCards = useMemo(() => MONTHS.map((label, idx) => {
    const key = `${year}-${String(idx + 1).padStart(2, '0')}`
    const invoice = invoices.find((i) => i.due_month === key)
    const amount = invoice ? (invoice.total_amount ?? invoice.computed_total) : 0
    const href = invoice
      ? `/home/carteira/${slug}/cartao/faturas/${invoice.id}`
      : undefined
    return { label, amount, href }
  }), [invoices, year, slug])

  if (!card) {
    return <StatePanel variant="error" message="Nenhum cartão nesta instituição." />
  }
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }
  if (error) return <StatePanel variant="error" message={error} />

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          Faturas
        </h1>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-[15px] text-[var(--text-secondary)]">
          {year}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {monthCards.map((m) => (
          <CreditCardInvoiceCard
            key={m.label}
            month={m.label}
            amount={m.amount}
            href={m.href}
          />
        ))}
      </div>
    </div>
  )
}
