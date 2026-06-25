import { type ComponentProps } from 'react';
import { AlertTriangle, CheckSquare, Square, TrendingDown, TrendingUp } from 'lucide-react';

import EditableDescription from '@/components/EditableDescription';
import { CategoryBadges } from '@/components/category-badges';
import { type PreviewTransaction } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

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

const SYSTEMIC_CHIP =
  'inline-flex w-fit items-center whitespace-nowrap rounded-md border border-dashed border-[var(--border-default)] bg-white/[0.04] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--text-muted)]';

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
  const isTransfer = tx.is_internal_transfer;

  const amount = (
    <span className="inline-flex items-center gap-1">
      {tx.amount > 0
        ? <TrendingUp size={12} className="text-[var(--green-400)]" aria-hidden />
        : <TrendingDown size={12} className="text-[var(--red-400)]" aria-hidden />}
      <span className={tx.amount >= 0 ? 'value-positive' : 'value-negative'}>
        {formatCurrency(tx.amount)}
      </span>
    </span>
  );

  if (isMobile) {
    return (
      <div
        onClick={() => onToggle(index)}
        className={cn(
          'grid max-w-full min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)] gap-2 rounded-[10px] border px-3 pt-3 pb-2.5',
          isSelected
            ? 'border-[rgba(49,130,206,0.35)] bg-[rgba(49,130,206,0.08)]'
            : 'border-[var(--border-subtle)] bg-[var(--surface-card)]',
          isTransfer && !isSelected && 'opacity-70',
        )}
      >
        <div className="flex min-w-0 items-start justify-between gap-2.5">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <span className={cn('mt-0.5 shrink-0', isSelected ? 'text-[var(--blue-400)]' : 'text-[var(--text-muted)]')}>
              {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-[3px] font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                {formatDate(tx.date)}
              </div>
              <div
                onClick={e => e.stopPropagation()}
                className="text-[13.5px] font-medium text-[var(--text-primary)]"
              >
                <EditableDescription
                  value={description}
                  onSave={val => onDescriptionChange(index, val)}
                />
              </div>
            </div>
          </div>
          <div className="shrink-0 font-[family-name:var(--font-mono)] text-[14px] font-bold whitespace-nowrap">
            {amount}
          </div>
        </div>

        {isInstallment && (
          <div className="inline-flex items-center gap-[5px] text-[11px] text-[var(--blue-400)]">
            <span className="rounded-[5px] border border-[rgba(49,130,206,0.20)] bg-[rgba(49,130,206,0.12)] px-[7px] py-0.5 font-[family-name:var(--font-mono)] font-semibold">
              Parcela {tx.installment_current}/{tx.installment_total}
            </span>
          </div>
        )}

        <div
          onClick={e => e.stopPropagation()}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1 border-t border-dashed border-[var(--border-subtle)] pt-1"
        >
          <span className="text-[10.5px] tracking-[0.06em] text-[var(--text-muted)] uppercase">
            Categoria
          </span>
          {systemicLabel ? (
            <span className={SYSTEMIC_CHIP}>{systemicLabel} · Bloqueado</span>
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

  const cell = 'px-3.5 py-3 align-middle';

  return (
    <tr
      onClick={() => onToggle(index)}
      className={cn(
        'cursor-pointer border-b border-[var(--border-subtle)]',
        isSelected
          ? 'bg-[rgba(49,130,206,0.05)]'
          : isTransfer
            ? 'bg-white/[0.01] opacity-[0.55]'
            : 'bg-transparent',
      )}
    >
      <td className={cn(cell, 'w-10 text-center')}>
        <span className={isSelected ? 'text-[var(--blue-400)]' : 'text-[var(--text-muted)]'}>
          {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
        </span>
      </td>

      <td className={cn(cell, 'w-[92px] font-[family-name:var(--font-mono)] text-[12px] whitespace-nowrap text-[var(--text-muted)]')}>
        {formatDate(tx.date)}
      </td>

      <td className={cn(cell, 'max-w-[260px] min-w-[150px] text-[var(--text-primary)]')} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          {isTransfer && (
            <span title="Transferência interna">
              <AlertTriangle size={13} className="shrink-0 text-[var(--amber-400)]" aria-hidden />
            </span>
          )}
          <EditableDescription
            value={description}
            onSave={val => onDescriptionChange(index, val)}
          />
        </div>
      </td>

      <td className={cn(cell, 'w-[99%]')} onClick={e => e.stopPropagation()}>
        {systemicLabel ? (
          <span
            title="Este lançamento é sistêmico e não pode ser categorizado manualmente."
            className="inline-flex items-center rounded-full border border-dashed border-[var(--border-default)] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-[var(--text-muted)]"
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

      <td className={cn(cell, 'text-right font-[family-name:var(--font-mono)] text-[13px] font-semibold whitespace-nowrap')}>
        <span className="flex items-center justify-end gap-1">{amount}</span>
      </td>
    </tr>
  );
}
