'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Plus, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ExpandableCard } from '@/components/ui/expandable-card';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatePanel from '@/components/StatePanel';
import { useLancamentoModal } from '@/components/Lancamento/lancamento-modal-context';
import { api, type BankAccountConfig } from '@/lib/api';
import type { Transaction } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const MONTH_FULL: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

export interface ExtratoPanelProps {
  accounts: BankAccountConfig[];
  activeAccountId: number | null;
  setActiveAccountId: (id: number) => void;
}

function txCount(n: number) {
  return `${n} ${n === 1 ? 'movimentação' : 'movimentações'}`;
}

function MovementList({ transactions }: { transactions: Transaction[] }) {
  return (
    <ul className="divide-y divide-[var(--separator)]">
      {transactions.map((tx) => {
        const income = tx.amount >= 0;
        return (
          <li key={tx.id} className="flex items-start gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-[var(--text-primary)]">{tx.description}</div>
              <div className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                {formatDate(tx.date)}
                {tx.category_name ? ` · ${tx.category_name}` : ''}
              </div>
            </div>
            <span
              className={cn(
                'shrink-0 font-[family-name:var(--font-mono)] text-[13px] font-semibold',
                income ? 'text-[var(--green-400)]' : 'text-[var(--red-400)]',
              )}
            >
              {income ? '+' : '-'} {formatCurrency(Math.abs(tx.amount))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function exportCsv(transactions: Transaction[], filename: string) {
  const header = ['Data', 'Descrição', 'Categoria', 'Valor'];
  const rows = transactions.map((tx) => [
    tx.date,
    tx.description,
    tx.category_name ?? '',
    tx.amount.toFixed(2).replace('.', ','),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExtratoPanel({ accounts, activeAccountId, setActiveAccountId }: ExtratoPanelProps) {
  const { open: openLancamento } = useLancamentoModal();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (activeAccountId == null) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = (await api.getTransactions({ bank_account_id: activeAccountId })) as Transaction[];
      setTransactions([...data].sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar movimentações.');
    } finally {
      setLoading(false);
    }
  }, [activeAccountId]);

  useEffect(() => { void load(); }, [load]);

  const year = useMemo(() => {
    const latest = transactions[0]?.date;
    return latest ? Number(latest.slice(0, 4)) : new Date().getFullYear();
  }, [transactions]);

  const yearTxs = useMemo(
    () => transactions.filter((tx) => tx.date.startsWith(String(year))),
    [transactions, year],
  );

  const months = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    yearTxs.forEach((tx) => {
      const key = tx.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    });
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, txs]) => {
        const moved = txs.reduce((s, tx) => s + Math.abs(tx.amount), 0);
        const entradas = txs.filter((tx) => tx.amount >= 0).reduce((s, tx) => s + tx.amount, 0);
        const saidas = txs.filter((tx) => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);
        return { key, label: MONTH_FULL[key.slice(5, 7)] ?? key, txs, moved, entradas, saidas };
      });
  }, [yearTxs]);

  const previstos = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return yearTxs.filter((tx) => tx.amount < 0 && tx.date > today);
  }, [yearTxs]);

  const previstosTotal = previstos.reduce((s, tx) => s + Math.abs(tx.amount), 0);

  const activeAccount = accounts.find((account) => account.id === activeAccountId);

  if (accounts.length === 0) {
    return (
      <StatePanel variant="empty" title="Nenhuma conta bancária nesta instituição." message="" />
    );
  }

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            Movimentações
          </h1>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[15px] text-[var(--text-secondary)]">
            {year}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5"
            disabled={yearTxs.length === 0}
            onClick={() => exportCsv(yearTxs, `extrato-${activeAccount?.name ?? 'conta'}-${year}.csv`)}
          >
            <Download className="size-[13px] shrink-0" />
            Exportar extrato
          </Button>
          {activeAccountId != null && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5"
              render={<Link href={`/home/upload?type=bank_statement&bankAccountId=${activeAccountId}`} />}
            >
              <Upload className="size-[13px] shrink-0" />
              Importar extrato
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5"
            onClick={openLancamento}
          >
            <Plus className="size-[13px] shrink-0" />
            Adicionar lançamento
          </Button>
        </div>
      </header>

      {accounts.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
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

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <StatePanel variant="error" message={error} />
      ) : yearTxs.length === 0 ? (
        <StatePanel
          variant="empty"
          title="Nenhuma movimentação nesta conta."
          message="Adicione um lançamento manual para começar."
          onAction={openLancamento}
          actionLabel="Adicionar lançamento"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {previstos.length > 0 && (
            <ExpandableCard
              title="Gastos previstos"
              subtitle={txCount(previstos.length)}
              value={formatCurrency(previstosTotal)}
            >
              <MovementList transactions={previstos} />
            </ExpandableCard>
          )}

          {months.map((month) => (
            <ExpandableCard
              key={month.key}
              title={`Resumo · ${month.label}`}
              subtitle={txCount(month.txs.length)}
              value={formatCurrency(month.moved)}
            >
              <div className="grid grid-cols-2 gap-px bg-[var(--separator)]">
                <div className="bg-[var(--surface-1)] px-5 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                    Entradas
                  </div>
                  <div className="mt-1 font-[family-name:var(--font-mono)] text-[14px] font-bold text-[var(--green-400)]">
                    {formatCurrency(month.entradas)}
                  </div>
                </div>
                <div className="bg-[var(--surface-1)] px-5 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                    Saídas
                  </div>
                  <div className="mt-1 font-[family-name:var(--font-mono)] text-[14px] font-bold text-[var(--red-400)]">
                    {formatCurrency(month.saidas)}
                  </div>
                </div>
              </div>
              <MovementList transactions={month.txs} />
            </ExpandableCard>
          ))}
        </div>
      )}
    </div>
  );
}
