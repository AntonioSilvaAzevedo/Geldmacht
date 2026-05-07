'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, TrendingUp, Layers } from 'lucide-react';
import EditableDescription from '@/components/EditableDescription';
import CategoryIcon from '@/components/CategoryIcon';
import Header from '@/components/Layout/Header';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { api, type CardInvoiceDetail, type CreditCardConfig, type Category } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Transaction } from '@/types/financial';

interface PageProps {
  params: Promise<{ cardId: string; invoiceId: string }>;
}

interface CategoryGroup {
  key: string;
  label: string;
  icon: string | null;
  total: number;
  transactions: Transaction[];
}

interface InstallmentInfo {
  tx: Transaction;
  futureCount: number;
  futureAmount: number;
}

function buildTitle(invoice: CardInvoiceDetail): string {
  if (invoice.due_date) {
    const d = new Date(invoice.due_date + 'T12:00:00');
    const month = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return `Fatura com vencimento em ${month.charAt(0).toUpperCase() + month.slice(1)}`;
  }
  const [year, mon] = invoice.due_month.split('-');
  const labels: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
  };
  return `Fatura com vencimento em ${labels[mon] ?? mon}/${year}`;
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const { cardId, invoiceId } = use(params);
  const cid = Number(cardId);
  const iid = Number(invoiceId);

  const [card, setCard] = useState<CreditCardConfig | null>(null);
  const [invoice, setInvoice] = useState<CardInvoiceDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recategorize state: txId → category_id being edited
  const [recatEdit, setRecatEdit] = useState<number | null>(null); // txId currently open
  const [recatSaving, setRecatSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardData, invoiceData, catData] = await Promise.all([
        api.getCard(cid),
        api.getCardInvoiceDetail(cid, iid),
        api.listCategories('credit_card'),
      ]);
      setCard(cardData);
      setInvoice(invoiceData);
      setTransactions(invoiceData.transactions);
      setCategories(catData);
      setOpenGroups(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fatura.');
    } finally {
      setLoading(false);
    }
  }, [cid, iid]);

  useEffect(() => { void load(); }, [load]);

  // ── Category groups ──────────────────────────────────────────────────────────
  const groups = useMemo<CategoryGroup[]>(() => {
    const grouped = new Map<string, CategoryGroup>();
    transactions
      .filter(tx => tx.amount < 0)
      .forEach(tx => {
        const label = tx.category_name || tx.category || 'Sem categoria';
        const key = tx.category_id != null ? `category-${tx.category_id}` : 'uncategorized';
        const catObj = categories.find(c => c.id === tx.category_id) ?? null;
        const current = grouped.get(key) ?? {
          key,
          label,
          icon: catObj?.icon ?? null,
          total: 0,
          transactions: [],
        };
        current.total += Math.abs(tx.amount);
        current.transactions.push(tx);
        grouped.set(key, current);
      });
    return [...grouped.values()].sort((a, b) => b.total - a.total);
  }, [transactions, categories]);

  // ── Installment info ─────────────────────────────────────────────────────────
  const installments = useMemo<InstallmentInfo[]>(() => {
    return transactions
      .filter(tx =>
        tx.amount < 0 &&
        tx.installment_current != null &&
        tx.installment_total != null &&
        tx.installment_total > 1
      )
      .map(tx => {
        const futureCount = (tx.installment_total ?? 0) - (tx.installment_current ?? 0);
        const futureAmount = Math.abs(tx.amount) * futureCount;
        return { tx, futureCount, futureAmount };
      });
  }, [transactions]);

  const installmentsTotalHere = useMemo(
    () => installments.reduce((acc, i) => acc + Math.abs(i.tx.amount), 0),
    [installments]
  );

  const installmentsFutureTotal = useMemo(
    () => installments.reduce((acc, i) => acc + i.futureAmount, 0),
    [installments]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleDescSave(txId: number, description: string) {
    await api.updateTransaction(txId, { description });
    setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, description } : tx));
  }

  async function handleCategorySave(txId: number, categoryId: number | null) {
    setRecatSaving(true);
    try {
      const updated = await api.updateTransaction(txId, {
        category_id: categoryId ?? 0,
      });
      setTransactions(prev => prev.map(tx =>
        tx.id === txId
          ? {
              ...tx,
              category_id: updated.category_id,
              category: updated.category,
              category_name: updated.category_name,
            }
          : tx
      ));
      setRecatEdit(null);
    } finally {
      setRecatSaving(false);
    }
  }

  function toggleGroup(key: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

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
  if (!card || !invoice) return <ErrorState message="Fatura não encontrada." />;

  if (transactions.length === 0) {
    return (
      <>
        <Header title={buildTitle(invoice)} subtitle={card.name} />
        <main style={{ flex: 1 }}>
          <EmptyState
            title="Nenhum lançamento nesta fatura."
            message="Não há lançamentos importados para esta fatura."
            actionHref={`/cartao/${card.id}`}
            actionLabel="Voltar ao cartão"
          />
        </main>
      </>
    );
  }

  const summary = invoice.summary;
  const title = buildTitle(invoice);
  const hasPdfTotal = invoice.total_amount != null;
  const ledgerGrossExpenses = summary.total_invoice;
  const pdfVsLedgerDiff = hasPdfTotal ? Math.abs(invoice.total_amount! - ledgerGrossExpenses) : 0;
  const showLedgerNote = hasPdfTotal && pdfVsLedgerDiff > 0.01;

  return (
    <>
      <Header title={title} subtitle={card.name} />
      <main style={{ padding: 24, flex: 1 }}>

        {/* Navegação */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <Link href={`/cartao/${card.id}`} style={{ color: 'var(--blue-400)', fontSize: 13, textDecoration: 'none' }}>
            ← Voltar ao cartão
          </Link>
          <Link href={`/upload?type=credit_card&cardId=${card.id}`} style={primaryLinkStyle}>
            Importar nova fatura
          </Link>
        </div>

        {/* Cabeçalho de datas */}
        {(invoice.due_date || (invoice.cycle_start_date && invoice.cycle_end_date)) && (
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

        {showLedgerNote && (
          <p style={{ margin: '-8px 0 18px', fontSize: 12, lineHeight: 1.45, color: 'var(--text-muted)', maxWidth: 720 }}>
            Conferência: soma apenas das compras nos lançamentos importados é{' '}
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {formatCurrency(ledgerGrossExpenses)}
            </strong>
            . Isso não é o total a pagar do banco quando há IOF ou créditos já descontados no resumo.
          </p>
        )}

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          {hasPdfTotal ? (
            <MetricCard label="Total da fatura (PDF)" value={formatCurrency(invoice.total_amount!)} color="var(--red-400)" valueSize={22} />
          ) : (
            <MetricCard label="Soma dos gastos (lançamentos)" value={formatCurrency(summary.total_invoice)} color="var(--red-400)" />
          )}
          <MetricCard label="Estornos / Reembolsos" value={formatCurrency(summary.total_other_credits)} color="var(--green-400)" />
          <MetricCard label="Maior gasto" value={formatCurrency(summary.largest_expense)} color="var(--amber-400)" />
          <MetricCard label="Parcelas futuras" value={formatCurrency(summary.future_commitment)} color="var(--blue-400)" />
        </div>

        {/* Pagamento recebido */}
        {summary.payment_amount > 0 && (
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
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{summary.payment_description}</div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--green-400)', fontWeight: 700 }}>
              {formatCurrency(summary.payment_amount)}
            </div>
          </div>
        )}

        {/* ── Compras parceladas (accordion: resumo + lista) ───────────────── */}
        {installments.length > 0 && (
          <section style={{ marginBottom: 18 }}>
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <button
                type="button"
                onClick={() => setInstallmentsOpen(v => !v)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                aria-expanded={installmentsOpen}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {installmentsOpen
                    ? <ChevronDown size={15} color="var(--text-muted)" />
                    : <ChevronRight size={15} color="var(--text-muted)" />
                  }
                  <span style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'rgba(49,130,206,0.1)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Layers size={14} color="var(--blue-400)" />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                      Compras parceladas
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                      {installments.length} lançamento{installments.length !== 1 ? 's' : ''} · Nesta fatura{' '}
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(installmentsTotalHere)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-400)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {formatCurrency(installmentsTotalHere)}
                </div>
              </button>

              {installmentsOpen && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 16px 16px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 10,
                    marginBottom: 14,
                  }}>
                    <MetricCard label="Nesta fatura" value={formatCurrency(installmentsTotalHere)} color="var(--blue-400)" />
                    <MetricCard label="Parcelas futuras estimadas" value={formatCurrency(installmentsFutureTotal)} color="var(--amber-400)" />
                    <MetricCard label="Lançamentos parcelados" value={String(installments.length)} color="var(--text-secondary)" />
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    {installments.map(({ tx, futureCount, futureAmount }) => (
                      <div key={tx.id} style={{
                        background: 'rgba(49,130,206,0.06)',
                        border: '1px solid rgba(49,130,206,0.2)',
                        borderRadius: 10,
                        padding: '12px 14px',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '4px 16px',
                        alignItems: 'start',
                      }}>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>
                            {tx.description}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                            Parcela{' '}
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-400)', fontWeight: 600 }}>
                              {tx.installment_current} de {tx.installment_total}
                            </span>
                            {' · '}{formatDate(tx.date)}
                          </div>
                          {futureCount > 0 && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>
                              {futureCount} parcela{futureCount !== 1 ? 's' : ''} futura{futureCount !== 1 ? 's' : ''} estimadas:{' '}
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-400)' }}>
                                {formatCurrency(futureAmount)}
                              </span>
                            </div>
                          )}
                          {futureCount === 0 && (
                            <div style={{ color: 'var(--green-400)', fontSize: 11, marginTop: 3 }}>
                              Última parcela ✓
                            </div>
                          )}
                        </div>
                        <div style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--red-400)',
                          fontWeight: 700,
                          fontSize: 14,
                        }}>
                          {formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Seção: Categorias ────────────────────────────────────────────── */}
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
                    <span style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: 'rgba(49,130,206,0.1)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <CategoryIcon icon={group.icon} size={14} color="var(--blue-400)" />
                    </span>
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
                        borderBottom: '1px solid var(--border-subtle)',
                      }}>
                        {/* Linha principal: data + descrição + valor */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0, flex: 1 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
                              {formatDate(tx.date)}
                            </span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <EditableDescription
                                value={tx.description}
                                onSave={value => handleDescSave(tx.id, value)}
                                textStyle={{ fontSize: 13, color: 'var(--text-primary)' }}
                              />
                              {tx.installment_current != null && tx.installment_total != null && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  marginTop: 2,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: 'rgba(49,130,206,0.1)',
                                  color: 'var(--blue-400)',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  fontFamily: 'var(--font-mono)',
                                }}>
                                  {tx.installment_current}/{tx.installment_total}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--red-400)', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                            {formatCurrency(tx.amount)}
                          </div>
                        </div>

                        {/* Recategorizar */}
                        {recatEdit === tx.id ? (
                          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select
                              autoFocus
                              defaultValue={tx.category_id ?? ''}
                              disabled={recatSaving}
                              onChange={async e => {
                                const val = e.target.value;
                                await handleCategorySave(tx.id, val ? Number(val) : null);
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--border-default)',
                                background: 'var(--surface-panel)',
                                color: 'var(--text-primary)',
                                fontSize: 12,
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              <option value="">Sem categoria</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setRecatEdit(null)}
                              style={{
                                background: 'none', border: 'none',
                                color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
                              }}
                            >
                              cancelar
                            </button>
                          </div>
                        ) : (
                          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {tx.category_name || tx.category ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                                <CategoryIcon
                                  icon={categories.find(c => c.id === tx.category_id)?.icon}
                                  size={11}
                                  color="var(--text-muted)"
                                />
                                {tx.category_name ?? tx.category}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6 }}>
                                Sem categoria
                              </span>
                            )}
                            <button
                              onClick={() => setRecatEdit(tx.id)}
                              style={{
                                background: 'none', border: 'none',
                                color: 'var(--blue-400)', fontSize: 11, cursor: 'pointer',
                                opacity: 0.7,
                                padding: '0 2px',
                              }}
                              title="Alterar categoria"
                            >
                              alterar
                            </button>
                          </div>
                        )}
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
