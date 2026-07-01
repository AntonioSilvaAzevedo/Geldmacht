'use client';

import { useState } from 'react';

import { ClearMonthModal } from '@/components/carteira/extrato/ClearMonthModal';
import { api } from '@/lib/api';

interface ClearMonthActionProps {
  accountId: number;
  month: string;
  monthLabel: string;
  onCleared: () => void;
}

export function ClearMonthAction({ accountId, month, monthLabel, onCleared }: ClearMonthActionProps) {
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    await api.clearMonthTransactions(accountId, month);
    setOpen(false);
    onCleared();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer self-start text-[12px] font-medium text-[var(--text-muted)] underline decoration-dotted underline-offset-2 outline-none transition-colors duration-[120ms] hover:text-[var(--red-400)] focus-visible:ring-[3px] focus-visible:ring-[rgba(10,132,255,0.45)]"
      >
        Limpar lançamentos do mês
      </button>
      {open && (
        <ClearMonthModal
          monthLabel={monthLabel}
          onClose={() => setOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
