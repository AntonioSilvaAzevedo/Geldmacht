'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api, type CardInvoice, type CreditCardConfig } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface PageProps {
  params: Promise<{ cardId: string }>;
}

export default function CardInvoicesListPage({ params }: PageProps) {
  const { cardId } = use(params);
  const id = Number(cardId);
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
      // Ordena por due_date desc; fallback para due_month
      setInvoices([...invoiceData].sort((a, b) => {
        const da = a.due_date ?? a.due_month;
        const db = b.due_date ?? b.due_month;
        return db.localeCompare(da);
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar faturas.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <>
<main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </main>
      </>
    );
  }
  if (error) return <ErrorState message={error} />;
  if (!card) return <ErrorState message="Cartão não encontrado." />;

  return (
    <>
<main style={{ padding: 24, flex: 1 }}>

        {/* Navegação */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <Link href={`/cartao/${card.id}`} style={{ color: 'var(--blue-400)', fontSize: 13, textDecoration: 'none' }}>
            ← Voltar à visão geral
          </Link>
          <Link href={`/upload?type=credit_card&cardId=${card.id}`} style={primaryLinkStyle}>
            <Upload size={14} /> Importar nova fatura
          </Link>
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            title="Nenhuma fatura importada para este cartão."
            description="Importe uma fatura para começar a visualizar os lançamentos."
            actionHref={`/upload?type=credit_card&cardId=${card.id}`}
            actionLabel="Importar fatura"
          />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {invoices.map(invoice => (
              <Link
                key={invoice.id}
                href={`/cartao/${card.id}/fatura/${invoice.id}`}
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{invoice.label}</div>
                  {invoice.due_date && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                      Vence em {formatDate(invoice.due_date)}
                    </div>
                  )}
                  {invoice.cycle_start_date && invoice.cycle_end_date && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                      Período: {formatDate(invoice.cycle_start_date)} a {formatDate(invoice.cycle_end_date)}
                    </div>
                  )}
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>
                    {invoice.transactions_count} lançamentos
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {invoice.total_amount != null ? (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                        Total da fatura (PDF)
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--red-400)', fontWeight: 700, fontSize: 15 }}>
                        {formatCurrency(invoice.total_amount)}
                      </div>
                      {Math.abs(invoice.total_amount - invoice.computed_total) > 0.01 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          Soma dos gastos (lanç.): {formatCurrency(invoice.computed_total)}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                        Soma dos gastos
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--red-400)', fontWeight: 700, fontSize: 15 }}>
                        {formatCurrency(invoice.computed_total)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Total do PDF não identificado nesta importação.
                      </div>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '9px 12px',
  borderRadius: 8,
  background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 600,
};
