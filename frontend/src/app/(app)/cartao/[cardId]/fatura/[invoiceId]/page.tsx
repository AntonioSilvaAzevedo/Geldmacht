'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown, Layers, TrendingUp } from 'lucide-react';
import { CategoryChoiceSelect } from '@/components/category-choice-select';
import { CategoryGrid, type CategoryGroup } from '@/components/CategoryGrid';
import PageHeader from '@/components/Layout/PageHeader';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { api, type CardInvoice, type CardInvoiceDetail, type CreditCardConfig, type Category } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Transaction } from '@/types/financial';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PageProps {
  params: Promise<{ cardId: string; invoiceId: string }>;
}

interface InstallmentInfo {
  tx: Transaction;
  futureCount: number;
  futureAmount: number;
}

// ── Label helpers ─────────────────────────────────────────────────────────────

const FULL_MONTHS_MAP: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};
const SHORT_MONTHS_MAP: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

function buildTitle(invoice: CardInvoiceDetail): string {
  if (invoice.due_date) {
    const d = new Date(invoice.due_date + 'T12:00:00');
    const month = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return `Fatura · ${month.charAt(0).toUpperCase() + month.slice(1)}`;
  }
  const [year, mon] = invoice.due_month.split('-');
  return `Fatura · ${FULL_MONTHS_MAP[mon] ?? mon}/${year}`;
}

function fullLabel(inv: CardInvoice): string {
  const [year, mon] = inv.due_month.split('-');
  return inv.label ?? `${FULL_MONTHS_MAP[mon] ?? mon} ${year}`;
}

function shortLabelInv(inv: CardInvoice): string {
  const [year, mon] = inv.due_month.split('-');
  return `${SHORT_MONTHS_MAP[mon] ?? mon}/${year.slice(-2)}`;
}

// ── Shared tokens ─────────────────────────────────────────────────────────────

const SEP   = 'rgba(255,255,255,0.07)';
const S1    = 'var(--s1, #1C1C1E)';
const S2    = 'var(--s2, #2C2C2E)';
const T3    = 'var(--text-muted, rgba(255,255,255,0.35))';
const T2    = 'var(--text-secondary, rgba(255,255,255,0.6))';
const BLUE  = 'var(--blue-400, #0A84FF)';
const RED   = 'var(--red-400, #FF453A)';
const GREEN = 'var(--green-400, #30D158)';
const AMBER = 'var(--amber-400, #FF9F0A)';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage({ params }: PageProps) {
  const router   = useRouter();
  const isMobile = useIsMobile();
  const { cardId, invoiceId } = use(params);
  const cid = Number(cardId);
  const iid = Number(invoiceId);

  const [card, setCard]               = useState<CreditCardConfig | null>(null);
  const [invoice, setInvoice]         = useState<CardInvoiceDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [allInvoices, setAllInvoices] = useState<CardInvoice[]>([]);
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [recatModal, setRecatModal]   = useState<{ txId: number; categoryId: number | null } | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fatura.');
    } finally {
      setLoading(false);
    }
  }, [cid, iid]);

  useEffect(() => { void load(); }, [load]);

  // ── Category helpers ──────────────────────────────────────────────────────────

  const categoriesById = useMemo(() => {
    const m = new Map<number, Category>();
    categories.forEach(c => m.set(c.id, c));
    return m;
  }, [categories]);

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

  const categoryChoiceOptions = useMemo(
    () =>
      categories.map(c => {
        let label = c.name;
        if (c.parent_id != null) {
          const parent = categoriesById.get(c.parent_id);
          if (parent) label = `${parent.name} / ${c.name}`;
        }
        return { id: c.id, label, icon: c.icon };
      }),
    [categories, categoriesById],
  );

  // ── Category groups ───────────────────────────────────────────────────────────

  function isSystemicTx(tx: Transaction): boolean {
    if (tx.is_payment) return true;
    if (tx.installment_current != null && tx.installment_total != null && tx.installment_total > 1) return true;
    return false;
  }

  const groups = useMemo<CategoryGroup[]>(() => {
    const grouped = new Map<string, CategoryGroup>();
    transactions
      .filter(tx => tx.amount < 0)
      .filter(tx => !isSystemicTx(tx))
      .forEach(tx => {
        const catObj = tx.category_id != null ? categoriesById.get(tx.category_id) ?? null : null;
        const label  = resolveTxCategoryLabel(tx, catObj);
        const key    = tx.category_id != null ? `category-${tx.category_id}` : 'uncategorized';
        const current = grouped.get(key) ?? {
          key, label,
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

  // ── Installments ─────────────────────────────────────────────────────────────

  const installments = useMemo<InstallmentInfo[]>(() => {
    return transactions
      .filter(tx => tx.amount < 0 && tx.installment_current != null && tx.installment_total != null && tx.installment_total > 1)
      .map(tx => {
        const futureCount  = (tx.installment_total ?? 0) - (tx.installment_current ?? 0);
        const futureAmount = Math.abs(tx.amount) * futureCount;
        return { tx, futureCount, futureAmount };
      });
  }, [transactions]);

  const installmentsTotalHere = useMemo(() => installments.reduce((acc, i) => acc + Math.abs(i.tx.amount), 0), [installments]);

  const finishedInstallments = useMemo(() => installments.filter(i => i.futureCount === 0), [installments]);
  const releasedBudgetTotal  = useMemo(() => finishedInstallments.reduce((acc, i) => acc + Math.abs(i.tx.amount), 0), [finishedInstallments]);

  // ── Invoice navigation ────────────────────────────────────────────────────────

  const sortedInvoices = useMemo<CardInvoice[]>(
    () => [...allInvoices].sort((a, b) => a.due_month.localeCompare(b.due_month)),
    [allInvoices],
  );
  const currentIndex = useMemo(() => sortedInvoices.findIndex(inv => inv.id === iid), [sortedInvoices, iid]);
  const prevInvoice  = currentIndex > 0 ? sortedInvoices[currentIndex - 1] : null;
  const nextInvoice  = currentIndex >= 0 && currentIndex < sortedInvoices.length - 1 ? sortedInvoices[currentIndex + 1] : null;

  // ── Recategorization ──────────────────────────────────────────────────────────

  const saveRecategorization = useCallback(async () => {
    if (!recatModal) return;
    setRecatSaving(true);
    try {
      await api.updateTransaction(recatModal.txId, { category_id: recatModal.categoryId ?? undefined });
      await load();
      setRecatModal(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Não foi possível alterar a categoria.');
    } finally {
      setRecatSaving(false);
    }
  }, [recatModal, load]);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <PageHeader
          title="Fatura do cartão"
          subtitle="Carregando..."
          crumbs={[{ href: `/cartao/${cid}`, label: 'Cartão' }]}
          px={isMobile ? 14 : 32}
        />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></main>
      </>
    );
  }
  if (error) return <ErrorState message={error} />;
  if (!card || !invoice) return <ErrorState message="Fatura não encontrada." />;

  if (transactions.length === 0) {
    return (
      <>
        <PageHeader
          title={buildTitle(invoice)}
          subtitle={card.name}
          crumbs={[{ href: `/cartao/${card.id}`, label: card.name }]}
          px={isMobile ? 14 : 32}
        />
        <main style={{ flex: 1 }}>
          <EmptyState title="Nenhum lançamento nesta fatura." message="Não há lançamentos importados para esta fatura." actionHref={`/cartao/${card.id}`} actionLabel="Voltar ao cartão" />
        </main>
      </>
    );
  }

  const summary         = invoice.summary;
  const hasPdfTotal     = invoice.total_amount != null;
  const invoiceTotal    = hasPdfTotal ? invoice.total_amount! : summary.total_invoice;
  const topGroup        = groups[0];
  const largestExpense  = summary.largest_expense;

  const invoiceNavBar = sortedInvoices.length > 1 ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
      <button onClick={() => prevInvoice && router.push(`/cartao/${cid}/fatura/${prevInvoice.id}`)} disabled={!prevInvoice} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '8px 12px', borderRadius: 10, border: '1px solid',
        borderColor: prevInvoice ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
        background: 'transparent',
        color: prevInvoice ? '#fff' : 'rgba(255,255,255,0.18)',
        fontSize: 12, fontWeight: 500, cursor: prevInvoice ? 'pointer' : 'not-allowed',
        transition: 'all 0.12s',
      }}>
        <ChevronLeft size={14} />
        {prevInvoice ? shortLabelInv(prevInvoice) : '—'}
      </button>

      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{fullLabel(sortedInvoices[currentIndex] ?? sortedInvoices[0])}</div>
      </div>

      <button onClick={() => nextInvoice && router.push(`/cartao/${cid}/fatura/${nextInvoice.id}`)} disabled={!nextInvoice} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '8px 12px', borderRadius: 10, border: '1px solid',
        borderColor: nextInvoice ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
        background: 'transparent',
        color: nextInvoice ? '#fff' : 'rgba(255,255,255,0.18)',
        fontSize: 12, fontWeight: 500, cursor: nextInvoice ? 'pointer' : 'not-allowed',
        transition: 'all 0.12s',
      }}>
        {nextInvoice ? shortLabelInv(nextInvoice) : '—'}
        <ChevronRight size={14} />
      </button>
    </div>
  ) : undefined;

  return (
    <>
      <PageHeader
        title={buildTitle(invoice)}
        subtitle={invoice.due_date ? `Vence ${formatDate(invoice.due_date)}` : undefined}
        crumbs={[{ href: `/cartao/${card.id}`, label: card.name }]}
        nav={invoiceNavBar}
        px={isMobile ? 14 : 32}
      />

      <main style={{ padding: '0 20px 40px', flex: 1, maxWidth: 680, margin: '0 auto', width: '100%' }}>

        {/* Invoice Hero */}
        <div style={{ background: S1, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '22px 22px 18px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: T3, marginBottom: 6 }}>
                Total da fatura
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: RED, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {formatCurrency(invoiceTotal)}
              </div>
            </div>
            {summary.payment_amount > 0 ? (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: GREEN, background: 'rgba(48,209,88,0.12)', borderRadius: 6, padding: '3px 8px' }}>Paga</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: GREEN, marginTop: 6 }}>{formatCurrency(summary.payment_amount)}</div>
              </div>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: AMBER, background: 'rgba(255,159,10,0.12)', borderRadius: 6, padding: '3px 8px' }}>Em aberto</span>
            )}
          </div>

          {/* Meta chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {invoice.cycle_start_date && invoice.cycle_end_date && (
              <div style={chipStyle}>
                <span style={{ fontSize: 12, color: T2 }}>
                  {formatDate(invoice.cycle_start_date)} — {formatDate(invoice.cycle_end_date)}
                </span>
              </div>
            )}
            {invoice.due_date && (
              <div style={chipStyle}>
                <span style={{ fontSize: 12, color: T2 }}>Vence {formatDate(invoice.due_date)}</span>
              </div>
            )}
            <div style={chipStyle}>
              <span style={{ fontSize: 12, color: T2 }}>{transactions.length} lançamentos</span>
            </div>
          </div>
        </div>

        {/* Summary Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: S1, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          {[
            { label: 'Maior categoria', value: topGroup?.label ?? '—',           sub: topGroup ? formatCurrency(topGroup.total) : '', color: '#fff' },
            { label: 'Maior gasto',     value: formatCurrency(largestExpense),   sub: '',                                              color: RED   },
            { label: 'Em parcelas',     value: formatCurrency(installmentsTotalHere), sub: '',                                         color: BLUE  },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRight: i < 2 ? `1px solid ${SEP}` : 'none' }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: T3, marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: s.color, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 10, color: T3, marginTop: 3 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Released budget — parcelas finalizadas */}
        {finishedInstallments.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(72,187,120,0.12) 0%, rgba(56,178,172,0.08) 100%)',
            border: '1px solid rgba(72,187,120,0.30)', borderRadius: 14,
            padding: '14px 16px', marginBottom: 14,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(72,187,120,0.20)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={18} color={GREEN} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: T3, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Orçamento liberado</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: GREEN, fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em', marginTop: 2 }}>
                {formatCurrency(releasedBudgetTotal)}
              </div>
              <div style={{ marginTop: 4, fontSize: 12.5, color: T2, lineHeight: 1.45 }}>
                {finishedInstallments.length} compra{finishedInstallments.length === 1 ? ' parcelada terminou' : 's parceladas terminaram'} nesta fatura.
                {' '}Esse valor deixa de comprometer suas próximas faturas.
              </div>
            </div>
          </div>
        )}

        {/* Compras parceladas (accordion) */}
        {installments.length > 0 && (
          <div style={{ background: S1, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
            <button type="button" onClick={() => setInstallmentsOpen(v => !v)} style={{
              width: '100%', padding: '13px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {installmentsOpen
                  ? <ChevronDown size={14} color={T3} />
                  : <ChevronRight size={14} color={T3} />
                }
                <span style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(10,132,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Layers size={14} color={BLUE} />
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Compras parceladas</div>
                  <div style={{ fontSize: 11, color: T3, marginTop: 2 }}>
                    {installments.length} lançamento{installments.length !== 1 ? 's' : ''} · Nesta fatura{' '}
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(installmentsTotalHere)}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: BLUE }}>{formatCurrency(installmentsTotalHere)}</div>
            </button>

            {installmentsOpen && (
              <div style={{ borderTop: `1px solid ${SEP}`, padding: '10px 16px 14px' }}>
                {installments.map(({ tx, futureCount, futureAmount }, i) => (
                  <div key={tx.id} style={{
                    background: 'rgba(10,132,255,0.06)', border: '1px solid rgba(10,132,255,0.15)',
                    borderRadius: 12, padding: '12px 14px',
                    marginBottom: i < installments.length - 1 ? 8 : 0,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.description}</div>
                        <div style={{ fontSize: 11, color: T3, marginTop: 3 }}>
                          Parcela{' '}
                          <span style={{ fontFamily: 'var(--font-mono)', color: BLUE, fontWeight: 600 }}>
                            {tx.installment_current} de {tx.installment_total}
                          </span>
                          {' · '}{formatDate(tx.date)}
                        </div>
                        {futureCount > 0 && (
                          <div style={{ fontSize: 11, color: AMBER, marginTop: 2 }}>
                            {futureCount} parcela{futureCount !== 1 ? 's' : ''} restante{futureCount !== 1 ? 's' : ''} · est. {formatCurrency(futureAmount)}
                          </div>
                        )}
                        {futureCount === 0 && (
                          <div style={{ fontSize: 11, color: GREEN, marginTop: 2 }}>Última parcela ✓</div>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: RED, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {formatCurrency(Math.abs(tx.amount))}
                      </div>
                    </div>
                    <div style={{ height: 3, background: S2, borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${((tx.installment_current ?? 0) / (tx.installment_total ?? 1)) * 100}%`, background: BLUE, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        <section style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 3px' }}>Categorias</h2>
              <p style={{ margin: 0, fontSize: 11, color: T3 }}>{groups.length} {groups.length === 1 ? 'categoria' : 'categorias'}</p>
            </div>
          </div>
          <CategoryGrid
            groups={groups}
            isMobile={isMobile}
            onRecategorize={(txId) => {
              const tx = transactions.find(t => t.id === txId);
              setRecatModal({ txId, categoryId: tx?.category_id ?? null });
            }}
          />
        </section>

        {/* Recategorization modal */}
        {recatModal && (
          <div
            role="dialog" aria-modal="true" aria-labelledby="recat-title"
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget && !recatSaving) setRecatModal(null); }}
          >
            <div
              style={{ width: '100%', maxWidth: 400, background: 'var(--surface-card)', borderRadius: 16, border: '1px solid var(--border-subtle)', padding: '22px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.55)' }}
              onClick={e => e.stopPropagation()}
            >
              <h2 id="recat-title" style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>Alterar categoria</h2>
              <CategoryChoiceSelect
                value={recatModal.categoryId}
                options={categoryChoiceOptions}
                onChange={id => setRecatModal(r => (r ? { ...r, categoryId: id } : null))}
                emptyLabel="Sem categoria"
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
                <button type="button" disabled={recatSaving} onClick={() => setRecatModal(null)}
                  style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border-default)', background: 'transparent', color: T2, fontSize: 13, cursor: recatSaving ? 'not-allowed' : 'pointer' }}>
                  Cancelar
                </button>
                <button type="button" disabled={recatSaving} onClick={() => void saveRecategorization()}
                  style={{ padding: '9px 14px', borderRadius: 9, border: 'none', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: recatSaving ? 'not-allowed' : 'pointer' }}>
                  {recatSaving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const chipStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: 'var(--s2, #2C2C2E)', borderRadius: 8, padding: '6px 10px',
};
