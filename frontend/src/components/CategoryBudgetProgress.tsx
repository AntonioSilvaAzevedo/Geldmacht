'use client';

import { formatCurrency } from '@/lib/formatters';

/**
 * Barra de progresso de gasto da categoria contra `invoice_budget_limit`.
 *
 * Estados (faixas de % usado):
 *   0–70%   → within_limit  (verde discreto)
 *   71–90%  → attention     (amarelo)
 *   91–100% → near_limit    (laranja)
 *   >100%   → exceeded      (vermelho)
 *
 * Não bloqueia, não altera fatura — apenas visual.
 */
export type BudgetStatus = 'within_limit' | 'attention' | 'near_limit' | 'exceeded';

export function classifyBudget(spent: number, limit: number): BudgetStatus {
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  if (pct > 100) return 'exceeded';
  if (pct >= 91) return 'near_limit';
  if (pct >= 71) return 'attention';
  return 'within_limit';
}

const STATUS_COLORS: Record<BudgetStatus, { bar: string; text: string; bg: string; label: string }> = {
  within_limit: { bar: 'var(--green-500)',  text: 'var(--green-400)',  bg: 'rgba(72,187,120,0.10)', label: 'Dentro do limite' },
  attention:    { bar: '#ecc94b',           text: '#ecc94b',           bg: 'rgba(236,201,75,0.10)',  label: 'Atenção' },
  near_limit:   { bar: '#ed8936',           text: '#ed8936',           bg: 'rgba(237,137,54,0.10)',  label: 'Próximo do limite' },
  exceeded:     { bar: 'var(--red-500)',    text: 'var(--red-400)',    bg: 'rgba(245,101,101,0.10)', label: 'Limite ultrapassado' },
};

export default function CategoryBudgetProgress({
  spentAmount,
  limitAmount,
  compact = false,
}: {
  spentAmount: number;
  limitAmount: number;
  compact?: boolean;
}) {
  const pct = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0;
  const clampedPct = Math.min(pct, 100);
  const status = classifyBudget(spentAmount, limitAmount);
  const colors = STATUS_COLORS[status];
  const exceeded = Math.max(spentAmount - limitAmount, 0);
  const available = Math.max(limitAmount - spentAmount, 0);

  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: compact ? 11 : 12,
        color: 'var(--text-muted)',
      }}>
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(spentAmount)}</strong>
          {' '}de{' '}{formatCurrency(limitAmount)}
        </span>
        <span style={{ color: colors.text, fontWeight: 600 }}>
          {pct.toFixed(0)}% usado
        </span>
      </div>

      <div style={{
        position: 'relative',
        height: compact ? 5 : 7,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${clampedPct}%`,
          height: '100%',
          background: colors.bar,
          transition: 'width 0.25s ease',
        }} />
        {pct > 100 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(45deg, ${colors.bar}, ${colors.bar} 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)`,
          }} />
        )}
      </div>

      <div style={{
        fontSize: 11,
        color: colors.text,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
          background: colors.bar,
        }} />
        {status === 'exceeded'
          ? `Limite ultrapassado em ${formatCurrency(exceeded)}`
          : `${colors.label} · ${formatCurrency(available)} disponível`}
      </div>
    </div>
  );
}
