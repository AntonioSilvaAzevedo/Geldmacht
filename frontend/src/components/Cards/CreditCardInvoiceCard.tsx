import Link from "next/link";

import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export interface CreditCardInvoiceCardProps {
  month: string;
  amount: number;
  href?: string;
  predicted?: boolean;
}

export function CreditCardInvoiceCard({ month, amount, href, predicted = false }: CreditCardInvoiceCardProps) {
  const isEmpty = amount === 0;

  const content = (
    <>
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-[13px] font-semibold tracking-[-0.01em]",
            predicted ? "text-[var(--text-tertiary)]" : "text-[var(--text-secondary)]",
          )}
        >
          {month}
        </span>
        {predicted && (
          <span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
            Prevista
          </span>
        )}
      </span>
      <span
        className={cn(
          "mt-1 font-[family-name:var(--font-mono)] text-[20px] font-bold tracking-[-0.02em]",
          predicted || isEmpty ? "text-[var(--text-tertiary)]" : "text-[var(--text-primary)]",
        )}
      >
        {formatCurrency(amount)}
      </span>
    </>
  );

  const base = cn(
    "flex flex-col rounded-[var(--radius-lg)] border px-5 py-4",
    predicted
      ? "border-dashed border-[var(--separator)] bg-transparent"
      : "border-[var(--separator)] bg-[var(--surface-1)]",
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "cursor-pointer no-underline transition-colors duration-150",
          predicted ? "hover:border-white/20 hover:bg-[var(--surface-1)]" : "hover:border-white/15 hover:bg-[#242424]",
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={base}>{content}</div>;
}
