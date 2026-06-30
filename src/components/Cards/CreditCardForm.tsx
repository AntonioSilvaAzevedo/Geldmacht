'use client';

import { useState } from 'react';
import type { CreditCardConfig } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Payload do form. `credit_limit`:
 *   - null  → não informado/limpa (no PATCH usamos sentinela 0 para limpar)
 *   - >0    → valor do limite informado pelo usuário
 */
type CardFormData = Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'> & {
  credit_limit: number | null;
};

interface Props {
  initial?: Partial<CreditCardConfig>;
  submitLabel: string;
  onSubmit: (payload: CardFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function CreditCardForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [institution, setInstitution] = useState(initial?.institution ?? '');
  const [closingDay, setClosingDay] = useState(String(initial?.closing_day ?? 25));
  const [dueDay, setDueDay] = useState(String(initial?.due_day ?? 5));
  const [creditLimit, setCreditLimit] = useState(
    initial?.credit_limit != null ? String(initial.credit_limit) : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const closing_day = Number(closingDay);
    const due_day = Number(dueDay);
    if (!name.trim()) {
      setError('Informe o nome do cartão.');
      return;
    }
    if (closing_day < 1 || closing_day > 31 || due_day < 1 || due_day > 31) {
      setError('Fechamento e vencimento devem estar entre 1 e 31.');
      return;
    }

    let credit_limit: number | null = null;
    const limitTrim = creditLimit.trim();
    if (limitTrim !== '') {
      const parsed = parseFloat(limitTrim.replace(',', '.'));
      if (Number.isNaN(parsed) || parsed <= 0) {
        setError('O limite do cartão deve ser maior que zero.');
        return;
      }
      credit_limit = parsed;
    }

    setSaving(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        institution: institution.trim() || null,
        closing_day,
        due_day,
        credit_limit,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cartão.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: 18,
      display: 'grid',
      gap: 12,
    }}>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        Nome do cartão
        <Input size="sm" value={name} onChange={e => setName(e.target.value)} />
      </label>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        Instituição/Banco
        <Input size="sm" value={institution} onChange={e => setInstitution(e.target.value)} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          Dia de fechamento
          <Input type="number" min={1} max={31} size="sm" value={closingDay} onChange={e => setClosingDay(e.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          Dia de vencimento
          <Input type="number" min={1} max={31} size="sm" value={dueDay} onChange={e => setDueDay(e.target.value)} />
        </label>
      </div>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        Limite do cartão <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
        <Input
          type="number"
          min={0}
          step={0.01}
          size="sm"
          placeholder="Ex: 10000.00"
          value={creditLimit}
          onChange={e => setCreditLimit(e.target.value)}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Informe o limite do cartão para visualizar quanto da fatura ele representa. Deixe vazio se preferir.
        </span>
      </label>
      {error && <div style={{ color: 'var(--red-400)', fontSize: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" size="sm" loading={saving}>
          {saving ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

