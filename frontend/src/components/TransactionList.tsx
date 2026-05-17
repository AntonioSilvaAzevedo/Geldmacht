'use client';

/**
 * TransactionList — Geldmacht
 *
 * Lista compacta de lançamentos em card. Versão embedded usada nos dashboards
 * (aba Conta, fatura recente, tela Movimentações, etc.).
 *
 * Diferente do Extrato Component, que é standalone e sem card wrapper.
 *
 * Props:
 *   title       — string                  cabeçalho principal
 *   subtitle    — string?                 texto secundário no header (ex: mês)
 *   transactions — Transaction[]
 *   limit       — number?                 máx de rows visíveis (default: todas)
 *   onCtaClick  — () => void?             callback do link no header/footer
 *   ctaLabel    — string?                 label do link (default "Ver todas →")
 *   editable    — boolean?                habilita editor inline por linha
 *   categories  — string[]?               lista de categorias para o select
 *   headerRight — ReactNode?              substitui o CTA padrão do header
 *   onSave      — (tx: Transaction) => void?  callback ao salvar edição
 */

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/formatters';
import type { Transaction } from '@/types/financial';
import TransactionEditForm from '@/components/TransactionEditForm';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function txIsIncome(tx: Transaction): boolean {
  if (tx.transaction_type === 'income') return true;
  if (tx.transaction_type === 'expense') return false;
  return tx.amount >= 0;
}

function txType(tx: Transaction): 'entrada' | 'saida' | 'movimentacao' {
  if (tx.transaction_type === 'transfer') return 'movimentacao';
  return txIsIncome(tx) ? 'entrada' : 'saida';
}

function dotColor(type: 'entrada' | 'saida' | 'movimentacao'): string {
  if (type === 'entrada') return 'var(--green)';
  if (type === 'saida') return 'var(--red)';
  return 'rgba(255,255,255,0.22)';
}

function amtColor(type: 'entrada' | 'saida' | 'movimentacao'): string {
  if (type === 'entrada') return 'var(--green)';
  if (type === 'saida') return 'var(--red)';
  return 'var(--text-secondary)';
}

/** "2026-05-14" → "14/05" */
function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
}

function txDesc(tx: Transaction): string {
  return tx.description || '';
}

function txCat(tx: Transaction): string {
  return tx.category_display_label || tx.category_name || tx.category || '';
}

// ─── ReadRow ──────────────────────────────────────────────────────────────────

function ReadRow({ tx, last }: { tx: Transaction; last: boolean }) {
  const [hov, setHov] = useState(false);
  const type = txType(tx);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '11px 18px',
        borderBottom: !last ? '1px solid rgba(255,255,255,0.05)' : 'none',
        background: hov ? 'var(--surface-hover)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {/* Dot indicator */}
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        marginTop: 6, background: dotColor(type),
      }} />

      {/* Desc + cat */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: 'var(--text-primary)',
        }}>
          {txDesc(tx)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {txCat(tx) || <span style={{ fontStyle: 'italic' }}>Sem categoria</span>}
        </div>
      </div>

      {/* Amount + date */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
          color: amtColor(type),
        }}>
          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-quaternary)', marginTop: 2 }}>
          {formatShortDate(tx.date)}
        </div>
      </div>
    </div>
  );
}

// ─── EditableRow ──────────────────────────────────────────────────────────────

function EditableRow({
  tx, last, categories, onSave,
}: {
  tx: Transaction;
  last: boolean;
  categories: string[];
  onSave?: (tx: Transaction) => Promise<void> | void;
}) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [hov,    setHov]    = useState(false);
  const type = txType(tx);
  const cat  = txCat(tx);

  async function handleSave(updated: Transaction) {
    setSaving(true);
    try {
      await onSave?.(updated);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Row header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !saving && setOpen(v => !v)}
        onKeyDown={e => e.key === 'Enter' && !saving && setOpen(v => !v)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '12px 18px',
          borderBottom: !open && !last ? '1px solid rgba(255,255,255,0.05)' : 'none',
          background: open ? 'var(--surface-2)' : hov ? 'var(--surface-hover)' : 'transparent',
          cursor: saving ? 'wait' : 'pointer',
          transition: 'background 0.1s', outline: 'none',
        }}
      >
        {/* Dot */}
        <div style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          marginTop: 6, background: dotColor(type),
        }} />

        {/* Desc + cat pill */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: open ? 600 : 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: 'var(--text-primary)',
          }}>
            {tx.description}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {cat && (
              <span style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: 4,
                padding: '1px 6px', fontSize: 10,
              }}>
                {cat}
              </span>
            )}
            <span>{formatShortDate(tx.date)}</span>
          </div>
        </div>

        {/* Amount + hint */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
            color: amtColor(type),
          }}>
            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-quaternary)', marginTop: 2 }}>
            {saving ? 'salvando…' : open ? '▲ fechar' : 'editar'}
          </div>
        </div>
      </div>

      {/* TransactionEditForm — inline */}
      {open && (
        <div style={{ borderBottom: !last ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
          <TransactionEditForm
            tx={tx}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setOpen(false)}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
}

// ─── TransactionList ──────────────────────────────────────────────────────────

export interface TransactionListProps {
  title: string;
  subtitle?: string;
  transactions: Transaction[];
  limit?: number;
  onCtaClick?: () => void;
  ctaLabel?: string;
  editable?: boolean;
  categories?: string[];
  headerRight?: React.ReactNode;
  onSave?: (tx: Transaction) => Promise<void> | void;
  /** Quando true o card preenche o espaço disponível e só a lista interna rola */
  scrollable?: boolean;
  /** @deprecated — não utilizado no novo design */
  isMobile?: boolean;
  /** @deprecated — use editable + onSave */
  onRecategorize?: (txId: number) => void;
}

export function TransactionList({
  title, subtitle, transactions,
  limit, onCtaClick, ctaLabel = 'Ver todas →',
  editable = false, categories = [],
  headerRight, onSave, scrollable = false,
}: TransactionListProps) {
  const rows = limit ? transactions.slice(0, limit) : transactions;

  const CtaBtn = () => (
    <button
      type="button"
      onClick={onCtaClick}
      style={{
        background: 'none', border: 'none', color: 'var(--blue)',
        fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
      }}
    >
      {ctaLabel}
    </button>
  );

  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      overflow: 'hidden',
      // scrollable mode: o card preenche o espaço disponível
      ...(scrollable ? { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } : {}),
    }}>
      {/* Header */}
      <div style={{
        padding: '13px 18px',
        borderBottom: '1px solid var(--separator)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
          {subtitle && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>
              {subtitle}
            </span>
          )}
        </div>
        {headerRight ?? (onCtaClick ? <CtaBtn /> : null)}
      </div>

      {/* Rows — scrollable quando prop ativada */}
      <div style={scrollable ? { flex: 1, overflowY: 'auto', minHeight: 0 } : {}}>
        {rows.length === 0 ? (
          <div style={{
            padding: '32px 18px',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 13,
          }}>
            Nenhum lançamento encontrado.
          </div>
        ) : rows.map((tx, i) =>
          editable
            ? (
              <EditableRow
                key={tx.id}
                tx={tx}
                last={i === rows.length - 1}
                categories={categories}
                onSave={onSave}
              />
            )
            : (
              <ReadRow
                key={tx.id}
                tx={tx}
                last={i === rows.length - 1}
              />
            )
        )}
      </div>

      {/* Footer CTA */}
      {onCtaClick && (
        <div style={{
          borderTop: '1px solid var(--separator)',
          padding: '11px 18px',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <CtaBtn />
        </div>
      )}
    </div>
  );
}
