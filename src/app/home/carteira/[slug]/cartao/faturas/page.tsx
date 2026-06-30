'use client'

import { Suspense, use, useCallback, useState, useTransition } from 'react'

import { useInstitution } from '@/components/carteira/institution-context'
import { CreditCardInvoiceCard } from '@/components/Cards/CreditCardInvoiceCard'
import { InvoiceListSkeleton } from '@/components/skeletons/InvoiceListSkeleton'
import StatePanel from '@/components/StatePanel'
import { api, type AnnualInvoiceMonth } from '@/lib/api'

type InvoicesResult =
  | { ok: true; months: AnnualInvoiceMonth[] }
  | { ok: false }

function loadInvoices(cardId: number): Promise<InvoicesResult> {
  return api
    .getCardAnnualInvoices(cardId)
    .then((months) => ({ ok: true as const, months }))
    .catch(() => ({ ok: false as const }))
}

interface FaturasContentProps {
  promise: Promise<InvoicesResult>
  slug: string
  onReload: () => void
}

function FaturasContent({ promise, slug, onReload }: FaturasContentProps) {
  const res = use(promise)

  if (!res.ok) {
    return (
      <StatePanel
        variant="error"
        title="Não foi possível carregar as faturas."
        message="Tente novamente."
        actionLabel="Tentar novamente"
        onAction={onReload}
      />
    )
  }

  const months = res.months
  const first = months[0]?.due_month
  const year = first ? Number(first.slice(0, 4)) : new Date().getFullYear()

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

export default function InstitutionCartaoFaturasPage() {
  const { slug, cards } = useInstitution()
  const card = cards[0]
  const [promise, setPromise] = useState<Promise<InvoicesResult>>(() =>
    card ? loadInvoices(card.id) : Promise.resolve({ ok: false }),
  )
  const [, startTransition] = useTransition()

  const reload = useCallback(() => {
    if (!card) return
    startTransition(() => setPromise(loadInvoices(card.id)))
  }, [card])

  if (!card) {
    return <StatePanel variant="error" message="Nenhum cartão nesta instituição." />
  }

  return (
    <Suspense fallback={<InvoiceListSkeleton />}>
      <FaturasContent promise={promise} slug={slug} onReload={reload} />
    </Suspense>
  )
}
