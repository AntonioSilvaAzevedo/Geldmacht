'use client';

import { Pencil } from 'lucide-react';

import { ACCOUNT_TYPE_LABELS } from '@/lib/carteira/account-type-labels';
import type { BankAccountConfig } from '@/lib/api';

interface ContaRowProps {
  account: BankAccountConfig;
  onEdit: (account: BankAccountConfig) => void;
}

export function ContaRow({ account, onEdit }: ContaRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3.5">
      <div
        className="size-2 shrink-0 rounded-full"
        style={{ background: account.is_active ? 'var(--green-400)' : 'rgba(255,255,255,0.2)' }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">{account.name}</span>
          {account.is_main && (
            <span className="rounded-[5px] border border-[rgba(10,132,255,0.3)] bg-[rgba(10,132,255,0.12)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--blue-400)]">
              Principal
            </span>
          )}
          {!account.is_active && (
            <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--amber-400)]">
              Inativa
            </span>
          )}
        </div>
        <div className="mt-1 text-[12px] text-[var(--text-secondary)]">
          {ACCOUNT_TYPE_LABELS[account.account_type] ?? account.account_type}
          {account.institution && ` · ${account.institution}`}
        </div>
      </div>
      <button
        type="button"
        aria-label={`Editar ${account.name}`}
        onClick={() => onEdit(account)}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-[var(--text-primary)]"
      >
        <Pencil className="size-4" />
      </button>
    </div>
  );
}
