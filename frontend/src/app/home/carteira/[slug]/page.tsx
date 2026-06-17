'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { CreditCard, Landmark, Plus, TrendingUp } from 'lucide-react'

import { useInstitution } from '@/components/carteira/institution-context'
import { BankAccountModal, type BankAccountModalData } from '@/components/carteira/BankAccountModal'
import { CardFormModal, type CardFormData } from '@/components/Cards/CardFormModal'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

type ActiveModal = 'conta' | 'cartao' | null

export default function InstitutionIndexPage() {
  const { slug, institutionId, displayName, accounts, cards, loading, refetch } = useInstitution()
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  async function handleCreateAccount(payload: BankAccountModalData) {
    await api.createBankAccount({
      ...payload,
      institution: displayName,
      institution_id: institutionId ?? undefined,
      currency: 'BRL',
      is_active: true,
    })
    setActiveModal(null)
    refetch()
  }

  async function handleCreateCard(payload: CardFormData) {
    await api.createCard({ ...payload, institution_id: institutionId ?? undefined })
    setActiveModal(null)
    refetch()
  }

  if (loading) return null

  return (
    <div className="flex flex-col gap-3">
      <ProductArea
        icon={<Landmark size={18} />}
        title="Conta corrente"
        count={accounts.length}
        href={`/home/carteira/${slug}/extrato`}
        emptyText="Nenhuma conta corrente cadastrada"
        actionLabel="Cadastrar conta corrente"
        onAction={() => setActiveModal('conta')}
      />
      <ProductArea
        icon={<CreditCard size={18} />}
        title="Cartão de crédito"
        count={cards.length}
        href={`/home/carteira/${slug}/cartao/faturas`}
        emptyText="Nenhum cartão de crédito cadastrado"
        actionLabel="Cadastrar cartão de crédito"
        onAction={() => setActiveModal('cartao')}
      />
      <ProductArea
        icon={<TrendingUp size={18} />}
        title="Investimentos"
        count={0}
        emptyText="Funcionalidade ainda não disponível"
        comingSoon
      />

      {activeModal === 'conta' && (
        <BankAccountModal
          institutionName={displayName}
          onClose={() => setActiveModal(null)}
          onSubmit={handleCreateAccount}
        />
      )}
      {activeModal === 'cartao' && (
        <CardFormModal
          institutionName={displayName}
          onClose={() => setActiveModal(null)}
          onSubmit={handleCreateCard}
        />
      )}
    </div>
  )
}

interface ProductAreaProps {
  icon: ReactNode
  title: string
  count: number
  href?: string
  emptyText: string
  actionLabel?: string
  onAction?: () => void
  comingSoon?: boolean
}

function ProductArea({ icon, title, count, href, emptyText, actionLabel, onAction, comingSoon }: ProductAreaProps) {
  return (
    <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
      <div className="mb-3 flex items-center gap-2 text-[var(--text-secondary)]">
        {icon}
        <span className="text-[13px] font-semibold uppercase tracking-[0.04em]">{title}</span>
      </div>
      {comingSoon ? (
        <p className="text-[13px] text-[var(--text-tertiary)]">{emptyText}</p>
      ) : count > 0 && href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--blue)] no-underline transition-opacity hover:opacity-[0.85]"
        >
          Ver {title.toLowerCase()} ({count})
        </Link>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-[13px] text-[var(--text-secondary)]">{emptyText}</p>
          {actionLabel && onAction && (
            <Button type="button" variant="outline" size="sm" onClick={onAction} className="inline-flex gap-1.5">
              <Plus size={14} /> {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
