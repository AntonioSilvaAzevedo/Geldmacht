import { type ComponentProps } from 'react';
import { AlertTriangle, CheckSquare, Filter, Square, TrendingDown, TrendingUp } from 'lucide-react';

import EditableDescription from '@/components/EditableDescription';
import { CategoryChoiceSelect } from '@/components/category-choice-select';
import { Button } from '@/components/ui/button';
import { type PreviewTransaction } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';

function previewMovementLabel(tx: PreviewTransaction): string {
  if (tx.transaction_type === 'income') return 'Entrada';
  if (tx.transaction_type === 'expense') return 'Saída';
  return tx.amount >= 0 ? 'Entrada' : 'Saída';
}

interface ReviewTransactionListProps {
  isMobile: boolean;
  isBankStatement: boolean;
  transactions: PreviewTransaction[];
  filteredIndices: number[];
  selected: Set<number>;
  onToggle: (index: number) => void;
  allFilteredSelected: boolean;
  onToggleAll: () => void;
  descriptions: Record<number, string>;
  onDescriptionChange: (index: number, value: string) => void;
  categoryIds: Record<number, number | null>;
  onCategoryChange: (index: number, id: number | null) => void;
  categoryOptions: ComponentProps<typeof CategoryChoiceSelect>['options'];
}

export function ReviewTransactionList({
  isMobile,
  isBankStatement,
  transactions,
  filteredIndices,
  selected,
  onToggle,
  allFilteredSelected,
  onToggleAll,
  descriptions,
  onDescriptionChange,
  categoryIds,
  onCategoryChange,
  categoryOptions,
}: ReviewTransactionListProps) {
  if (isMobile) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {filteredIndices.map(i => {
          const tx = transactions[i];
          const isSelected = selected.has(i);
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
          return (
            <div
              key={i}
              onClick={() => onToggle(i)}
              style={{
                background: isSelected ? 'rgba(49,130,206,0.08)' : 'var(--surface-card)',
                border: `1px solid ${isSelected ? 'rgba(49,130,206,0.35)' : 'var(--border-subtle)'}`,
                borderRadius: 10,
                padding: '12px 12px 10px',
                display: 'grid',
                gap: 8,
                cursor: 'pointer',
                opacity: tx.is_internal_transfer && !isSelected ? 0.7 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
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
                        value={descriptions[i] ?? tx.description}
                        onSave={val => onDescriptionChange(i, val)}
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
                  <CategoryChoiceSelect
                    value={categoryIds[i] ?? null}
                    options={categoryOptions}
                    onChange={id => onCategoryChange(i, id)}
                    maxWidth="100%"
                  />
                )}
              </div>
            </div>
          );
        })}
        {filteredIndices.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>
            <Filter size={22} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
            Nenhum lançamento para este filtro.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 10,
      border: '1px solid var(--border-subtle)',
      overflowY: 'auto',
      flex: 1,
      minHeight: 0,
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-subtle)' }}>
            <th style={{ padding: '10px 12px', width: 40, textAlign: 'center' }}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={`h-auto w-auto border-none bg-transparent p-0 hover:bg-transparent ${allFilteredSelected ? 'text-[var(--blue-400)]' : 'text-[var(--text-muted)]'}`}
                aria-label={allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                title={allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                onClick={onToggleAll}
              >
                {allFilteredSelected
                  ? <CheckSquare className="size-4" aria-hidden />
                  : <Square className="size-4" aria-hidden />}
              </Button>
            </th>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Data</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Descrição</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>{isBankStatement ? 'Tipo' : 'Parcela'}</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Categoria</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {filteredIndices.map(i => {
            const tx = transactions[i];
            const isSelected = selected.has(i);
            const isTransfer = tx.is_internal_transfer;

            return (
              <tr
                key={i}
                onClick={() => onToggle(i)}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background: isSelected
                    ? 'rgba(49,130,206,0.05)'
                    : isTransfer
                    ? 'rgba(255,255,255,0.01)'
                    : 'transparent',
                  cursor: 'pointer',
                  opacity: isTransfer && !isSelected ? 0.55 : 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? 'rgba(49,130,206,0.05)' : isTransfer ? 'rgba(255,255,255,0.01)' : 'transparent';
                }}
              >
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <span style={{ color: isSelected ? 'var(--blue-400)' : 'var(--text-muted)' }}>
                    {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                  </span>
                </td>

                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {formatDate(tx.date)}
                </td>

                <td
                  style={{ padding: '10px 12px', color: 'var(--text-primary)', maxWidth: 300 }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isTransfer && (
                      <span title="Transferência interna">
                        <AlertTriangle size={13} color="var(--amber-400)" style={{ flexShrink: 0 }} />
                      </span>
                    )}
                    <EditableDescription
                      value={descriptions[i] ?? tx.description}
                      onSave={val => onDescriptionChange(i, val)}
                    />
                  </div>
                </td>

                <td
                  style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}
                  title={isBankStatement && tx.source_reference ? `Ref.: ${tx.source_reference}` : undefined}
                >
                  {isBankStatement ? (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: previewMovementLabel(tx) === 'Entrada' ? 'var(--green-400)' : 'var(--red-400)',
                    }}>
                      {previewMovementLabel(tx)}
                    </span>
                  ) : tx.installment_current != null && tx.installment_total != null ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 7px',
                      borderRadius: 5,
                      background: 'rgba(49,130,206,0.12)',
                      border: '1px solid rgba(49,130,206,0.2)',
                      color: 'var(--blue-400)',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {tx.installment_current}/{tx.installment_total}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                  )}
                </td>

                <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                  {(() => {
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
                    if (systemicLabel) {
                      return (
                        <span
                          title="Este lançamento é sistêmico e não pode ser categorizado manualmente."
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px dashed var(--border-default)',
                            color: 'var(--text-muted)',
                            fontSize: 11,
                            fontWeight: 600,
                            maxWidth: 150,
                          }}
                        >
                          {systemicLabel}
                        </span>
                      );
                    }
                    return (
                      <CategoryChoiceSelect
                        value={categoryIds[i] ?? null}
                        options={categoryOptions}
                        onChange={id => onCategoryChange(i, id)}
                        maxWidth={200}
                      />
                    );
                  })()}
                </td>

                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
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
          })}
        </tbody>
      </table>

      {filteredIndices.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Filter size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
          Nenhum lançamento para este filtro.
        </div>
      )}
    </div>
  );
}
