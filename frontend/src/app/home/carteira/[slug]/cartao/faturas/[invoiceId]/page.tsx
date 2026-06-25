'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';

import { CategoryBadges } from '@/components/category-badges';
import { Input } from '@/components/ui/input';
import { useInstitution } from '@/components/carteira/institution-context';
import { ExpandableCard } from '@/components/ui/expandable-card';
import CategoryIcon from '@/components/CategoryIcon';
import StatePanel from '@/components/StatePanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { api, type CardInvoiceDetail, type Category } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/types/financial';

interface PageProps { params: Promise<{ slug: string; invoiceId: string }> }

const MONTH_FULL: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

interface CategoryGroup {
  key: string;
  label: string;
  icon: string | null;
  total: number;
  transactions: Transaction[];
}

function isInstallment(tx: Transaction): boolean {
  return tx.amount < 0
    && tx.installment_current != null
    && tx.installment_total != null
    && tx.installment_total > 1;
}

function isSystemic(tx: Transaction): boolean {
  return tx.is_payment === true || isInstallment(tx);
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const { invoiceId } = use(params);
  const { cards } = useInstitution();
  const cid = cards[0]?.id ?? 0;
  const iid = Number(invoiceId);

  const [invoice, setInvoice] = useState<CardInvoiceDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ txId: number; categoryId: number | null; description: string } | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inv, cats] = await Promise.all([
        api.getCardInvoiceDetail(cid, iid),
        api.listCategories('credit_card', cid),
      ]);
      setInvoice(inv);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fatura.');
    } finally {
      setLoading(false);
    }
  }, [cid, iid]);

  useEffect(() => { void load(); }, [load]);

  const catById = useMemo(() => {
    const m = new Map<number, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const groups = useMemo<CategoryGroup[]>(() => {
    if (!invoice) return [];
    const map = new Map<string, CategoryGroup>();
    invoice.transactions
      .filter((tx) => tx.amount < 0 && !isSystemic(tx))
      .forEach((tx) => {
        const cat = tx.category_id != null ? catById.get(tx.category_id) ?? null : null;
        const label = tx.category_display_label ?? cat?.name ?? tx.category_name ?? tx.category ?? 'Sem categoria';
        const key = tx.category_id != null ? `c-${tx.category_id}` : 'uncategorized';
        const cur = map.get(key) ?? { key, label, icon: cat?.icon ?? null, total: 0, transactions: [] };
        cur.total += Math.abs(tx.amount);
        cur.transactions.push(tx);
        map.set(key, cur);
      });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [invoice, catById]);

  const installments = useMemo(
    () => (invoice ? invoice.transactions.filter(isInstallment) : []),
    [invoice],
  );

  const categoryChoiceOptions = useMemo(() =>
    categories.map((c) => {
      let label = c.name;
      const parent = c.parent_id != null ? catById.get(c.parent_id) : undefined;
      if (parent) label = `${parent.name} / ${c.name}`;
      return { id: c.id, label, icon: c.icon };
    }),
  [categories, catById]);

  const saveEdit = useCallback(async () => {
    if (!editModal) return;
    setEditSaving(true);
    try {
      await api.updateTransaction(editModal.txId, {
        description: editModal.description.trim(),
        category_id: editModal.categoryId ?? undefined,
      });
      await load();
      setEditModal(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Não foi possível salvar o lançamento.');
    } finally {
      setEditSaving(false);
    }
  }, [editModal, load]);

  if (loading) return <div className="flex flex-1 items-center justify-center"><LoadingSpinner /></div>;
  if (error) return <StatePanel variant="error" message={error} />;
  if (!invoice) return <StatePanel variant="error" message="Fatura não encontrada." />;

  const [yearStr, monthStr] = invoice.due_month.split('-');
  const monthLabel = MONTH_FULL[monthStr] ?? invoice.due_month;
  const importHref = `/home/upload?type=credit_card&cardId=${cid}`;
  const installmentsTotal = installments.reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const hasTransactions = invoice.transactions.length > 0;
  const invoiceTotal = invoice.summary.total_invoice;
  const invoiceCredits = invoice.summary.total_other_credits;

  function txCount(n: number) {
    return `${n} ${n === 1 ? 'lançamento' : 'lançamentos'}`;
  }

  return (
    <div>
      <header className="mb-5 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="min-w-0 text-[28px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            {monthLabel}
          </h1>
          {hasTransactions && (
            <span className="shrink-0 font-[family-name:var(--font-mono)] text-[20px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
              {formatCurrency(invoiceTotal)}
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-[family-name:var(--font-mono)] text-[15px] text-[var(--text-secondary)]">
            {yearStr}
          </p>
          {hasTransactions && invoiceCredits > 0 && (
            <span className="flex shrink-0 items-baseline gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                Entradas
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[13px] font-semibold text-[var(--green-400)]">
                {formatCurrency(invoiceCredits)}
              </span>
            </span>
          )}
        </div>
      </header>

      {invoice.transactions.length === 0 ? (
        <StatePanel
          variant="empty"
          title="Nenhum lançamento nesta fatura."
          message="Importe a fatura para visualizar os lançamentos por categoria."
          actionHref={importHref}
          actionLabel="Importar fatura"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <ExpandableCard
              key={group.key}
              leading={
                group.icon ? (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(10,132,255,0.1)]">
                    <CategoryIcon icon={group.icon} size={15} color="var(--blue-400)" />
                  </div>
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-3)]">
                    <span className="size-2 rounded-full bg-white/25" />
                  </div>
                )
              }
              title={group.label}
              subtitle={txCount(group.transactions.length)}
              value={formatCurrency(group.total)}
              titleWrap
            >
              <ul className="divide-y divide-[var(--separator)]">
                {group.transactions.map((tx) => (
                  <li
                    key={tx.id}
                    onClick={() => setEditModal({ txId: tx.id, categoryId: tx.category_id ?? null, description: tx.description })}
                    className="flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-[var(--text-primary)]">{tx.description}</div>
                      <div className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{formatDate(tx.date)}</div>
                    </div>
                    <span className="shrink-0 font-[family-name:var(--font-mono)] text-[13px] font-semibold text-[var(--red-400)]">
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            </ExpandableCard>
          ))}

          {installments.length > 0 && (
            <ExpandableCard
              leading={
                <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(10,132,255,0.1)]">
                  <CreditCard className="size-[15px] text-[var(--blue-400)]" />
                </div>
              }
              title="Compras parceladas"
              subtitle={txCount(installments.length)}
              value={formatCurrency(installmentsTotal)}
              titleWrap
            >
              <ul className="divide-y divide-[var(--separator)]">
                {installments.map((tx) => {
                  const isLastInstallment = tx.installment_current === tx.installment_total;
                  return (
                    <li
                      key={tx.id}
                      className={cn(
                        'flex items-start gap-3 px-5 py-3',
                        isLastInstallment && 'bg-[rgba(48,209,88,0.06)]',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-[var(--text-primary)]">{tx.description}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'text-[11px]',
                              isLastInstallment ? 'text-[var(--green-400)]' : 'text-[var(--text-tertiary)]',
                            )}
                          >
                            Parcela {tx.installment_current} de {tx.installment_total}
                          </span>
                          {isLastInstallment && (
                            <span className="inline-flex items-center rounded-full bg-[rgba(48,209,88,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[var(--green-400)]">
                              Última parcela
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 font-[family-name:var(--font-mono)] text-[13px] font-semibold text-[var(--red-400)]">
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </ExpandableCard>
          )}
        </div>
      )}

      {editModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget && !editSaving) setEditModal(null); }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-[var(--inset-screen)]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[var(--space-5)] shadow-[var(--shadow-modal)]"
          >
            <h2 className="mb-[var(--space-4)] text-[17px] font-bold">Editar lançamento</h2>
            <label htmlFor="edit-tx-description" className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Descrição
            </label>
            <Input
              id="edit-tx-description"
              value={editModal.description}
              onChange={(e) => setEditModal((m) => (m ? { ...m, description: e.target.value } : null))}
              placeholder="Descrição do lançamento"
            />
            <div className="mt-[var(--space-4)] mb-1.5 text-[12px] font-medium text-[var(--text-secondary)]">Categoria</div>
            <CategoryBadges
              value={editModal.categoryId}
              options={categoryChoiceOptions}
              onChange={(id) => setEditModal((m) => (m ? { ...m, categoryId: id } : null))}
            />
            <div className="mt-[22px] flex justify-end gap-2.5">
              <Button type="button" variant="outline" size="default" disabled={editSaving} onClick={() => setEditModal(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" loading={editSaving} onClick={() => void saveEdit()}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
