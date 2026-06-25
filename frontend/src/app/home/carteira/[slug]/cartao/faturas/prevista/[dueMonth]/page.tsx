'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { ExpandableCard } from '@/components/ui/expandable-card';
import StatePanel from '@/components/StatePanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api, type PredictedInvoiceItem, type PredictedInvoiceResponse } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { useInstitution } from '@/components/carteira/institution-context';

interface PageProps { params: Promise<{ slug: string; dueMonth: string }> }

function ItemList({ items }: { items: PredictedInvoiceItem[] }) {
  return (
    <ul className="divide-y divide-[var(--separator)]">
      {items.map((item, index) => (
        <li key={`${item.description}-${index}`} className="flex items-start gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-[var(--text-primary)]">{item.description}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
              <span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 font-semibold uppercase tracking-[0.04em]">
                {item.origin === 'installment'
                  ? `Parcela ${item.installment_current}/${item.installment_total}`
                  : 'Recorrente'}
              </span>
              {item.category_name ? <span>{item.category_name}</span> : null}
            </div>
          </div>
          <span className="shrink-0 font-[family-name:var(--font-mono)] text-[13px] font-semibold text-[var(--text-secondary)]">
            {formatCurrency(item.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PredictedInvoicePage({ params }: PageProps) {
  const { slug, dueMonth } = use(params);
  const { cards } = useInstitution();
  const cid = cards[0]?.id ?? 0;

  const [data, setData] = useState<PredictedInvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getPredictedInvoice(cid, dueMonth));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a fatura prevista.');
    } finally {
      setLoading(false);
    }
  }, [cid, dueMonth]);

  useEffect(() => { void load(); }, [load]);

  const installments = useMemo(
    () => (data ? data.items.filter((item) => item.origin === 'installment') : []),
    [data],
  );
  const recurring = useMemo(
    () => (data ? data.items.filter((item) => item.origin === 'recurring') : []),
    [data],
  );

  const backHref = `/home/carteira/${slug}/cartao/faturas`;

  if (loading) return <div className="flex flex-1 items-center justify-center"><LoadingSpinner /></div>;
  if (error) return <StatePanel variant="error" message={error} />;
  if (!data) return <StatePanel variant="error" message="Fatura prevista não encontrada." />;

  const yearStr = dueMonth.slice(0, 4);

  return (
    <div>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--blue-400)] no-underline transition-opacity hover:opacity-80"
      >
        <ChevronLeft size={14} /> Faturas
      </Link>

      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            {data.label}
          </h1>
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
            Prevista
          </span>
        </div>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-[15px] text-[var(--text-secondary)]">
          {yearStr}
        </p>
      </header>

      <div className="mb-5 rounded-[var(--radius-md)] border border-dashed border-[var(--separator)] bg-transparent px-5 py-4">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Projeção baseada na fatura real mais recente. Os itens abaixo ainda não foram importados.
        </p>
        <p className="mt-2 font-[family-name:var(--font-mono)] text-[22px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          {formatCurrency(data.total)}
        </p>
        <span className="text-[11px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Total previsto</span>
      </div>

      <div className="flex flex-col gap-3">
        {installments.length > 0 && (
          <ExpandableCard
            title="Compras parceladas"
            subtitle={`${installments.length} ${installments.length === 1 ? 'item previsto' : 'itens previstos'}`}
            value={formatCurrency(installments.reduce((sum, item) => sum + item.amount, 0))}
            defaultOpen
          >
            <ItemList items={installments} />
          </ExpandableCard>
        )}
        {recurring.length > 0 && (
          <ExpandableCard
            title="Recorrentes"
            subtitle={`${recurring.length} ${recurring.length === 1 ? 'item previsto' : 'itens previstos'}`}
            value={formatCurrency(recurring.reduce((sum, item) => sum + item.amount, 0))}
            defaultOpen
          >
            <ItemList items={recurring} />
          </ExpandableCard>
        )}
      </div>
    </div>
  );
}
