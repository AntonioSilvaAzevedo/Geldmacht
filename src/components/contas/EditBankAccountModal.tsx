'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormSheet } from '@/components/ui/FormSheet';
import { Input, Select } from '@/components/ui/input';
import { ACCOUNT_TYPE_LABELS } from '@/lib/carteira/account-type-labels';
import type { BankAccountConfig, BankAccountPayload, BankAccountType } from '@/lib/api';

interface EditBankAccountModalProps {
  account: BankAccountConfig;
  onClose: () => void;
  onSubmit: (payload: Partial<BankAccountPayload>) => Promise<void>;
}

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABELS) as [BankAccountType, string][];

export function EditBankAccountModal({ account, onClose, onSubmit }: EditBankAccountModalProps) {
  const [name, setName] = useState(account.name);
  const [accountType, setAccountType] = useState<BankAccountType>(account.account_type);
  const [isMain, setIsMain] = useState(account.is_main);
  const [isActive, setIsActive] = useState(account.is_active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError('Informe o nome da conta.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        account_type: accountType,
        is_main: isMain,
        is_active: isActive,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
      setSaving(false);
    }
  }

  return (
    <FormSheet
      onClose={onClose}
      title="Editar conta"
      titleId="edit-bank-account-modal-title"
      maxWidthClass="sm:max-w-[420px]"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" loading={saving} onClick={() => void handleSave()}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Nome da conta</span>
          <Input size="sm" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Tipo</span>
          <Select size="sm" value={accountType} onChange={(e) => setAccountType(e.target.value as BankAccountType)}>
            {TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={isMain}
            onChange={(e) => setIsMain(e.target.checked)}
            className="size-4 shrink-0 accent-[var(--blue-400)]"
          />
          <span className="text-[13px] text-[var(--text-primary)]">Definir como conta principal</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 shrink-0 accent-[var(--blue-400)]"
          />
          <span className="text-[13px] text-[var(--text-primary)]">Conta ativa</span>
        </label>
        {error && <p className="text-[13px] text-[var(--red)]">{error}</p>}
      </div>
    </FormSheet>
  );
}
