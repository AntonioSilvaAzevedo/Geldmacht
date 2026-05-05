'use client';

/**
 * Rota legada: /cartao/[cardId]/[anoMes]
 *
 * Mantida para compatibilidade com links já existentes.
 * Tenta buscar a invoice pelo due_month via GET /api/cards/{cardId}/invoices-by-month/{due_month}
 * e exibe os dados com a mesma interface da rota preferencial /cartao/[cardId]/fatura/[invoiceId].
 *
 * Se a invoice não for encontrada (dados muito antigos sem invoice_id),
 * faz fallback para o endpoint legado /api/transactions/invoice?card_id=X&month=Y.
 */

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';
import EditableDescription from '@/components/EditableDescription';
import Header from '@/components/Layout/Header';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { api, type CardInvoiceDetail, type CreditCardConfig, type InvoiceSummary } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { formatReferenceMonth } from '@/lib/cardDates';
import type { Transaction } from '@/types/financial';

interface PageProps {
  params: Promise<{ cardId: string; anoMes: string }>;
}

interface CategoryGroup {
  key: string;
  label: string;
  total: number;
  transactions: Transaction[];
}

export default function CardInvoicePage({ params }: PageProps) {
  const { cardId, anoMes } = use(params);
  const id = Number(cardId);

  const [card, setCard] = useState<CreditCardConfig | null>(null);
  const [invoice, setInvoice] = useState<CardInvoiceDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cardData = await api.getCard(id);
      setCard(cardData);

      // Tenta buscar pelo due_month (nova entidade Invoice)
      try {
        const invoiceData = await api.getCardInvoiceByMonth(id, anoMes);
        setInvoice(invoiceData);
        setTransactions(invoiceData.transactions);
        setSummary(invoiceData.summary);
      } catch {
        // Fallback legado: busca por reference_month nas transactions
        const legacyData = await api.getCardInvoiceByCard(id, anoMes);
        setTransactions(legacyData.transactions);
        setSummary(legacyData.summary);
        setInvoice(null);
      }

      setOpenGroups(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fatura.');
    } finally {
      setLoading(false);
    }
  }, [id, anoMes]);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo<CategoryGroup[]>(() => {
    const grouped = new Map<string, CategoryGroup>();
    transactions
      .filter(tx => tx.amount < 0)
      .forEach(tx => {
        const label = tx.category_name || tx.category || 'Sem categoria';
        const key = tx.category_id != null ? `category-${tx.category_id}` : `label-${label}`;
        const current = grouped.get(key) ?? { key, label, total: 0, transactions: [] };
        current.total += Math.abs(tx.amount);
        current.transactions.push(tx);
        grouped.set(key, current);
      });
    return [...grouped.values()].sort((a, b) => b.total - a.total);
  }, [transactions]);

  async function handleDescSave(txId: number, description: string) {
    await api.updateTransaction(txId, { description });
    setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, description } : tx));
  }

  function toggleGroup(key: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Título: prioriza due_date da invoice; fallback para formatReferenceMonth
  function buildTitle(): string {
    if (invoice?.due_date) {
      const d = new Date(invoice.due_date + 'T12:00:00');
      const month = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return `Fatura com vencimento em ${month.charAt(0).toUpperCase() + month.slice(1)}`;
    }
    return `Fatura ${formatReferenceMonth(anoMes)}`;
  }

  if (loading) {
    return (
      <>
        <Header title="Fatura do cartão" subtitle="Carregando..." />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </main>
      </>
    );
  }
  if (error) return <ErrorState message={error} />;
  if (!card) return <ErrorState message="Cartão não encontrado." />;

  if (transactions.length === 0) {
    return (
      <>
        <Header title={buildTitle()} subtitle={card.name} />
        <main style={{ flex: 1 }}>
          <EmptyState
            title="Fatura não encontrada."
            message="Não há lançamentos reais para este cartão e mês."
            actionHref={`/cartao/${card.id}`}
            actionLabel="Voltar ao cartão"
          />
        </main>
      </>
    );
  }

  const title = buildTitle();
  const hasPdfTotal = invoice?.total_amount != null;
  const ledgerGrossExpenses = summary?.total_invoice ?? 0;
  const pdfVsLedgerDiff =
    hasPdfTotal && invoice ? Math.abs(invoice.total_amount! - ledgerGrossExpenses) : 0;
  const showLedgerNote = hasPdfTotal && pdfVsLedgerDiff > 0.01;

  return (
    <>
      <Header title={title} subtitle={card.name} />
      <main style={{ padding: 24, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <Link href={`/cartao/${card.id}`} style={{ color: 'var(--blue-400)', fontSize: 13, textDecoration: 'none' }}>
            ← Voltar ao cartão
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {invoice && (
              <Link href={`/cartao/${card.id}/fatura/${invoice.id}`} style={{ color: 'var(--blue-400)', fontSize: 12, textDecoration: 'none' }}>
                Abrir por ID
              </Link>
            )}
            <Link href={`/upload?type=credit_card&cardId=${card.id}`} style={primaryLinkStyle}>
              Importar nova fatura
            </Link>
          </div>
        </div>

        {/* Cabeçalho da fatura — mostra metadados reais quando disponíveis */}
        {invoice && (invoice.due_date || invoice.cycle_start_date) && (
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '16px 18px',
            marginBottom: 18,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 24px',
          }}>
            {invoice.due_date && (
              <div style={metaItem}>
                <span style={metaLabel}>Vence em</span>
                <span style={{ ...metaValue, color: 'var(--blue-400)' }}>{formatDate(invoice.due_date)}</span>
              </div>
            )}
            {invoice.cycle_start_date && invoice.cycle_end_date && (
              <div style={metaItem}>
                <span style={metaLabel}>Período da fatura</span>
                <span style={metaValue}>
                  {formatDate(invoice.cycle_start_date)} a {formatDate(invoice.cycle_end_date)}
                </span>
              </div>
            )}
          </div>
        )}

        {showLedgerNote && summary && (
          <p style={{
            margin: '-8px 0 18px',
            fontSize: 12,
            lineHeight: 1.45,
            color: 'var(--text-muted)',
            maxWidth: 720,
          }}>
            Conferência: soma apenas das compras nas linhas importadas é{' '}
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {formatCurrency(ledgerGrossExpenses)}
            </strong>
            . Isso não é o “total a pagar” do banco quando há IOF/créditos já descontados no resumo.
          </p>
        )}

        {/* Métricas — primeiro card: total oficial do PDF quando existir */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          {hasPdfTotal && invoice ? (
            <MetricCard
              label="Total da fatura (PDF)"
              value={formatCurrency(invoice.total_amount!)}
              color="var(--red-400)"
              valueSize={22}
            />
          ) : (
            <MetricCard label="Soma dos gastos (lançamentos)" value={formatCurrency(summary?.total_invoice ?? 0)} color="var(--red-400)" />
          )}
          <MetricCard label="Estornos / Reembolsos" value={formatCurrency(summary?.total_other_credits ?? 0)} color="var(--green-400)" />
          <MetricCard label="Maior gasto" value={formatCurrency(summary?.largest_expense ?? 0)} color="var(--amber-400)" />
          <MetricCard label="Parcelas futuras" value={formatCurrency(summary?.future_commitment ?? 0)} color="var(--blue-400)" />
        </div>

        {(summary?.payment_amount ?? 0) > 0 && (
          <div style={{
            background: 'rgba(56,161,105,0.12)',
            border: '1px solid rgba(56,161,105,0.25)',
            borderRadius: 12,
            padding: '13px 16px',
            marginBottom: 18,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <TrendingUp size={16} color="var(--green-400)" />
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>Pagamento recebido</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{summary?.payment_description}</div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--green-400)', fontWeight: 700 }}>
              {formatCurrency(summary?.payment_amount ?? 0)}
            </div>
          </div>
        )}

        {/* Categorias */}
        <section style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
            Categorias
          </h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {groups.map(group => (
              <div key={group.key} style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <button onClick={() => toggleGroup(group.key)} style={{
                  width: '100%',
                  padding: '13px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {openGroups.has(group.key)
                      ? <ChevronDown size={15} color="var(--text-muted)" />
                      : <ChevronRight size={15} color="var(--text-muted)" />
                    }
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{group.label}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {group.transactions.length} lançamento{group.transactions.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--red-400)', fontWeight: 700 }}>
                    {formatCurrency(group.total)}
                  </div>
                </button>
                {openGroups.has(group.key) && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {group.transactions.map(tx => (
                      <div key={tx.id} style={{
                        padding: '10px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        borderBottom: '1px solid var(--border-subtle)',
                      }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0, flex: 1 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 11 }}>
                            {formatDate(tx.date)}
                          </span>
                          <EditableDescription
                            value={tx.description}
                            onSave={value => handleDescSave(tx.id, value)}
                            textStyle={{ fontSize: 13, color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--red-400)', fontWeight: 600, fontSize: 13 }}>
                          {formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function MetricCard({
  label,
  value,
  color,
  valueSize = 18,
}: {
  label: string;
  value: string;
  color: string;
  valueSize?: number;
}) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: valueSize, color }}>
        {value}
      </div>
    </div>
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

const metaItem: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const metaLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const metaValue: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-primary)',
};
