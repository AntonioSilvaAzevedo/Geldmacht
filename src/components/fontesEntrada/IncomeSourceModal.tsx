'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormSheet } from '@/components/ui/FormSheet';
import { Input, Select, Textarea } from '@/components/ui/input';
import {
  INCOME_SOURCE_FREQUENCY_LABELS,
  INCOME_SOURCE_NATURE_LABELS,
  INCOME_SOURCE_TYPE_LABELS,
} from '@/lib/fontesEntrada/labels';
import type {
  BankAccountConfig,
  IncomeSourceConfig,
  IncomeSourceFrequency,
  IncomeSourceNature,
  IncomeSourcePayload,
  IncomeSourceType,
} from '@/lib/api';

interface IncomeSourceModalProps {
  source: IncomeSourceConfig | null;
  accounts: BankAccountConfig[];
  onClose: () => void;
  onSubmit: (payload: IncomeSourcePayload) => Promise<void>;
}

const TYPE_OPTIONS = Object.entries(INCOME_SOURCE_TYPE_LABELS) as [IncomeSourceType, string][];
const NATURE_OPTIONS = Object.entries(INCOME_SOURCE_NATURE_LABELS) as [IncomeSourceNature, string][];
const FREQUENCY_OPTIONS = Object.entries(INCOME_SOURCE_FREQUENCY_LABELS) as [IncomeSourceFrequency, string][];

export function IncomeSourceModal({ source, accounts, onClose, onSubmit }: IncomeSourceModalProps) {
  const [name, setName] = useState(source?.name ?? '');
  const [type, setType] = useState<IncomeSourceType>(source?.type ?? 'clt');
  const [nature, setNature] = useState<IncomeSourceNature>(source?.nature ?? 'cash_income');
  const [defaultAccountId, setDefaultAccountId] = useState<number | null>(source?.default_account_id ?? null);
  const [expectedAmount, setExpectedAmount] = useState(source?.expected_amount?.toString() ?? '');
  const [frequency, setFrequency] = useState<IncomeSourceFrequency | ''>(source?.frequency ?? '');
  const [description, setDescription] = useState(source?.description ?? '');
  const [isActive, setIsActive] = useState(source?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError('Informe o nome da fonte de entrada.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        nature,
        default_account_id: defaultAccountId,
        expected_amount: expectedAmount ? Number(expectedAmount) : null,
        frequency: frequency || null,
        description: description.trim() || null,
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
      title={source ? 'Editar fonte de entrada' : 'Nova fonte de entrada'}
      titleId="income-source-modal-title"
      maxWidthClass="sm:max-w-[480px]"
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
          <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Nome</span>
          <Input size="sm" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="ex: Salário CLT" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Tipo</span>
            <Select size="sm" value={type} onChange={(e) => setType(e.target.value as IncomeSourceType)}>
              {TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Natureza</span>
            <Select size="sm" value={nature} onChange={(e) => setNature(e.target.value as IncomeSourceNature)}>
              {NATURE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Conta padrão de recebimento (opcional)</span>
          <Select
            size="sm"
            value={defaultAccountId ?? ''}
            onChange={(e) => setDefaultAccountId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Nenhuma</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </Select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Valor esperado (opcional)</span>
            <Input
              size="sm"
              value={expectedAmount}
              onChange={(e) => setExpectedAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="font-[family-name:var(--font-mono)]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Frequência (opcional)</span>
            <Select size="sm" value={frequency} onChange={(e) => setFrequency(e.target.value as IncomeSourceFrequency)}>
              <option value="">Não informada</option>
              {FREQUENCY_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Descrição (opcional)</span>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </label>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 shrink-0 accent-[var(--blue-400)]"
          />
          <span className="text-[13px] text-[var(--text-primary)]">Fonte ativa</span>
        </label>
        {error && <p className="text-[13px] text-[var(--red)]">{error}</p>}
      </div>
    </FormSheet>
  );
}
