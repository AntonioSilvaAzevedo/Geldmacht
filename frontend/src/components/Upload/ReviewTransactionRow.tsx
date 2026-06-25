import { type ComponentProps, type CSSProperties } from 'react';
import { AlertTriangle, CheckSquare, Square, TrendingDown, TrendingUp } from 'lucide-react';

import EditableDescription from '@/components/EditableDescription';
import { CategoryBadges } from '@/components/category-badges';
import { type PreviewTransaction } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';

export interface ReviewTransactionRowProps {
  tx: PreviewTransaction;
  index: number;
  isMobile: boolean;
  isSelected: boolean;
  onToggle: (index: number) => void;
  description: string;
  onDescriptionChange: (index: number, value: string) => void;
  categoryId: number | null;
  onCategoryChange: (index: number, id: number | null) => void;
  categoryOptions: ComponentProps<typeof CategoryBadges>['options'];
}

export function ReviewTransactionRow({
  tx,
  index,
  isMobile,
  isSelected,
  onToggle,
  description,
  onDescriptionChange,
  categoryId,
  onCategoryChange,
  categoryOptions,
}: ReviewTransactionRowProps) {
  const isInstallment =
    tx.installment_current != null &&
    tx.installment_total != null &&
    tx.installment_total > 1;
  const isPayment = !!tx.is_payment;
  const systemicLabel = isPayment
    ? 'Pagamento da fatura'
    : isInstallment
      ? 'Compra parcelada'
      : null;

  if (isMobile) {
    return (
      <div
        onClick={() => onToggle(index)}
        style={{
          background: isSelected ? 'rgba(49,130,206,0.08)' : 'var(--surface-card)',
          border: `1px solid ${isSelected ? 'rgba(49,130,206,0.35)' : 'var(--border-subtle)'}`,
          borderRadius: 10,
          padding: '12px 12px 10px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 8,
          minWidth: 0,
          maxWidth: '100%',
          cursor: 'pointer',
          opacity: tx.is_internal_transfer && !isSelected ? 0.7 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
            <span style={{ color: isSelected ? 'var(--blue-400)' : 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
              {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 3,
              }}>
                {formatDate(tx.date)}
              </div>
              <div onClick={e => e.stopPropagation()}>
                <EditableDescription
                  value={description}
                  onSave={val => onDescriptionChange(index, val)}
                  textStyle={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {tx.amount > 0
                ? <TrendingUp size={12} color="var(--green-400)" />
                : <TrendingDown size={12} color="var(--red-400)" />
              }
              <span className={tx.amount >= 0 ? 'value-positive' : 'value-negative'}>
                {formatCurrency(tx.amount)}
              </span>
            </span>
          </div>
        </div>

        {isInstallment && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            color: 'var(--blue-400)',
          }}>
            <span style={{
              padding: '2px 7px',
              borderRadius: 5,
              background: 'rgba(49,130,206,0.12)',
              border: '1px solid rgba(49,130,206,0.20)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}>
              Parcela {tx.installment_current}/{tx.installment_total}
            </span>
          </div>
        )}

        <div onClick={e => e.stopPropagation()} style={{
          display: 'grid', gap: 4,
          gridTemplateColumns: 'minmax(0, 1fr)',
          minWidth: 0,
          paddingTop: 4,
          borderTop: '1px dashed var(--border-subtle)',
        }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Categoria
          </span>
          {systemicLabel ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 10px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px dashed var(--border-default)',
              color: 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              width: 'fit-content',
            }}>
              {systemicLabel} · Bloqueado
            </span>
          ) : (
            <CategoryBadges
              value={categoryId}
              options={categoryOptions}
              onChange={id => onCategoryChange(index, id)}
            />
          )}
        </div>
      </div>
    );
  }

  const isTransfer = tx.is_internal_transfer;

  const rowBg = isSelected
    ? 'rgba(49,130,206,0.05)'
    : isTransfer
      ? 'rgba(255,255,255,0.01)'
      : 'transparent';
  const cell: CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' };

  return (
    <tr
      onClick={() => onToggle(index)}
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: rowBg,
        cursor: 'pointer',
        opacity: isTransfer && !isSelected ? 0.55 : 1,
      }}
    >
      <td style={{ ...cell, textAlign: 'center', width: 40 }}>
        <span style={{ color: isSelected ? 'var(--blue-400)' : 'var(--text-muted)' }}>
          {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
        </span>
      </td>

      <td style={{ ...cell, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 12, width: 92 }}>
        {formatDate(tx.date)}
      </td>

      <td style={{ ...cell, color: 'var(--text-primary)', maxWidth: 260, minWidth: 150 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isTransfer && (
            <span title="Transferência interna">
              <AlertTriangle size={13} color="var(--amber-400)" style={{ flexShrink: 0 }} />
            </span>
          )}
          <EditableDescription
            value={description}
            onSave={val => onDescriptionChange(index, val)}
          />
        </div>
      </td>

      <td style={{ ...cell, width: '99%' }} onClick={e => e.stopPropagation()}>
        {systemicLabel ? (
          <span
            title="Este lançamento é sistêmico e não pode ser categorizado manualmente."
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              border: '1px dashed var(--border-default)',
              color: 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {isInstallment ? `Parcela ${tx.installment_current}/${tx.installment_total}` : systemicLabel} · Bloqueado
          </span>
        ) : (
          <CategoryBadges
            value={categoryId}
            options={categoryOptions}
            onChange={id => onCategoryChange(index, id)}
            maxInline={3}
            inlineThreshold={4}
          />
        )}
      </td>

      <td style={{ ...cell, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          {tx.amount > 0
            ? <TrendingUp size={12} color="var(--green-400)" />
            : <TrendingDown size={12} color="var(--red-400)" />
          }
          <span className={tx.amount >= 0 ? 'value-positive' : 'value-negative'}>
            {formatCurrency(tx.amount)}
          </span>
        </span>
      </td>
    </tr>
  );
}
