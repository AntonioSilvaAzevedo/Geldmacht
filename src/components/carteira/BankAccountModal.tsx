'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormSheet } from '@/components/ui/FormSheet';
import { Input, Select } from '@/components/ui/input';
import { ACCOUNT_TYPE_LABELS } from '@/lib/carteira/account-type-labels';
import type { BankAccountType } from '@/lib/api';

export interface BankAccountModalData {
  name: string;
  institution: string;
  account_type: BankAccountType;
}

interface BankAccountModalProps {
  onClose: () => void;
  onSubmit: (payload: BankAccountModalData) => Promise<void>;
  institutionName?: string;
}

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABELS) as [BankAccountType, string][];

export function BankAccountModal({ onClose, onSubmit, institutionName }: BankAccountModalProps) {
  const lockedInstitution = Boolean(institutionName);
  const [institution, setInstitution] = useState(institutionName ?? '');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('checking');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const bank = institution.trim();
    if (!bank) {
      setError('Informe o banco ou instituição.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim() || bank, institution: bank, account_type: accountType });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
      setSaving(false);
    }
  }

  return (
    <FormSheet
      onClose={onClose}
      title="Cadastrar conta bancária"
      titleId="bank-account-modal-title"
      maxWidthClass="sm:max-w-[420px]"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" loading={saving} onClick={() => void handleSave()}>
            Cadastrar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Banco / instituição</span>
          <Input size="sm" value={institution} onChange={(e) => setInstitution(e.target.value)} autoFocus={!lockedInstitution} readOnly={lockedInstitution} placeholder="ex: Nubank" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Nome da conta (opcional)</span>
          <Input size="sm" value={name} onChange={(e) => setName(e.target.value)} autoFocus={lockedInstitution} placeholder="ex: Conta PF" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Tipo</span>
          <Select size="sm" value={accountType} onChange={(e) => setAccountType(e.target.value as BankAccountType)}>
            {TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </label>
        {error && <p className="text-[13px] text-[var(--red)]">{error}</p>}
      </div>
    </FormSheet>
  );
}
