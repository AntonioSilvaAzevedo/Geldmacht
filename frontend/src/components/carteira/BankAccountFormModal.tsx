'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ACCOUNT_TYPE_LABELS } from '@/lib/carteira/account-type-labels';
import type { BankAccountType } from '@/lib/api';

export interface BankAccountFormData {
  name: string;
  account_type: BankAccountType;
}

interface BankAccountFormModalProps {
  institutionName: string;
  onClose: () => void;
  onSubmit: (payload: BankAccountFormData) => Promise<void>;
}

const ACCOUNT_TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABELS) as [BankAccountType, string][];

export function BankAccountFormModal({ institutionName, onClose, onSubmit }: BankAccountFormModalProps) {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('checking');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Informe o nome da conta.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: trimmed, account_type: accountType });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-account-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 [animation:gm-fade-in_0.18s_ease-out] sm:items-center sm:p-5"
    >
      <div className="flex w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border-default)] bg-[var(--surface-card)] [animation:gm-modal-slide-in_0.24s_cubic-bezier(0.2,0.8,0.2,1)] sm:max-w-[420px] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--separator)] px-5 py-4">
          <div>
            <h2 id="bank-account-modal-title" className="text-[17px] font-bold tracking-[-0.01em]">
              Cadastrar conta corrente
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{institutionName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Nome da conta</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="ex: Conta PF"
              className="rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Tipo de conta</span>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as BankAccountType)}
              className="rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none"
            >
              {ACCOUNT_TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          {error && <p className="text-[13px] text-[var(--red)]">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" loading={saving} onClick={() => void handleSave()}>
              Cadastrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
