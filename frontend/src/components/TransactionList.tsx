'use client';

/**
 * TransactionList — Geldmacht redesign
 *
 * Substitui a <table> na página contas/[id]/page.tsx.
 * Agrupa por data com cabeçalho sticky, descrições inteligentes de Pix,
 * e expandir por clique para ver descrição completa + alterar categoria.
 *
 * Uso:
 *   import { TransactionList } from '@/components/TransactionList';
 *   <TransactionList transactions={movements} isMobile={isMobile} onRecategorize={...} />
 */

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import type { Transaction } from '@/types/financial';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function txIsIncome(tx: Transaction): boolean {
  if (tx.transaction_type === 'income') return true;
  if (tx.transaction_type === 'expense') return false;
  return tx.amount >= 0;
}

/**
 * Extrai o nome do destinatário de transferências Pix/TED longas.
 * Ex: "Transferência enviada pelo Pix - Antonio Carlos Silva de Azevedo (Transferência enviada)"
 *  → { primary: "Antonio Carlos Silva de Azevedo", tag: "PIX" }
 */
function parseDescription(desc: string): { primary: string; tag: string | null } {
  const pixMatch = desc.match(/Pix\s*-\s*/i);
  if (pixMatch) {
    const after = desc.slice(desc.search(/Pix\s*-\s*/i) + pixMatch[0].length);
    const name = after.split(/\s*-\s*/)[0].replace(/\s*\(.*\)/, '').trim();
    return { primary: name || desc, tag: 'PIX' };
  }
  const recMatch = desc.match(/Recebid[ao]\s*-\s*/i);
  if (recMatch && recMatch.index !== undefined) {
    const after = desc.slice(recMatch.index + recMatch[0].length);
    const name = after.split(/\s*-\s*/)[0].trim();
    return { primary: name || desc, tag: 'PIX' };
  }
  return { primary: desc.length > 54 ? `${desc.slice(0, 54)}…` : desc, tag: null };
}

function formatDateHeader(dateStr: string) {
  const dt = new Date(`${dateStr}T12:00:00`);
  const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  return {
    day: String(dt.getDate()).padStart(2, '0'),
    mon: months[dt.getMonth()],
    yr: dt.getFullYear(),
    wd: weekdays[dt.getDay()],
  };
}

function groupByDate(transactions: Transaction[]): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  transactions.forEach(tx => {
    if (!map.has(tx.date)) map.set(tx.date, []);
    map.get(tx.date)!.push(tx);
  });
  return [...map.entries()].map(([date, items]) => ({ date, items }));
}

// ─── TransactionRow ───────────────────────────────────────────────────────────

function TransactionRow({
  tx, isLast, isMobile, onRecategorize,
}: {
  tx: Transaction;
  isLast: boolean;
  isMobile: boolean;
  onRecategorize?: (txId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const income = txIsIncome(tx);
  const accent = income ? 'var(--green-400)' : 'var(--red-400)';
  const parsed = parseDescription(tx.description);
  const catLabel = tx.category_display_label || tx.category_name || tx.category;

  const CategoryPill = () => catLabel ? (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 9999,
      background: 'rgba(161,174,190,0.1)', border: '1px solid rgba(161,174,190,0.18)',
      fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500,
    }}>
      {tx.category_icon && <CategoryIcon icon={tx.category_icon} size={10} />}
      {catLabel}
    </span>
  ) : (
    <span style={{ fontSize: isMobile ? 11 : 12, color: 'var(--text-muted)', fontStyle: isMobile ? 'normal' : 'italic' }}>
      Sem categoria
    </span>
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => e.key === 'Enter' && setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12,
          padding: isMobile ? '12px 14px' : '11px 18px',
          borderBottom: open || isLast ? 'none' : '1px solid var(--border-subtle)',
          borderLeft: `3px solid ${accent}`,
          cursor: 'pointer', transition: 'background 0.1s', background: 'transparent',
          outline: 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Ícone de tipo */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: income ? 'rgba(72,187,120,0.12)' : 'rgba(252,129,129,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {income
            ? <TrendingUp size={13} color="var(--green-400)" />
            : <TrendingDown size={13} color="var(--red-400)" />
          }
        </div>

        {/* Descrição */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {parsed.primary}
            </span>
            {parsed.tag && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', flexShrink: 0,
                background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.25)',
                color: 'var(--blue-400)', padding: '1px 5px', borderRadius: 3,
              }}>
                {parsed.tag}
              </span>
            )}
          </div>
          {isMobile && <div style={{ marginTop: 3 }}><CategoryPill /></div>}
        </div>

        {/* Categoria — desktop */}
        {!isMobile && <div style={{ flexShrink: 0, minWidth: 140 }}><CategoryPill /></div>}

        {/* Valor */}
        <div style={{
          flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 13,
          fontWeight: 700, color: accent, textAlign: 'right', minWidth: 85,
        }}>
          {income ? '' : '−'}{formatCurrency(Math.abs(tx.amount))}
        </div>

        <div style={{ flexShrink: 0, color: 'var(--text-muted)', opacity: 0.45 }}>
          <ChevronDown
            size={11}
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
          />
        </div>
      </div>

      {/* Detalhe expandido */}
      {open && (
        <div style={{
          padding: '10px 18px 13px 63px',
          background: 'var(--surface-panel)',
          borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
          borderLeft: `3px solid ${income ? 'rgba(72,187,120,0.3)' : 'rgba(252,129,129,0.3)'}`,
        }}>
          <div style={{
            fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.07em', fontWeight: 700, marginBottom: 5,
          }}>
            Descrição completa
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, wordBreak: 'break-word' }}>
            {tx.description}
          </div>
          {onRecategorize && (
            <div style={{ marginTop: 9 }}>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="!px-0 !py-0"
                onClick={e => { e.stopPropagation(); onRecategorize(tx.id); }}
              >
                Alterar categoria
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DateGroup ────────────────────────────────────────────────────────────────

function DateGroup({
  date, items, isMobile, onRecategorize,
}: {
  date: string;
  items: Transaction[];
  isMobile: boolean;
  onRecategorize?: (txId: number) => void;
}) {
  const fmt = formatDateHeader(date);
  const net = items.reduce((s, tx) => s + tx.amount, 0);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Cabeçalho sticky */}
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '0 2px 7px',
        // Ajuste o `top` conforme a altura do seu header + filtros fixos
        position: 'sticky', top: 108, zIndex: 5,
        background: 'var(--surface-bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            color: 'var(--text-muted)', letterSpacing: '0.08em',
          }}>
            {fmt.day} {fmt.mon} {fmt.yr}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.45 }}>{fmt.wd}</span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
          color: net >= 0 ? 'var(--green-300)' : 'var(--red-400)', opacity: 0.85,
        }}>
          {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net))}
        </span>
      </div>

      {/* Linhas */}
      <div style={{
        borderRadius: 10, border: '1px solid var(--border-subtle)',
        overflow: 'hidden', background: 'var(--surface-card)',
      }}>
        {items.map((tx, i) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            isLast={i === items.length - 1}
            isMobile={isMobile}
            onRecategorize={onRecategorize}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

interface TransactionListProps {
  transactions: Transaction[];
  isMobile?: boolean;
  /** Chamado ao clicar "Alterar categoria" — recebe o id da transação */
  onRecategorize?: (txId: number) => void;
}

export function TransactionList({ transactions, isMobile = false, onRecategorize }: TransactionListProps) {
  const groups = useMemo(() => groupByDate(transactions), [transactions]);
  if (groups.length === 0) return null;

  return (
    <div>
      {groups.map(g => (
        <DateGroup
          key={g.date}
          date={g.date}
          items={g.items}
          isMobile={isMobile}
          onRecategorize={onRecategorize}
        />
      ))}
    </div>
  );
}
