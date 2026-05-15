'use client';

/**
 * TransactionEditForm
 *
 * Formulário de edição inline de lançamento. Expandido ao clicar em uma linha
 * na TransactionList (modo editable). Substitui o formulário simples anterior.
 *
 * Campos:
 *   ✅ Descrição   — PATCH { description }
 *   ✅ Categoria   — PATCH { category_id } (passado como name, resolvido pelo pai)
 *   ⚠  Valor       — endpoint precisa de extensão: { amount }
 *   ⚠  Data        — endpoint precisa de extensão: { transaction_date }
 *   ⚠  Origem      — campo novo no schema: { source_label } (só entradas)
 *   ⚠  Observações — endpoint precisa de extensão: { notes }
 *
 * Props:
 *   tx          — Transaction   lançamento sendo editado
 *   categories  — string[]      categorias disponíveis
 *   onSave      — (updated: Transaction) => Promise<void> | void
 *   onCancel    — () => void
 *   saving      — boolean?      loading externo (desabilita Salvar)
 */

import React, { useState } from 'react';
import type { Transaction } from '@/types/financial';

// ─── Constants ────────────────────────────────────────────────────────────────

const ORIGEM_OPTS = [
  'Empregador (CLT)',
  'Cliente PJ',
  'Freelance',
  'Dividendos',
  'Aluguel',
  'Reembolso',
  'Transferência interna',
  'Outro',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function txTypeFor(tx: Transaction): 'entrada' | 'saida' | 'movimentacao' {
  if (tx.is_internal_transfer || tx.transaction_type === 'transfer') return 'movimentacao';
  if (tx.transaction_type === 'income' || tx.amount > 0) return 'entrada';
  return 'saida';
}

function txCatStr(tx: Transaction): string {
  return tx.category_display_label || tx.category_name || tx.category || '';
}

/** Tenta extrair o nome da entidade pagadora/recebedora da descrição (Pix, TED). */
function extractSourceEntity(desc: string): string {
  const pixMatch = desc.match(/Pix\s*[-–]\s*/i);
  if (pixMatch) {
    const after = desc.slice(desc.search(/Pix\s*[-–]\s*/i) + pixMatch[0].length);
    return after.split(/\s*[-–]\s*/)[0].replace(/\s*\(.*?\)/, '').trim();
  }
  const recMatch = desc.match(/Recebid[ao]\s*[-–]\s*/i);
  if (recMatch?.index != null) {
    const after = desc.slice(recMatch.index + recMatch[0].length);
    return after.split(/\s*[-–]\s*/)[0].trim();
  }
  return '';
}

function importSourceLabel(source: string | null): string {
  const map: Record<string, string> = {
    pdf_invoice_import:    'pdf · fatura',
    bank_statement_import: 'ofx · extrato',
    manual:                'manual',
  };
  return map[source ?? ''] ?? (source ?? 'desconhecido');
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TransactionEditFormProps {
  tx: Transaction;
  categories: string[];
  onSave: (updated: Transaction) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransactionEditForm({
  tx, categories, onSave, onCancel, saving = false,
}: TransactionEditFormProps) {
  const type        = txTypeFor(tx);
  const isIncome    = type === 'entrada';
  const sourceEntity = extractSourceEntity(tx.description);

  // Form state
  const [desc,   setDesc]   = useState(tx.description);
  const [cat,    setCat]    = useState(txCatStr(tx));
  const [amount, setAmount] = useState(Math.abs(tx.amount).toFixed(2).replace('.', ','));
  const [date,   setDate]   = useState(tx.date);
  const [origem, setOrigem] = useState('');
  const [notes,  setNotes]  = useState(tx.notes ?? '');

  // Dirty detection (só campos suportados hoje marcam dirty)
  const dirty =
    desc   !== tx.description ||
    cat    !== txCatStr(tx)   ||
    amount !== Math.abs(tx.amount).toFixed(2).replace('.', ',') ||
    date   !== tx.date        ||
    notes  !== (tx.notes ?? '');

  function handleSave() {
    if (!dirty || saving) return;
    const parsedAmt = parseFloat(amount.replace(',', '.'));
    const sign = tx.amount < 0 ? -1 : 1;
    void onSave({
      ...tx,
      description:           desc,
      category_display_label: cat,
      amount:                sign * Math.abs(parsedAmt),
      date,
      notes: notes || null,
    });
  }

  // ── Shared styles ─────────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    padding: '8px 11px', borderRadius: 9,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'var(--surface-3)', color: 'var(--text-primary)',
    fontSize: 13, fontFamily: 'var(--font-sans)',
    outline: 'none', width: '100%',
  };

  const lbl: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--text-tertiary)',
    display: 'block', marginBottom: 4,
  };

  // Decorative status badge
  const Badge = ({ ok }: { ok: boolean }) => (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
      textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4,
      marginLeft: 6, verticalAlign: 'middle',
      background: ok ? 'rgba(48,209,88,0.12)' : 'rgba(255,159,10,0.12)',
      color:      ok ? 'var(--green)'          : 'var(--orange)',
    }}>
      {ok ? '✓' : '⚠'}
    </span>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--surface-2)', padding: '16px 18px 18px', display: 'grid', gap: 14 }}>

      {/* Row 1 — Descrição + Categoria */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={lbl}>Descrição <Badge ok /></span>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            style={inp}
            placeholder="Ex: Salário CLT"
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={lbl}>Categoria <Badge ok /></span>
          <select value={cat} onChange={e => setCat(e.target.value)} style={inp}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      {/* Row 2 — Valor + Data */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={lbl}>Valor <Badge ok={false} /></span>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              fontSize: 12, color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)', pointerEvents: 'none',
            }}>
              R$
            </span>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputMode="decimal"
              style={{ ...inp, paddingLeft: 32, fontFamily: 'var(--font-mono)' }}
              placeholder="0,00"
            />
          </div>
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={lbl}>Data <Badge ok={false} /></span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={inp}
          />
        </label>
      </div>

      {/* Row 3 — Origem da receita (só entradas) */}
      {isIncome && (
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={lbl}>Origem da receita <Badge ok={false} /></span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select value={origem} onChange={e => setOrigem(e.target.value)} style={inp}>
              <option value="">Selecione a origem…</option>
              {ORIGEM_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input
              value={sourceEntity}
              readOnly
              style={{ ...inp, color: 'var(--text-tertiary)', cursor: 'default', fontSize: 12 }}
              placeholder="Pagador detectado…"
            />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-quaternary)', marginTop: 2 }}>
            Define a origem da receita para o painel de Proventos.
          </span>
        </label>
      )}

      {/* Row 4 — Observações */}
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={lbl}>Observações <Badge ok={false} /></span>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          style={{ ...inp, resize: 'vertical' }}
          placeholder="Notas internas sobre este lançamento…"
        />
      </label>

      {/* Metadata strip — read-only */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          {
            l: 'Tipo',
            v: type === 'entrada' ? 'Entrada' : type === 'saida' ? 'Saída' : 'Movimentação',
          },
          { l: 'Origem import.', v: importSourceLabel(tx.source) },
          ...(tx.installment_current != null
            ? [{ l: 'Parcela', v: `${tx.installment_current}/${tx.installment_total}` }]
            : []),
        ].map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 7, padding: '4px 9px',
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-quaternary)' }}>{m.l}:</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {m.v}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--text-quaternary)' }}>
          {dirty ? '● alterações pendentes' : '○ sem alterações'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '7px 14px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            style={{
              padding: '7px 18px', borderRadius: 8, border: 'none',
              background: dirty && !saving ? 'var(--blue)' : 'rgba(10,132,255,0.30)',
              color:      dirty && !saving ? '#fff'       : 'rgba(255,255,255,0.40)',
              fontSize: 12, fontWeight: 600,
              cursor:     dirty && !saving ? 'pointer'    : 'not-allowed',
              transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
