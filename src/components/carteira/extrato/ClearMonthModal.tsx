'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormSheet } from '@/components/ui/FormSheet';

interface ClearMonthModalProps {
  monthLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ClearMonthModal({ monthLabel, onClose, onConfirm }: ClearMonthModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!confirmed || clearing) return;
    setClearing(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao limpar os lançamentos.');
      setClearing(false);
    }
  }

  return (
    <FormSheet
      onClose={onClose}
      title="Limpar lançamentos do mês"
      titleId="clear-month-modal-title"
      titleIcon={
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--red)]/15 text-[var(--red)]">
          <AlertTriangle className="size-[18px]" />
        </span>
      }
      maxWidthClass="sm:max-w-[460px]"
      zClassName="z-[210]"
      closeDisabled={clearing}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={clearing}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={!confirmed}
            loading={clearing}
          >
            Limpar lançamentos
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">
          Esta ação não poderá ser desfeita.
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Todos os lançamentos manuais e importados de{' '}
          <span className="font-semibold text-[var(--text-primary)]">{monthLabel}</span> nesta conta
          serão removidos.
        </p>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] px-3.5 py-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--red)]"
          />
          <span className="text-[13px] leading-snug text-[var(--text-primary)]">
            Entendo que os lançamentos deste mês serão perdidos e desejo limpá-los.
          </span>
        </label>

        {error && <p className="text-[13px] text-[var(--red)]">{error}</p>}
      </div>
    </FormSheet>
  );
}
