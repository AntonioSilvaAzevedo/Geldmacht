/**
 * FitnessGridSection
 *
 * Exibe um grid de cards por categoria (estilo Apple Fitness) e, ao clicar,
 * abre uma timeline vertical com os lançamentos daquela categoria.
 *
 * Estados:
 *   detail === null      → grid view (cards por categoria ou card genérico)
 *   detail === catId     → timeline para a categoria com aquele id
 *   detail === '__all'   → timeline com todos os lançamentos do mês
 */

'use client';

import { useMemo, useState } from 'react';
import type { Transaction } from '@/types/financial';
import { formatCurrency } from '@/lib/formatters';

// ── Palette ────────────────────────────────────────────────────────────────────
const PALETTE = [
  '#FF9F0A','#0A84FF','#BF5AF2','#30D158','#FF453A',
  '#5AC8FA','#5E5CE6','#FF6B00','#34C759','#FF375F',
];

function deriveCatColor(catId: number): string {
  return PALETTE[catId % PALETTE.length];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  transactions: Transaction[];
  monthYM:      string;       // "YYYY-MM" — filtra transações do mês
  monthLabel:   string;       // "Maio 2026" — exibido no header do grid
  onVerTodas:   () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ChevronRight() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,.22)" strokeWidth="2.5" strokeLinecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FitnessGridSection({ transactions, monthYM, monthLabel, onVerTodas }: Props) {
  const [detail, setDetail] = useState<string | null>(null);

  // ── Filtrar ao mês corrente ─────────────────────────────────────────────────

  const monthTxs = useMemo(
    () => transactions.filter(tx => tx.date.startsWith(monthYM)),
    [transactions, monthYM],
  );

  // ── Agrupar por category_id ─────────────────────────────────────────────────

  const byCategory = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    monthTxs.forEach(tx => {
      const key = tx.category_id != null ? String(tx.category_id) : '__none';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(tx);
    });
    return m;
  }, [monthTxs]);

  // ── Derivar lista de categorias para o grid ─────────────────────────────────

  const cats = useMemo(() =>
    [...byCategory.entries()]
      .filter(([k]) => k !== '__none')
      .map(([catId, txs]) => {
        const sample  = txs[0];
        const numId   = Number(catId);
        const total   = txs.reduce((s, t) => s + t.amount, 0);
        return {
          id:    catId,
          name:  sample.category_name ?? catId,
          icon:  sample.category_icon ?? '📋',
          color: deriveCatColor(isNaN(numId) ? 0 : numId),
          txs,
          total,
        };
      })
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total)),
    [byCategory],
  );

  // ── Totais globais (para card genérico) ────────────────────────────────────

  const totalIn  = monthTxs.filter(tx => tx.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = monthTxs.filter(tx => tx.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  // ── Dados da detail view ───────────────────────────────────────────────────

  const detailCat   = detail && detail !== '__all' ? cats.find(c => c.id === detail) : null;
  const detailColor = detailCat?.color ?? 'var(--blue, #0A84FF)';
  const detailLabel = detail === '__all' ? 'Todos os lançamentos' : (detailCat?.name ?? '');
  const detailIcon  = detail === '__all' ? '📊' : (detailCat?.icon ?? '📋');

  const detailTxs = useMemo(() => {
    if (detail === '__all') return monthTxs;
    if (detail)             return detailCat?.txs ?? [];
    return [];
  }, [detail, monthTxs, detailCat]);

  const detailTotal = detailTxs.reduce((s, t) => s + t.amount, 0);

  // Agrupar detail txs por data (desc)
  const byDate = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    detailTxs.forEach(tx => {
      if (!m.has(tx.date)) m.set(tx.date, []);
      m.get(tx.date)!.push(tx);
    });
    return [...m.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [detailTxs]);

  // ── Render: Timeline ─────────────────────────────────────────────────────────

  if (detail !== null) {
    const sign = detailTotal >= 0 ? '+' : '-';

    return (
      <div>
        {/* Header da detail view */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 18,
        }}>
          <button
            onClick={() => setDetail(null)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--blue, #0A84FF)',
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ← Voltar
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{detailLabel}</span>
              <span style={{ fontSize: 18 }}>{detailIcon}</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              color: detailColor,
            }}>
              {sign}{formatCurrency(Math.abs(detailTotal))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {byDate.map(([dateStr, txs], di) => {
            const d      = new Date(dateStr + 'T12:00:00');
            const day    = d.getDate();
            const monRaw = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
            const mon    = monRaw.charAt(0).toUpperCase() + monRaw.slice(1);
            const isLast = di === byDate.length - 1;

            return (
              <div key={dateStr} style={{ display: 'flex', gap: 10, paddingBottom: isLast ? 0 : 14 }}>

                {/* Date chip + linha conectora */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 46, borderRadius: 8, padding: '5px 0',
                    background: detailColor + '18',
                    border: `1px solid ${detailColor}33`,
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
                      color: detailColor, lineHeight: 1,
                    }}>
                      {day}
                    </div>
                    <div style={{
                      fontSize: 8, color: 'var(--text-tertiary, rgba(255,255,255,.35))',
                      marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                      {mon}
                    </div>
                  </div>
                  {!isLast && (
                    <div style={{
                      width: 1, flex: 1, marginTop: 4,
                      background: 'rgba(255,255,255,.06)',
                    }} />
                  )}
                </div>

                {/* Transações do dia */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2 }}>
                  {txs.map(tx => {
                    const isIncome   = tx.amount > 0;
                    const isTransfer = tx.transaction_type === 'transfer' || tx.is_internal_transfer;
                    const valColor   = isTransfer
                      ? 'var(--text-tertiary, rgba(255,255,255,.35))'
                      : isIncome
                        ? 'var(--green, #30D158)'
                        : 'var(--red, #FF453A)';

                    return (
                      <div key={tx.id} style={{
                        background: 'var(--surface-2, #2C2C2E)',
                        border: '1px solid rgba(255,255,255,.06)',
                        borderRadius: 10, padding: '7px 10px',
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', gap: 8,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 12, fontWeight: 500,
                            lineHeight: 1.45, color: 'var(--text-primary)',
                          }}>
                            {tx.description}
                          </div>
                          {tx.category_name && (
                            <div style={{
                              fontSize: 10,
                              color: 'var(--text-tertiary, rgba(255,255,255,.35))',
                              marginTop: 2,
                            }}>
                              {tx.category_icon ? `${tx.category_icon} ` : ''}{tx.category_name}
                            </div>
                          )}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                          color: valColor, flexShrink: 0,
                        }}>
                          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

        {/* Ver todas */}
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <button
            onClick={onVerTodas}
            style={{
              background: 'none', border: 'none',
              color: 'var(--blue, #0A84FF)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Ver todas as movimentações →
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Grid view ─────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header do grid */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {monthLabel}
        </div>
        <button
          onClick={onVerTodas}
          style={{
            background: 'none', border: 'none',
            color: 'var(--blue, #0A84FF)',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Ver todas →
        </button>
      </div>

      {/* Grid 2 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

        {cats.length === 0 ? (

          /* ── Card genérico (sem categorias) ────────────────────────────────── */
          <button
            onClick={() => setDetail('__all')}
            style={{
              gridColumn: '1 / -1',
              background: 'var(--surface-2, #2C2C2E)',
              border: '1px solid rgba(255,255,255,.06)',
              borderRadius: 14, padding: '13px 13px 12px',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              transition: 'background .12s, border-color .12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = '#333';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'var(--surface-2, #2C2C2E)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 600,
                  color: 'var(--text-secondary)', letterSpacing: '.02em', marginBottom: 4,
                }}>
                  Todos os lançamentos
                </div>
                <div style={{ fontSize: 20 }}>📊</div>
              </div>
              <ChevronRight />
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700,
                  color: 'var(--green, #30D158)', marginBottom: 2,
                }}>
                  +{formatCurrency(totalIn)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary, rgba(255,255,255,.35))' }}>
                  Entradas
                </div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,.08)', alignSelf: 'stretch' }} />
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700,
                  color: 'var(--red, #FF453A)', marginBottom: 2,
                }}>
                  -{formatCurrency(totalOut)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary, rgba(255,255,255,.35))' }}>
                  Saídas
                </div>
              </div>
            </div>
          </button>

        ) : (

          /* ── Category cards ──────────────────────────────────────────────── */
          cats.map(cat => {
            const isIncome = cat.total > 0;
            const prefix   = isIncome ? '+' : '-';

            return (
              <button
                key={cat.id}
                onClick={() => setDetail(cat.id)}
                style={{
                  background: 'var(--surface-2, #2C2C2E)',
                  border: '1px solid rgba(255,255,255,.06)',
                  borderRadius: 14, padding: '13px 13px 12px',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  transition: 'background .12s, border-color .12s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background  = '#333';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background  = 'var(--surface-2, #2C2C2E)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
                  <div>
                    <div style={{
                      fontSize: 10, fontWeight: 600,
                      color: 'var(--text-secondary)', letterSpacing: '.02em', marginBottom: 4,
                    }}>
                      {cat.name}
                    </div>
                    <div style={{ fontSize: 20 }}>{cat.icon}</div>
                  </div>
                  <ChevronRight />
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700,
                  color: cat.color, marginBottom: 3,
                }}>
                  {prefix}{formatCurrency(Math.abs(cat.total))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary, rgba(255,255,255,.35))' }}>
                  {cat.txs.length} lançamento{cat.txs.length !== 1 ? 's' : ''}
                </div>
              </button>
            );
          })

        )}
      </div>
    </div>
  );
}
