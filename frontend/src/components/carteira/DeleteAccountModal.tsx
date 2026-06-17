'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface DeleteAccountModalProps {
  institutionName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteAccountModal({ institutionName, onClose, onConfirm }: DeleteAccountModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleting) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, deleting]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onClose(); }}
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/55 [animation:gm-fade-in_0.18s_ease-out] sm:items-center sm:p-5"
    >
      <div className="flex w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border-default)] bg-[var(--surface-card)] [animation:gm-modal-slide-in_0.24s_cubic-bezier(0.2,0.8,0.2,1)] sm:max-w-[460px] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--separator)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--red)]/15 text-[var(--red)]">
              <AlertTriangle className="size-[18px]" />
            </span>
            <h2 id="delete-account-modal-title" className="text-[17px] font-bold tracking-[-0.01em]">
              Excluir conta
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            aria-label="Fechar"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
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
        </div>
      </div>
    </div>
  );
}
