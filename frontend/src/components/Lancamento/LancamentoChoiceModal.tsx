'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Pencil, Upload, X } from 'lucide-react';

interface LancamentoChoiceModalProps {
  onManual: () => void;
  onClose: () => void;
}

export function LancamentoChoiceModal({ onManual, onClose }: LancamentoChoiceModalProps) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function goImport(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lancamento-choice-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 [animation:gm-fade-in_0.18s_ease-out] sm:items-center sm:p-5"
    >
      <div className="flex w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border-default)] bg-[var(--surface-card)] [animation:gm-modal-slide-in_0.24s_cubic-bezier(0.2,0.8,0.2,1)] sm:max-w-[420px] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--separator)] px-5 py-4">
          <h2 id="lancamento-choice-title" className="text-[17px] font-bold tracking-[-0.01em]">
            Adicionar
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

        <div className="flex flex-col gap-2 p-4">
          <ChoiceButton
            icon={<Pencil className="size-[18px]" />}
            title="Lançamento manual"
            subtitle="Registrar uma entrada ou saída na conta"
            onClick={() => { onClose(); onManual(); }}
          />
          <ChoiceButton
            icon={<Upload className="size-[18px]" />}
            title="Importar extrato"
            subtitle="Arquivo .ofx/.qfx da conta corrente"
            onClick={() => goImport('/home/upload?type=bank_statement')}
          />
          <ChoiceButton
            icon={<CreditCard className="size-[18px]" />}
            title="Importar fatura"
            subtitle="PDF da fatura do cartão de crédito"
            onClick={() => goImport('/home/upload?type=credit_card')}
          />
        </div>
      </div>
    </div>
  );
}

interface ChoiceButtonProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function ChoiceButton({ icon, title, subtitle, onClick }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-2)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--text-secondary)]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</span>
        <span className="text-[12px] text-[var(--text-tertiary)]">{subtitle}</span>
      </span>
    </button>
  );
}
