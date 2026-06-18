import { type InvoiceSummary } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

interface SummaryCardProps {
  label: string;
  value: string;
  subtitle: string;
  color: string;
}

function SummaryCard({ label, value, subtitle, color }: SummaryCardProps) {
  return (
    <div className="min-w-0 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3.5 py-3">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </div>
      <div
        className="whitespace-nowrap font-[family-name:var(--font-mono)] text-[16px] font-bold [font-variant-numeric:tabular-nums]"
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
        {subtitle}
      </div>
    </div>
  );
}

interface SummaryNoticeProps {
  label: string;
  value: string;
  description: string;
}

function SummaryNotice({ label, value, description }: SummaryNoticeProps) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3.5 rounded-[10px] border border-[rgba(56,161,105,0.25)] bg-[rgba(56,161,105,0.12)] px-3.5 py-3">
      <div className="min-w-0">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--green-400)]">
          {label}
        </div>
        <div className="truncate text-[12px] text-[var(--text-secondary)]">{description}</div>
      </div>
      <div className="whitespace-nowrap font-[family-name:var(--font-mono)] text-[16px] font-bold text-[var(--green-400)] [font-variant-numeric:tabular-nums]">
        {value}
      </div>
    </div>
  );
}

export function InvoiceSummaryCards({ summary }: { summary: InvoiceSummary }) {
  const averageExpense = summary.total_expenses > 0
    ? summary.total_invoice / summary.total_expenses
    : 0;
  const paymentAmount = summary.payment_amount ?? 0;
  const totalOtherCredits = summary.total_other_credits ?? 0;
  const totalOtherCreditsCount = summary.total_other_credits_count ?? 0;

  return (
    <>
      {paymentAmount > 0 && (
        <SummaryNotice
          label="Pagamento recebido"
          value={formatCurrency(paymentAmount)}
          description={summary.payment_description || 'Pagamento da fatura'}
        />
      )}
      <div className="mb-3.5 grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-4">
        <SummaryCard
          label="Total da Fatura"
          value={formatCurrency(summary.total_invoice)}
          subtitle={`${summary.total_expenses} gastos`}
          color="var(--red-400)"
        />
        {totalOtherCredits > 0 && (
          <SummaryCard
            label="Estornos / Reembolsos"
            value={formatCurrency(totalOtherCredits)}
            subtitle={`${totalOtherCreditsCount} créditos`}
            color="var(--green-400)"
          />
        )}
        <SummaryCard
          label="Maior Gasto"
          value={formatCurrency(summary.largest_expense)}
          subtitle={summary.largest_expense_description || 'Sem gastos'}
          color="var(--amber-400)"
        />
        <SummaryCard
          label="Parcelas Futuras"
          value={formatCurrency(summary.future_commitment)}
          subtitle={`${summary.total_installment_count} parceladas · média ${formatCurrency(averageExpense)}`}
          color="var(--blue-400)"
        />
      </div>
    </>
  );
}
