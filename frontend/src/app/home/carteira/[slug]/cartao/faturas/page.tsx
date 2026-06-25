'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useInstitution } from '@/components/carteira/institution-context'
import { CreditCardInvoiceCard } from '@/components/Cards/CreditCardInvoiceCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatePanel from '@/components/StatePanel'
import { api, type AnnualInvoiceMonth } from '@/lib/api'

export default function InstitutionCartaoFaturasPage() {
  const { slug, cards } = useInstitution()
  const card = cards[0]

  const [months, setMonths] = useState<AnnualInvoiceMonth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!card) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      setMonths(await api.getCardAnnualInvoices(card.id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [card])

  useEffect(() => { void load() }, [load])

  const year = useMemo(() => {
    const first = months[0]?.due_month
    return first ? Number(first.slice(0, 4)) : new Date().getFullYear()
  }, [months])

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
  if (error) {
    return (
      <StatePanel
        variant="error"
        title="Não foi possível carregar as faturas."
        message="Tente novamente."
        actionLabel="Tentar novamente"
        onAction={() => void load()}
      />
    )
  }

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

      {months.length === 0 ? (
        <StatePanel
          variant="empty"
          title="Nenhuma fatura ou previsão."
          message="Importe uma fatura ou cadastre uma compra parcelada para ver os meses aqui."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map((m) => (
            <CreditCardInvoiceCard
              key={m.due_month}
              month={m.label}
              amount={m.total}
              predicted={m.predicted}
              href={
                m.invoice_id
                  ? `/home/carteira/${slug}/cartao/faturas/${m.invoice_id}`
                  : `/home/carteira/${slug}/cartao/faturas/prevista/${m.due_month}`
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
