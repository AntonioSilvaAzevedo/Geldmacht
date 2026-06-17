'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

import CreditCardForm from '@/components/Cards/CreditCardForm';
import type { CreditCardConfig } from '@/lib/api';

export type CardFormData = Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'> & {
  credit_limit: number | null;
};

interface CardFormModalProps {
  onClose: () => void;
  onSubmit: (payload: CardFormData) => Promise<void>;
  institutionName?: string;
}

export function CardFormModal({ onClose, onSubmit, institutionName }: CardFormModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-form-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 [animation:gm-fade-in_0.18s_ease-out] sm:items-center sm:p-5"
    >
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border-default)] bg-[var(--surface-card)] [animation:gm-modal-slide-in_0.24s_cubic-bezier(0.2,0.8,0.2,1)] sm:max-w-[480px] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--separator)] px-5 py-4">
          <h2 id="card-form-modal-title" className="text-[17px] font-bold tracking-[-0.01em]">
            Cadastrar cartão
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">
          <CreditCardForm
            submitLabel="Cadastrar cartão"
            onSubmit={onSubmit}
            onCancel={onClose}
            initial={institutionName ? { institution: institutionName } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
