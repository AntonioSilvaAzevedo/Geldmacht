import Link from 'next/link'

import { SectionLabel } from '@/components/carteira/resumo/section-label'
import { ResumoRow } from '@/components/carteira/resumo/resumo-row'
import { ACCOUNT_TYPE_LABELS } from '@/lib/carteira/account-type-labels'
import type { BankAccountConfig } from '@/lib/api'

export interface AccountsSectionProps {
  accounts: BankAccountConfig[]
}

export function AccountsSection({ accounts }: AccountsSectionProps) {
  if (accounts.length === 0) return null

  return (
    <div className="mb-2.5 overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--surface-card)]">
      <SectionLabel label="Contas bancárias" />
      {accounts.map((account, index) => (
        <ResumoRow key={account.id} last={index === accounts.length - 1}>
          <div>
            <div className="mb-[3px] flex items-center gap-2">
              <span className="text-sm font-semibold tracking-[-0.01em]">
                {account.name}
              </span>
              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-[0.05em] text-[var(--text-secondary)] ring-1 ring-white/[0.09] ring-inset">
                {ACCOUNT_TYPE_LABELS[account.account_type] ?? account.account_type}
              </span>
              {!account.is_active && (
                <span className="text-[9px] font-bold tracking-[0.05em] text-[var(--amber-400)]">
                  INATIVA
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/home/upload?type=bank_statement&bankAccountId=${account.id}`}
            className="text-xs text-[var(--text-secondary)] no-underline"
          >
            OFX
          </Link>
        </ResumoRow>
      ))}
    </div>
  )
}
