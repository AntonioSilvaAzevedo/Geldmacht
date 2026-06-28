'use client';

import { Suspense, use, useCallback, useMemo, useState, useTransition } from 'react';
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ExpandableCard } from '@/components/ui/expandable-card';
import SummaryCard from '@/components/summary/SummaryCard';
import { ExtratoSkeleton } from '@/components/skeletons/ExtratoSkeleton';
import StatePanel from '@/components/StatePanel';
import { api, type BankAccountConfig } from '@/lib/api';
import type { Transaction } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { resolveMovementType, type MovementType } from '@/lib/carteira/movement';
import { cn } from '@/lib/utils';

const MONTH_FULL: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

const FILTERS = ['Todos', 'Receitas', 'Despesas', 'Transferências', 'Faturas'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_TYPE: Partial<Record<Filter, MovementType>> = {
  Receitas: 'income',
  Despesas: 'expense',
  Transferências: 'internal_transfer',
  Faturas: 'credit_card_payment',
};

const EMPTY_BY_FILTER: Record<Filter, string> = {
  Todos: 'Nenhuma movimentação neste mês.',
  Receitas: 'Nenhuma receita neste mês.',
  Despesas: 'Nenhuma despesa neste mês.',
  Transferências: 'Nenhuma transferência interna neste mês.',
  Faturas: 'Nenhum pagamento de fatura neste mês.',
};

const FILTER_TITLE: Record<Filter, string> = {
  Todos: 'Todas as movimentações',
  Receitas: 'Receitas',
  Despesas: 'Despesas',
  Transferências: 'Transferências',
  Faturas: 'Pagamentos de fatura',
};

export interface ExtratoPanelProps {
  accounts: BankAccountConfig[];
  activeAccountId: number | null;
  setActiveAccountId: (id: number) => void;
}

type ExtratoResult =
  | { ok: true; transactions: Transaction[] }
  | { ok: false; error: string };

function loadExtrato(accountId: number): Promise<ExtratoResult> {
  return api
    .getTransactions({ bank_account_id: accountId })
    .then((data) => ({ ok: true as const, transactions: data as Transaction[] }))
    .catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : 'Erro ao carregar movimentações.',
    }));
}

function dateLabel(date: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${date}T00:00:00`);
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return formatDate(date);
}

function movementCount(n: number): string {
  return `${n} ${n === 1 ? 'movimentação' : 'movimentações'}`;
}

function MovementList({ transactions }: { transactions: Transaction[] }) {
  return (
    <ul className="divide-y divide-dashed divide-[var(--separator)]">
      {transactions.map((tx) => {
        const type = resolveMovementType(tx);
        const amountColor =
          type === 'income'
            ? 'text-[var(--green-400)]'
            : type === 'expense'
              ? 'text-[var(--red-400)]'
              : 'text-[var(--text-secondary)]';
        const sign = tx.amount >= 0 ? '+' : '-';
        const category = type === 'credit_card_payment' ? null : tx.category_name;

        return (
          <li key={tx.id} className="flex items-start gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-[var(--text-primary)]">{tx.description}</div>
              {category && (
                <div className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">{category}</div>
              )}
            </div>
            <span className={cn('shrink-0 font-[family-name:var(--font-mono)] text-[13px] font-semibold', amountColor)}>
              {sign} {formatCurrency(Math.abs(tx.amount))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ExtratoLoader({ accountId }: { accountId: number }) {
  const [promise, setPromise] = useState(() => loadExtrato(accountId));
  const [, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(() => setPromise(loadExtrato(accountId)));
  }, [accountId]);

  return (
    <Suspense fallback={<ExtratoSkeleton />}>
      <ExtratoView promise={promise} onReload={reload} />
    </Suspense>
  );
}

function ExtratoView({ promise, onReload }: { promise: Promise<ExtratoResult>; onReload: () => void }) {
  const res = use(promise);
  const [filter, setFilter] = useState<Filter>('Todos');

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const transactions = useMemo(() => (res.ok ? res.transactions : []), [res]);

  const monthTxs = useMemo(
    () => transactions.filter((tx) => tx.date.startsWith(monthKey)),
    [transactions, monthKey],
  );

  const indicators = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transfer = 0;
    for (const tx of monthTxs) {
      const type = resolveMovementType(tx);
      if (type === 'income') income += tx.amount;
      else if (type === 'expense') expense += Math.abs(tx.amount);
      else if (type === 'internal_transfer') transfer += Math.abs(tx.amount);
    }
    return { income, expense, transfer };
  }, [monthTxs]);

  const groups = useMemo(() => {
    const wanted = FILTER_TYPE[filter];
    const base = [...monthTxs]
      .filter((tx) => (wanted ? resolveMovementType(tx) === wanted : true))
      .sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map<string, Transaction[]>();
    for (const tx of base) {
      if (!map.has(tx.date)) map.set(tx.date, []);
      map.get(tx.date)!.push(tx);
    }
    return [...map.entries()].map(([date, txs]) => ({ date, label: dateLabel(date), txs }));
  }, [monthTxs, filter]);

  if (!res.ok) {
    return (
      <StatePanel
        variant="error"
        message={res.error}
        actionLabel="Tentar novamente"
        onAction={onReload}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          size="sm"
          label="Saldo disponível"
          value="—"
          helper="Indisponível nesta versão"
          icon={<Wallet size={16} />}
          accent="var(--blue)"
        />
        <SummaryCard
          size="sm"
          label="Entradas"
          value={formatCurrency(indicators.income)}
          helper="Receitas do mês"
          icon={<ArrowUpRight size={16} />}
          accent="var(--green)"
        />
        <SummaryCard
          size="sm"
          label="Saídas reais"
          value={formatCurrency(indicators.expense)}
          helper="Despesas do mês"
          icon={<ArrowDownRight size={16} />}
          accent="var(--red)"
        />
        <SummaryCard
          size="sm"
          label="Transferências"
          value={formatCurrency(indicators.transfer)}
          helper="Entre suas contas"
          icon={<ArrowLeftRight size={16} />}
          accent="var(--text-secondary)"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={cn(
              'cursor-pointer rounded-full px-3 py-1.5 text-[12px]/[1] transition-colors duration-[120ms] ease-out outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,132,255,0.45)]',
              filter === option
                ? 'bg-[var(--surface-0)] font-semibold text-[var(--text-primary)] shadow-[0_1px_4px_rgba(0,0,0,0.4)] ring-1 ring-[rgba(255,255,255,0.08)]'
                : 'bg-[var(--surface-2)] font-normal text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <StatePanel
          variant="empty"
          title={EMPTY_BY_FILTER[filter]}
          message={
            monthTxs.length === 0
              ? 'As movimentações da conta aparecerão aqui.'
              : 'Ajuste o filtro para ver outras movimentações.'
          }
        />
      ) : (
        <ExpandableCard
          title={FILTER_TITLE[filter]}
          subtitle={movementCount(groups.reduce((sum, group) => sum + group.txs.length, 0))}
          defaultOpen
          maxContentHeight="max-h-[min(64vh,520px)]"
        >
          <div className="flex flex-col">
            {groups.map((group) => (
              <div key={group.date}>
                <div className="sticky top-0 z-[1] border-b border-[var(--separator)] bg-[var(--surface-1)] px-5 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  {group.label}
                </div>
                <MovementList transactions={group.txs} />
              </div>
            ))}
          </div>
        </ExpandableCard>
      )}
    </div>
  );
}

export function ExtratoPanel({ accounts, activeAccountId, setActiveAccountId }: ExtratoPanelProps) {
  const now = new Date();
  const periodLabel = `${MONTH_FULL[String(now.getMonth() + 1).padStart(2, '0')]} ${now.getFullYear()}`;

  if (accounts.length === 0) {
    return <StatePanel variant="empty" title="Nenhuma conta bancária nesta instituição." message="" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          Conta corrente
        </h1>
        <p className="mt-0.5 text-[14px] font-medium text-[var(--text-secondary)]">{periodLabel}</p>
      </header>

      {accounts.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {accounts.map((account) => (
            <Button
              key={account.id}
              type="button"
              variant={activeAccountId === account.id ? 'secondary' : 'outline'}
              size="sm"
              className={cn(
                'max-w-[180px] shrink truncate px-3 py-[5px] text-xs',
                activeAccountId === account.id ? 'font-semibold' : 'font-normal opacity-95',
              )}
              onClick={() => setActiveAccountId(account.id)}
            >
              {account.name}
            </Button>
          ))}
        </div>
      )}

      {activeAccountId == null ? (
        <ExtratoSkeleton />
      ) : (
        <ExtratoLoader key={activeAccountId} accountId={activeAccountId} />
      )}
    </div>
  );
}
