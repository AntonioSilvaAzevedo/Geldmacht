'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormSheet } from '@/components/ui/FormSheet';

interface DeleteAccountModalProps {
  institutionName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteAccountModal({ institutionName, onClose, onConfirm }: DeleteAccountModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!confirmed || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir a conta.');
      setDeleting(false);
    }
  }

  return (
    <FormSheet
      onClose={onClose}
      title="Excluir conta"
      titleId="delete-account-modal-title"
      titleIcon={
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--red)]/15 text-[var(--red)]">
          <AlertTriangle className="size-[18px]" />
        </span>
      }
      maxWidthClass="sm:max-w-[460px]"
      zClassName="z-[210]"
      closeDisabled={deleting}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={!confirmed}
            loading={deleting}
          >
            Excluir conta
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">
          Esta ação não poderá ser desfeita.
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Todos os dados vinculados a <span className="font-semibold text-[var(--text-primary)]">{institutionName}</span> serão removidos, incluindo conta corrente, cartões, faturas, extratos, movimentações e lançamentos relacionados.
        </p>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] px-3.5 py-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--red)]"
          />
          <span className="text-[13px] leading-snug text-[var(--text-primary)]">
            Entendo que todos os dados serão perdidos e desejo excluir esta conta.
          </span>
        </label>

        {error && <p className="text-[13px] text-[var(--red)]">{error}</p>}
      </div>
    </FormSheet>
  );
}
