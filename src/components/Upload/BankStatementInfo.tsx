import { type BankAccountConfig } from '@/lib/api';

interface BankStatementInfoProps {
  bankAccount: BankAccountConfig | null | undefined;
}

export function BankStatementInfo({ bankAccount }: BankStatementInfoProps) {
  return (
    <div className="mb-3.5 flex shrink-0 flex-col gap-1.5 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        Conta corrente de destino
      </span>
      {bankAccount ? (
        <span className="text-[13px] text-[var(--text-primary)]">
          {bankAccount.name}
          {bankAccount.institution ? ` — ${bankAccount.institution}` : ''}
        </span>
      ) : (
        <span className="text-[13px] text-[var(--red-400)]">Nenhuma conta selecionada.</span>
      )}
    </div>
  );
}
