'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatePanel from '@/components/StatePanel';
import { PageBreadcrumb } from '@/components/ui/breadcrumb';
import { CreditCardInvoiceCard } from '@/components/Cards/CreditCardInvoiceCard';
import { api, type CardInvoice, type CreditCardConfig } from '@/lib/api';
import { useIsMobile } from '@/hooks/useIsMobile';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toSlug(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase());
}

interface PageProps {
  params: Promise<{ cardId: string }>;
}

export default function CardInvoicesListPage({ params }: PageProps) {
  const { cardId } = use(params);
  const id = Number(cardId);
  const isMobile = useIsMobile();

  const [card, setCard] = useState<CreditCardConfig | null>(null);
  const [invoices, setInvoices] = useState<CardInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardData, invoiceData] = await Promise.all([
        api.getCard(id),
        api.getCardInvoices(id),
      ]);
      setCard(cardData);
      setInvoices(invoiceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar faturas.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const year = useMemo(() => {
    const months = invoices.map(i => i.due_month).filter(Boolean).sort();
    const latest = months[months.length - 1];
    return latest ? Number(latest.slice(0, 4)) : new Date().getFullYear();
  }, [invoices]);

  const monthCards = useMemo(() => MONTHS.map((label, idx) => {
    const key = `${year}-${String(idx + 1).padStart(2, '0')}`;
    const invoice = invoices.find(i => i.due_month === key);
    const amount = invoice ? (invoice.total_amount ?? invoice.computed_total) : 0;
    const href = invoice ? `/home/cartao/${id}/fatura/${invoice.id}` : undefined;
    return { label, amount, href };
  }), [invoices, year, id]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <LoadingSpinner />
      </main>
    );
  }
  if (error) return <StatePanel variant="error" message={error} />;
  if (!card) return <StatePanel variant="error" message="Cartão não encontrado." />;

  const institutionSlug = card.institution ? toSlug(card.institution) : null;

  return (
    <>
      <PageBreadcrumb
        items={[
          { href: '/home/carteira', label: 'Carteira' },
          ...(card.institution && institutionSlug
            ? [{ href: `/home/carteira/${institutionSlug}/resumo`, label: card.institution }]
            : []),
          { href: `/home/cartao/${card.id}`, label: card.name },
        ]}
        currentPage="Faturas"
        px={isMobile ? 14 : 28}
      />

      <main className="mx-auto w-full max-w-[860px] flex-1 px-3.5 pb-8 pt-5 sm:px-7">
        <header className="mb-5">
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            Faturas
          </h1>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[15px] text-[var(--text-secondary)]">
            {year}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {monthCards.map(m => (
            <CreditCardInvoiceCard
              key={m.label}
              month={m.label}
              amount={m.amount}
              href={m.href}
            />
          ))}
        </div>
      </main>
    </>
  );
}
