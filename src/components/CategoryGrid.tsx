'use client';

/**
 * CategoryGrid — Geldmacht redesign
 *
 * Substitui os accordions lineares na página fatura/[invoiceId]/page.tsx.
 * Exibe categorias em grid 3×N (desktop) ou 2×N (mobile) com expansão inline.
 *
 * Uso:
 *   import { CategoryGrid } from '@/components/CategoryGrid';
 *   <CategoryGrid groups={groups} isMobile={isMobile} onRecategorize={id => setRecatEdit(id)} />
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Transaction } from '@/types/financial';

// Interface compatível com a já existente em fatura/[invoiceId]/page.tsx
export interface CategoryGroup {
  key: string;
  label: string;
  icon: string | null;
  total: number;
  budgetLimit: number | null;
  transactions: Transaction[];
}

// Paleta semântica — cicla pelos tokens do design system
const CAT_COLORS = [
  '#a0aec0', // slate-400  (Sem categoria)
  '#63b3ed', // blue-400   (Assinaturas)
  '#f6ad55', // amber-400  (Alimentação)
  '#48bb78', // green-400  (Transporte)
  '#fc8181', // red-400    (Saúde)
  '#b794f4', // purple-400 (Lazer)
  '#4fd1c5', // teal-400   (outros)
];

function getInitials(label: string): string {
  const parts = label.replace('/', ' ').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ─── CategoryCard ─────────────────────────────────────────────────────────────

function CategoryCard({
  group, colorHex, isOpen, onToggle,
}: {
  group: CategoryGroup;
  colorHex: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const pct = group.budgetLimit
    ? Math.min((group.total / group.budgetLimit) * 100, 100)
    : null;
  const isWarn = pct !== null && pct > 80;
  const isOver = pct !== null && pct >= 100;
  const barColor = isOver ? 'var(--red-400)' : isWarn ? 'var(--amber-400)' : 'var(--green-400)';

  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onToggle()}
      style={{
        background: isOpen ? 'var(--navy-700)' : 'var(--surface-card)',
        border: `1px solid ${isOpen ? 'var(--blue-500)' : 'var(--border-subtle)'}`,
        borderRadius: 12, padding: '14px 16px 11px',
        cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none', outline: 'none',
      }}
      onMouseEnter={e => {
        if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
      }}
      onMouseLeave={e => {
        if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--surface-card)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Avatar com ícone ou iniciais */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `${colorHex}22`, border: `1px solid ${colorHex}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: colorHex,
        }}>
          {group.icon
            ? <CategoryIcon icon={group.icon} size={16} />
            : getInitials(group.label)
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}>
            {group.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {group.transactions.length} lançamento{group.transactions.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
            color: isOver ? 'var(--red-400)' : 'var(--red-400)',
          }}>
            {formatCurrency(group.total)}
          </div>
          {group.budgetLimit && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              de {formatCurrency(group.budgetLimit)}
            </div>
          )}
        </div>
      </div>

      {/* Barra de orçamento */}
      {pct !== null && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            height: 3, borderRadius: 2,
            background: 'var(--border-subtle)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${pct}%`, background: barColor,
              borderRadius: 2, transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ fontSize: 10, color: isWarn ? barColor : 'var(--text-muted)', marginTop: 4 }}>
            {Math.round(pct)}% usado
            {isWarn && !isOver && group.budgetLimit
              ? ` · ${formatCurrency(group.budgetLimit - group.total)} disponível`
              : null
            }
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'center', marginTop: 9,
        color: 'var(--text-muted)', opacity: 0.4,
      }}>
        <ChevronDown
          size={11}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
        />
      </div>
    </div>
  );
}

// ─── CategoryTransactionList ──────────────────────────────────────────────────

function CategoryTransactionList({
  group, colorHex, onRecategorize,
}: {
  group: CategoryGroup;
  colorHex: string;
  onRecategorize?: (txId: number) => void;
}) {
  return (
    <div style={{
      background: 'var(--surface-panel)',
      border: '1px solid var(--border-subtle)',
      borderLeft: `3px solid ${colorHex}`,
      borderRadius: 10, overflow: 'hidden', marginTop: 10,
    }}>
      {/* Cabeçalho do painel expandido */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
            background: `${colorHex}22`, border: `1px solid ${colorHex}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: colorHex,
          }}>
            {group.icon ? <CategoryIcon icon={group.icon} size={13} /> : getInitials(group.label)}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {group.label}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {group.transactions.length} lançamentos
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--red-400)', flexShrink: 0 }}>
          {formatCurrency(group.total)}
        </span>
      </div>

      {/* Linhas de transação */}
      {group.transactions.map((tx, i) => (
        <div
          key={tx.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px',
            borderBottom: i < group.transactions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-muted)', flexShrink: 0, minWidth: 56,
          }}>
            {formatDate(tx.date)}
          </span>
          <span style={{
            fontSize: 13, color: 'var(--text-primary)',
            flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {tx.description}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
            color: 'var(--red-400)', flexShrink: 0,
          }}>
            −{formatCurrency(Math.abs(tx.amount))}
          </span>
          {onRecategorize && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={e => { e.stopPropagation(); onRecategorize(tx.id); }}
              className="shrink-0 !px-0 !py-0"
            >
              alterar
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

interface CategoryGridProps {
  groups: CategoryGroup[];
  isMobile?: boolean;
  /** Chamado ao clicar "alterar" — recebe o id da transação (conectar ao setRecatEdit) */
  onRecategorize?: (txId: number) => void;
}

export function CategoryGrid({ groups, isMobile = false, onRecategorize }: CategoryGridProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const toggle = (key: string) => setOpenKey(prev => prev === key ? null : key);

  const expandedIdx = openKey ? groups.findIndex(g => g.key === openKey) : -1;
  const expandedGroup = expandedIdx >= 0 ? groups[expandedIdx] : null;

  if (groups.length === 0) return null;

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: expandedGroup ? 4 : 0,
      }}>
        {groups.map((group, i) => (
          <CategoryCard
            key={group.key}
            group={group}
            colorHex={CAT_COLORS[i % CAT_COLORS.length]}
            isOpen={openKey === group.key}
            onToggle={() => toggle(group.key)}
          />
        ))}
      </div>

      {expandedGroup && (
        <CategoryTransactionList
          group={expandedGroup}
          colorHex={CAT_COLORS[expandedIdx % CAT_COLORS.length]}
          onRecategorize={onRecategorize}
        />
      )}
    </div>
  );
}
