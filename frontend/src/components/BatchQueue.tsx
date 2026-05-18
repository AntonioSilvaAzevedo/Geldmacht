'use client';

import { formatCurrency } from '@/lib/formatters';

export interface QueueEntry {
  id: string;
  tipo: 'saida' | 'entrada';
  amount: number;
  desc: string;
  catLabel: string;
  catIcon: string;
  accLabel: string;
  dateLabel: string;
  // raw fields for API
  bankAccountId: number;
  categoryId: number | null;
  transactionDate: string;
  transactionType: 'income' | 'expense';
  notes: string;
}

interface BatchQueueProps {
  entries: QueueEntry[];
  onRemove: (id: string) => void;
  onCommit: () => void;
  committing?: boolean;
  variant?: 'web' | 'mobile';
}

export default function BatchQueue({
  entries,
  onRemove,
  onCommit,
  committing = false,
  variant = 'web',
}: BatchQueueProps) {
  const totalIn  = entries.filter(e => e.tipo === 'entrada').reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter(e => e.tipo === 'saida').reduce((s, e) => s + e.amount, 0);
  const saldo    = totalIn - totalOut;

  // Mobile: compact top bar
  if (variant === 'mobile') {
    if (!entries.length) return null;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
        background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.07)',
      }}>
        <div style={{ flex: 1, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Fila — {entries.length}
        </div>
        {entries.slice(0, 4).map(e => (
          <span key={e.id} style={{ fontSize: 14, lineHeight: 1 }}>{e.catIcon || '📋'}</span>
        ))}
        {entries.length > 4 && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{entries.length - 4}</span>
        )}
        <button
          onClick={onCommit}
          disabled={committing}
          style={{
            background: committing ? 'rgba(48,209,88,.06)' : 'rgba(48,209,88,.12)',
            color: 'var(--green)', fontSize: 11, fontWeight: 700,
            padding: '4px 10px', borderRadius: 7, border: 'none',
            cursor: committing ? 'not-allowed' : 'pointer',
          }}
        >
          {committing ? '…' : 'Confirmar ✓'}
        </button>
      </div>
    );
  }

  // Web: full list
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Fila de lançamentos</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {entries.length > 0
              ? `${entries.length} lançamento${entries.length !== 1 ? 's' : ''}`
              : 'Adicione lançamentos à fila'}
          </div>
        </div>
        {entries.length > 0 && (
          <button
            onClick={onCommit}
            disabled={committing}
            style={{
              padding: '8px 16px', borderRadius: 9, border: 'none',
              background: committing ? 'rgba(48,209,88,.3)' : 'var(--green)',
              color: '#fff', fontSize: 12, fontWeight: 700,
              boxShadow: '0 4px 14px rgba(48,209,88,.25)',
              flexShrink: 0, cursor: committing ? 'not-allowed' : 'pointer',
            }}
          >
            {committing ? 'Salvando…' : 'Confirmar todos ✓'}
          </button>
        )}
      </div>

      {/* Empty state */}
      {entries.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 20px', opacity: 0.3, gap: 10, textAlign: 'center',
        }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <line x1="9" y1="12" x2="15" y2="12"/>
            <line x1="9" y1="16" x2="13" y2="16"/>
          </svg>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Fila vazia</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 200 }}>
            Use {'"'}+ Adicionar à fila{'"'} para enfileirar múltiplos lançamentos.
          </div>
        </div>
      ) : (
        <>
          {entries.map(e => (
            <div
              key={e.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12,
                background: 'var(--surface-card)', border: '1px solid rgba(255,255,255,.06)',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0, fontSize: 16,
                background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {e.catIcon || '📋'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.desc || e.catLabel || 'Sem descrição'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 6 }}>
                  <span style={{ background: 'rgba(255,255,255,.06)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>
                    {e.accLabel}
                  </span>
                  <span>{e.dateLabel}</span>
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, flexShrink: 0,
                color: e.tipo === 'entrada' ? 'var(--green)' : 'var(--red)',
              }}>
                {e.tipo === 'entrada' ? '+' : '-'}{formatCurrency(e.amount)}
              </div>
              <button
                onClick={() => onRemove(e.id)}
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(255,69,58,.1)', color: 'var(--red)',
                  fontSize: 13, border: 'none', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          ))}

          {/* Totals */}
          <div style={{ background: 'var(--surface-card)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '13px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { l: 'Entradas', v: totalIn,  c: 'var(--green)' },
                { l: 'Saídas',   v: totalOut, c: 'var(--red)'   },
                { l: 'Saldo',    v: saldo,    c: saldo >= 0 ? 'var(--green)' : 'var(--red)' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                    {s.l}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: s.c, letterSpacing: '-0.01em' }}>
                    {formatCurrency(s.v)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
