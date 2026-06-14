import Link from "next/link";

import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export interface CreditCardInvoiceCardProps {
  month: string;
  amount: number;
  href?: string;
}

export function CreditCardInvoiceCard({ month, amount, href }: CreditCardInvoiceCardProps) {
  const isEmpty = amount === 0;

  const content = (
    <>
      <span className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-secondary)]">
        {month}
      </span>
      <span
        className={cn(
          "mt-1 font-[family-name:var(--font-mono)] text-[20px] font-bold tracking-[-0.02em]",
          isEmpty ? "text-[var(--text-tertiary)]" : "text-[var(--text-primary)]",
        )}
      >
        {formatCurrency(amount)}
      </span>
    </>
  );

  const base =
    "flex flex-col rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface-1)] px-5 py-4";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "no-underline transition-colors duration-150 hover:border-white/15 hover:bg-[#242424]",
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={base}>{content}</div>;
}
