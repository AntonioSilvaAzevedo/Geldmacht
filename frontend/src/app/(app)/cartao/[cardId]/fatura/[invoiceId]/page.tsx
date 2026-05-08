'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, TrendingUp, Layers, Lock } from 'lucide-react';
import EditableDescription from '@/components/EditableDescription';
import CategoryIcon from '@/components/CategoryIcon';
import { CategoryChoiceSelect } from '@/components/category-choice-select';
import CategoryBudgetProgress from '@/components/CategoryBudgetProgress';
import Header from '@/components/Layout/Header';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { api, type CardInvoice, type CardInvoiceDetail, type CreditCardConfig, type Category } from '@/lib/api';
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
  budgetLimit: number | null;
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
  const router = useRouter();
  const { cardId, invoiceId } = use(params);
  const cid = Number(cardId);
  const iid = Number(invoiceId);

  const [card, setCard] = useState<CreditCardConfig | null>(null);
  const [invoice, setInvoice] = useState<CardInvoiceDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allInvoices, setAllInvoices] = useState<CardInvoice[]>([]);
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
      const [cardData, invoiceData, catData, invoicesList] = await Promise.all([
        api.getCard(cid),
        api.getCardInvoiceDetail(cid, iid),
        api.listCategories('credit_card', cid),
        api.getCardInvoices(cid),
      ]);
      setCard(cardData);
      setInvoice(invoiceData);
      setTransactions(invoiceData.transactions);
      setCategories(catData);
      setAllInvoices(invoicesList);
      setOpenGroups(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fatura.');
    } finally {
      setLoading(false);
    }
  }, [cid, iid]);

  useEffect(() => { void load(); }, [load]);

  // Map de id → categoria, usado também para resolver subcategoria e label hierárquico.
  const categoriesById = useMemo(() => {
    const m = new Map<number, Category>();
    categories.forEach(c => m.set(c.id, c));
    return m;
  }, [categories]);

  const recategorizeOptions = useMemo(() => {
    return categories
      .map(c => {
        const parent = c.parent_id != null ? categoriesById.get(c.parent_id) : null;
        const label = parent ? `${parent.name} / ${c.name}` : c.name;
        return { id: c.id, label, icon: c.icon ?? null };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [categories, categoriesById]);

  function categoryLabel(cat: Category | null | undefined, fallback: string): string {
    if (!cat) return fallback;
    if (cat.parent_id != null) {
      const parent = categoriesById.get(cat.parent_id);
      return parent ? `${parent.name} / ${cat.name}` : cat.name;
    }
    return cat.name;
  }

  function resolveTxCategoryLabel(tx: Transaction, catObj: Category | null): string {
    if (tx.category_display_label) return tx.category_display_label;
    return categoryLabel(catObj, tx.category_name || tx.category || 'Sem categoria');
  }

  function resolveTxBudgetLimit(tx: Transaction, catObj: Category | null): number | null {
    if (tx.category_invoice_budget_limit != null) return tx.category_invoice_budget_limit;
    return catObj?.invoice_budget_limit ?? null;
  }

  function resolveTxCategoryIcon(tx: Transaction, catObj: Category | null): string | null {
    return catObj?.icon ?? tx.category_icon ?? null;
  }

  // ── Category groups ──────────────────────────────────────────────────────────
  // IMPORTANTE: lançamentos **sistêmicos** (compras parceladas e pagamentos da
  // fatura) não entram em "Sem categoria" — parcelas vivem na seção dedicada
  // "Compras parceladas"; pagamentos não são consumo. Sem este filtro, todos os
  // sistêmicos cairiam em `uncategorized` (porque têm `category_id = null`),
  // duplicando-os visualmente em dois lugares.
  const groups = useMemo<CategoryGroup[]>(() => {
    const grouped = new Map<string, CategoryGroup>();
    transactions
      .filter(tx => tx.amount < 0)
      .filter(tx => !isSystemicTx(tx))
      .forEach(tx => {
        const catObj = tx.category_id != null ? categoriesById.get(tx.category_id) ?? null : null;
        const label = resolveTxCategoryLabel(tx, catObj);
        const key = tx.category_id != null ? `category-${tx.category_id}` : 'uncategorized';
        const current = grouped.get(key) ?? {
          key,
          label,
          icon: resolveTxCategoryIcon(tx, catObj),
          total: 0,
          budgetLimit: resolveTxBudgetLimit(tx, catObj),
          transactions: [],
        };
        current.total += Math.abs(tx.amount);
        current.transactions.push(tx);
        grouped.set(key, current);
      });
    return [...grouped.values()].sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, categoriesById]);

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

  // Parcelas finalizadas nesta fatura — última parcela paga.
  // Critério: installment_current === installment_total (e total > 1, garantido por `installments`).
  const finishedInstallments = useMemo(
    () => installments.filter(i => i.futureCount === 0),
    [installments]
  );
  const releasedBudgetTotal = useMemo(
    () => finishedInstallments.reduce((acc, i) => acc + Math.abs(i.tx.amount), 0),
    [finishedInstallments]
  );

  // ── Navegação entre faturas ──────────────────────────────────────────────────
  // Ordena por due_month ASC para localizar prev/next.
  const sortedInvoices = useMemo<CardInvoice[]>(
    () => [...allInvoices].sort((a, b) => a.due_month.localeCompare(b.due_month)),
    [allInvoices]
  );
  const currentIndex = useMemo(
    () => sortedInvoices.findIndex(inv => inv.id === iid),
    [sortedInvoices, iid]
  );
  const prevInvoice = currentIndex > 0 ? sortedInvoices[currentIndex - 1] : null;
  const nextInvoice =
    currentIndex >= 0 && currentIndex < sortedInvoices.length - 1
      ? sortedInvoices[currentIndex + 1]
      : null;

  function shortLabel(inv: CardInvoice): string {
    const [year, mon] = inv.due_month.split('-');
    const labels: Record<string, string> = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
      '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
      '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
    };
    return `${labels[mon] ?? mon}/${year}`;
  }

  // Helper: lançamento é sistêmico (parcela ou pagamento da fatura).
  function isSystemicTx(tx: Transaction): boolean {
    if (tx.is_payment) return true;
    if (
      tx.installment_current != null &&
      tx.installment_total != null &&
      tx.installment_total > 1
    ) return true;
    return false;
  }

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
        tx.id === txId ? { ...tx, ...updated } : tx,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Link href={`/cartao/${card.id}`} style={{ color: 'var(--blue-400)', fontSize: 13, textDecoration: 'none' }}>
            ← Voltar ao cartão
          </Link>
          <Link href={`/upload?type=credit_card&cardId=${card.id}`} style={primaryLinkStyle}>
            Importar nova fatura
          </Link>
        </div>

        {/* Navegação entre faturas (do mesmo cartão) */}
        {sortedInvoices.length > 1 && (
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '10px 12px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}>
            <button
              type="button"
              disabled={!prevInvoice}
              onClick={() => prevInvoice && router.push(`/cartao/${cid}/fatura/${prevInvoice.id}`)}
              title={prevInvoice ? `Fatura anterior: ${shortLabel(prevInvoice)}` : 'Sem fatura anterior'}
              style={{
                ...navButtonStyle,
                opacity: prevInvoice ? 1 : 0.4,
                cursor: prevInvoice ? 'pointer' : 'not-allowed',
              }}
            >
              <ChevronLeft size={14} />
              {prevInvoice ? shortLabel(prevInvoice) : 'Anterior'}
            </button>

            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 220 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                Fatura
              </span>
              <select
                value={iid}
                onChange={e => {
                  const target = Number(e.target.value);
                  if (target !== iid) router.push(`/cartao/${cid}/fatura/${target}`);
                }}
                style={{
                  flex: 1,
                  padding: '6px 9px',
                  borderRadius: 7,
                  border: '1px solid var(--border-default)',
                  background: 'var(--surface-panel)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {sortedInvoices.slice().reverse().map(inv => {
                  const valueParts: string[] = [shortLabel(inv)];
                  if (inv.due_date) valueParts.push(`vence ${formatDate(inv.due_date)}`);
                  const total = inv.total_amount != null ? inv.total_amount : inv.computed_total;
                  if (total != null) valueParts.push(formatCurrency(total));
                  return (
                    <option key={inv.id} value={inv.id}>
                      {valueParts.join(' — ')}
                    </option>
                  );
                })}
              </select>
            </label>

            <button
              type="button"
              disabled={!nextInvoice}
              onClick={() => nextInvoice && router.push(`/cartao/${cid}/fatura/${nextInvoice.id}`)}
              title={nextInvoice ? `Próxima fatura: ${shortLabel(nextInvoice)}` : 'Sem próxima fatura'}
              style={{
                ...navButtonStyle,
                opacity: nextInvoice ? 1 : 0.4,
                cursor: nextInvoice ? 'pointer' : 'not-allowed',
              }}
            >
              {nextInvoice ? shortLabel(nextInvoice) : 'Próxima'}
              <ChevronRight size={14} />
            </button>
          </div>
        )}

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

        {/* ── Orçamento liberado por parcelas finalizadas ──────────────────── */}
        {finishedInstallments.length > 0 && (
          <section style={{ marginBottom: 18 }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(72,187,120,0.12) 0%, rgba(56,178,172,0.08) 100%)',
                border: '1px solid rgba(72,187,120,0.30)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <span style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(72,187,120,0.20)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <TrendingUp size={18} color="var(--green-400)" />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 10.5, color: 'var(--text-muted)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)',
                }}>
                  Orçamento liberado
                </div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--green-400)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.01em',
                  marginTop: 2,
                }}>
                  {formatCurrency(releasedBudgetTotal)}
                </div>
                <div style={{
                  marginTop: 4,
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                }}>
                  {finishedInstallments.length} compra{finishedInstallments.length === 1 ? ' parcelada terminou' : 's parceladas terminaram'} nesta fatura.
                  {' '}Esse valor deixa de comprometer suas próximas faturas.
                </div>
              </div>
            </div>
          </section>
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

                {/* Progresso do limite (quando definido) */}
                {group.budgetLimit != null && group.budgetLimit > 0 && (
                  <div style={{
                    padding: '0 16px 12px',
                    borderTop: '1px dashed var(--border-subtle)',
                    paddingTop: 10,
                  }}>
                    <CategoryBudgetProgress
                      spentAmount={group.total}
                      limitAmount={group.budgetLimit}
                    />
                  </div>
                )}

                {openGroups.has(group.key) && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {group.transactions.map(tx => {
                      const rowCat = tx.category_id != null ? categoriesById.get(tx.category_id) ?? null : null;
                      return (
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

                        {/* Recategorizar — bloqueado para sistêmicos */}
                        {isSystemicTx(tx) ? (
                          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              title="Este lançamento é sistêmico e não pode ser categorizado manualmente."
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                padding: '2px 7px',
                                borderRadius: 5,
                                border: '1px dashed var(--border-default)',
                                background: 'rgba(255,255,255,0.02)',
                              }}
                            >
                              <Lock size={10} />
                              {tx.is_payment ? 'Pagamento da fatura' : 'Compra parcelada'}
                            </span>
                          </div>
                        ) : recatEdit === tx.id ? (
                          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <CategoryChoiceSelect
                              value={tx.category_id ?? null}
                              options={recategorizeOptions}
                              disabled={recatSaving}
                              onChange={async id => {
                                await handleCategorySave(tx.id, id);
                              }}
                              maxWidth={280}
                            />
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
                                  icon={resolveTxCategoryIcon(tx, rowCat)}
                                  size={11}
                                  color="var(--text-muted)"
                                />
                                {resolveTxCategoryLabel(tx, rowCat)}
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
                    );
                    })}
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

const navButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 10px',
  borderRadius: 7,
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 12,
  fontWeight: 500,
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
