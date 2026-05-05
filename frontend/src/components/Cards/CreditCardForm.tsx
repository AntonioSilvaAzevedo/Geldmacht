'use client';

import { useState } from 'react';
import type { CreditCardConfig } from '@/lib/api';

type CardFormData = Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'>;

interface Props {
  initial?: Partial<CardFormData>;
  submitLabel: string;
  onSubmit: (payload: CardFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function CreditCardForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [institution, setInstitution] = useState(initial?.institution ?? '');
  const [closingDay, setClosingDay] = useState(String(initial?.closing_day ?? 25));
  const [dueDay, setDueDay] = useState(String(initial?.due_day ?? 5));
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
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        institution: institution.trim() || null,
        closing_day,
        due_day,
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
        <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      </label>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        Instituição/Banco
        <input value={institution} onChange={e => setInstitution(e.target.value)} style={inputStyle} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          Dia de fechamento
          <input type="number" min={1} max={31} value={closingDay} onChange={e => setClosingDay(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          Dia de vencimento
          <input type="number" min={1} max={31} value={dueDay} onChange={e => setDueDay(e.target.value)} style={inputStyle} />
        </label>
      </div>
      {error && <div style={{ color: 'var(--red-400)', fontSize: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={secondaryButtonStyle}>
            Cancelar
          </button>
        )}
        <button type="submit" disabled={saving} style={primaryButtonStyle}>
          {saving ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '9px 11px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'var(--surface-panel)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};
