'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';

import EmptyState from '@/components/EmptyState';
import { formatCurrency } from '@/lib/formatters';
import type { CardDashboard, CardInvoice, CreditCardConfig } from '@/lib/api';

interface CardPanelProps {
  card: CreditCardConfig;
  dashboard: CardDashboard | undefined;
  invoices: CardInvoice[];
  color: string;
}

function CardVisual({ card, dashboard, color }: {
  card: CreditCardConfig;
  dashboard: CardDashboard | undefined;
  color: string;
}) {
  const invoice = dashboard?.latest_invoice?.computed_total ?? 0;
  return (
    <div
      className="relative mb-3 overflow-hidden rounded-[16px] px-6 pb-5 pt-[22px]"
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}
    >
      <div className="pointer-events-none absolute -right-[30px] -top-[30px] size-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-10 right-[60px] size-[110px] rounded-full bg-white/[0.07]" />

      <div className="mb-[14px] text-[10px] font-semibold uppercase tracking-[0.09em] text-white/70">
        Cartão de Crédito
      </div>

      <div className="mb-1 text-[22px] font-bold tracking-[-0.02em]">{card.name}</div>
      <div className="mb-6 text-[14px] text-white/65">{card.institution ?? ''}</div>

      <div className="flex items-end justify-between">
        <div>
          <div className="mb-[5px] text-[10px] font-semibold uppercase tracking-[0.09em] text-white/65">
            Fatura atual
          </div>
          <div className="font-[family-name:var(--font-mono)] text-[28px] font-bold leading-none tracking-[-0.025em]">
            {formatCurrency(invoice)}
          </div>
        </div>
        {card.credit_limit != null && (
          <div className="text-right">
            <div className="mb-[5px] text-[10px] font-semibold uppercase tracking-[0.09em] text-white/55">
              Limite
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[18px] font-bold leading-none tracking-[-0.02em]">
              {formatCurrency(card.credit_limit)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoTiles({ card, dashboard }: { card: CreditCardConfig; dashboard: CardDashboard | undefined }) {
  const invoice    = dashboard?.latest_invoice?.computed_total ?? 0;
  const disponivel = (card.credit_limit ?? 0) - invoice;
  const hasLimit   = card.credit_limit != null;

  const tiles = [
    { label: 'Fecha dia', value: String(card.closing_day), color: 'var(--text-primary)', mono: false },
    { label: 'Vence dia', value: String(card.due_day),     color: 'var(--text-primary)', mono: false },
    hasLimit
      ? { label: 'Disponível', value: formatCurrency(disponivel), color: disponivel > 0 ? 'var(--green)' : 'var(--red)', mono: true }
      : { label: 'Fatura',     value: formatCurrency(invoice),    color: 'var(--red)', mono: true },
  ];

  return (
    <div className="mb-3 grid grid-cols-3 gap-2">
      {tiles.map((tile, i) => (
        <div key={i} className="rounded-[14px] bg-[var(--surface-2)] px-4 py-[14px] text-center">
          <div className="mb-2 text-[12px] tracking-[-0.005em] text-[var(--text-secondary)]">
            {tile.label}
          </div>
          <div
            className={`font-bold leading-none tracking-[-0.02em] ${tile.mono ? 'font-[family-name:var(--font-mono)] text-[15px]' : 'text-[22px]'}`}
            style={{ color: tile.color }}
          >
            {tile.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentInvoiceRows({ card, invoices }: { card: CreditCardConfig; invoices: CardInvoice[] }) {
  return (
    <div className="border-t border-white/[0.07]">
      <div className="px-5 pb-[6px] pt-[10px] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        Faturas recentes
      </div>
      {invoices.slice(0, 5).map((inv, i) => (
        <Link key={inv.id} href={`/cartao/${card.id}/fatura/${inv.id}`} className="block text-inherit no-underline">
          <div className={`flex items-center justify-between px-5 py-[10px] transition-colors hover:bg-white/[0.03] ${i < Math.min(invoices.length - 1, 4) ? 'border-b border-white/[0.07]' : ''}`}>
            <div className="text-[13px] text-[var(--text-primary)]">{inv.label}</div>
            <div className="flex items-center gap-3">
              <span className="font-[family-name:var(--font-mono)] text-[13px] font-semibold text-[var(--red)]">
                {formatCurrency(inv.computed_total)}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">{inv.transactions_count} itens</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CardActionButtons({ cardId }: { cardId: number }) {
  return (
    <div className="flex gap-[10px] border-t border-white/[0.07] px-4 py-[14px]">
      <Link
        href={`/cartao/${cardId}`}
        className="flex-1 rounded-[12px] bg-[var(--blue)] py-[13px] text-center text-[15px] font-bold tracking-[-0.01em] text-white no-underline transition-opacity hover:opacity-[0.88]"
      >
        Ver todas as faturas
      </Link>
      <Link
        href={`/upload?type=credit_card&cardId=${cardId}`}
        className="flex-1 rounded-[12px] border border-white/10 bg-[var(--surface-2)] py-[13px] text-center text-[14px] font-medium tracking-[-0.01em] text-[var(--text-secondary)] no-underline transition-colors hover:bg-[#3A3A3C] hover:text-white"
      >
        Importar fatura PDF
      </Link>
    </div>
  );
}

export default function CardPanel({ card, dashboard, invoices, color }: CardPanelProps) {
  const hasInvoices = invoices.length > 0;

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-[var(--surface-card)]">
      <div className="px-4 pt-4">
        <CardVisual card={card} dashboard={dashboard} color={color} />
        <InfoTiles card={card} dashboard={dashboard} />
      </div>
      {hasInvoices ? (
        <>
          <RecentInvoiceRows card={card} invoices={invoices} />
          <CardActionButtons cardId={card.id} />
        </>
      ) : (
        <div className="border-t border-white/[0.07]">
          <EmptyState
            icon={<Receipt size={24} />}
            title="Nenhuma fatura encontrada"
            description="Você ainda não possui faturas cadastradas ou importadas para este cartão."
            actionHref={`/upload?type=credit_card&cardId=${card.id}`}
            actionLabel="Importar fatura"
          />
        </div>
      )}
    </div>
  );
}
