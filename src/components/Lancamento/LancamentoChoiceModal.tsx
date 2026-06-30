'use client';

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Pencil, Upload } from 'lucide-react';

import { FormSheet } from '@/components/ui/FormSheet';

interface LancamentoChoiceModalProps {
  onManual: () => void;
  onClose: () => void;
}

export function LancamentoChoiceModal({ onManual, onClose }: LancamentoChoiceModalProps) {
  const router = useRouter();

  function goImport(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <FormSheet
      onClose={onClose}
      title="Adicionar"
      titleId="lancamento-choice-title"
      maxWidthClass="sm:max-w-[420px]"
      bodyClassName="flex flex-col gap-2 p-4"
    >
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
        subtitle="Arquivo .ofx (preferencial) ou PDF do cartão"
        onClick={() => goImport('/home/upload?type=credit_card')}
      />
    </FormSheet>
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
