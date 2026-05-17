'use client';

/**
 * src/app/(app)/contas/[id]/page.tsx
 *
 * Tela de Movimentações de uma conta bancária.
 * Rota: /contas/[id]
 *
 * Composition:
 *   PageHeader  — breadcrumb + título + MonthNav no slot nav
 *   KPIStrip    — Entradas / Saídas / Saldo do mês
 *   TransactionList (editable) — lista completa, clique para editar desc/categoria
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import MonthNav from '@/components/MonthNav';
import KPIStrip from '@/components/KPIStrip';
import { TransactionList } from '@/components/TransactionList';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api, type BankAccountConfig, type Category } from '@/lib/api';
import type { Transaction } from '@/types/financial';
import { formatCurrency } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/useIsMobile';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTH_NAMES_LONG  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

interface NavMonth {
  id: string;     // "YYYY-MM"
  label: string;  // "Maio 2026"
  short: string;  // "Mai/26"
}

function buildMonthList(transactions: Transaction[]): NavMonth[] {
  const ids = [...new Set(transactions.map(tx => tx.date.slice(0, 7)))].sort();
  return ids.map(ym => {
    const [y, m] = ym.split('-');
    const mi = parseInt(m) - 1;
    return {
      id:    ym,
      label: `${MONTH_NAMES_LONG[mi]} ${y}`,
      short: `${MONTH_NAMES_SHORT[mi]}/${y.slice(2)}`,
    };
  });
}

function institutionSlugFor(account: BankAccountConfig): string | null {
  if (!account.institution?.trim()) return null;
  return encodeURIComponent(account.institution.toLowerCase().trim());
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MovimentacoesPage() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);
  const isMobile  = useIsMobile();

  const [account, setAccount]           = useState<BankAccountConfig | null>(null);
  const [allTxs, setAllTxs]             = useState<Transaction[]>([]);
  const [categories, setCategories]     = useState<string[]>([]);
  const [monthIdx, setMonthIdx]         = useState<number>(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!accountId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [acc, txs, cats] = await Promise.all([
          api.getBankAccount(accountId),
          api.getTransactions({ bank_account_id: accountId }) as Promise<Transaction[]>,
          api.listCategories('bank'),
        ]);

        setAccount(acc);

        const sorted = (txs as Transaction[]).sort((a, b) => b.date.localeCompare(a.date));
        setAllTxs(sorted);

        // Aponta para o mês mais recente com dados
        const months = buildMonthList(sorted);
        setMonthIdx(months.length > 0 ? months.length - 1 : 0);

        setCategories((cats as Category[]).map(c => c.name));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar movimentações.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [accountId]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const months = useMemo(() => buildMonthList(allTxs), [allTxs]);

  const currentMonthId = months[monthIdx]?.id ?? '';

  const monthTxs = useMemo(
    () => allTxs.filter(tx => tx.date.startsWith(currentMonthId)),
    [allTxs, currentMonthId],
  );

  const kpiItems = useMemo(() => {
    const entradas = monthTxs
      .filter(tx => tx.amount > 0 && tx.transaction_type !== 'transfer')
      .reduce((s, tx) => s + tx.amount, 0);
    const saidas = monthTxs
      .filter(tx => tx.amount < 0 && tx.transaction_type !== 'transfer')
      .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const saldo = entradas - saidas;
    return [
      { label: 'Entradas', value: formatCurrency(entradas), color: 'var(--green)' },
      { label: 'Saídas',   value: formatCurrency(saidas),   color: 'var(--red)'   },
      { label: 'Saldo',    value: formatCurrency(saldo),    color: saldo < 0 ? 'var(--red)' : undefined },
    ];
  }, [monthTxs]);

  // ── onSave ────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async (updated: Transaction) => {
    // Optimistic update
    setAllTxs(prev => prev.map(tx => tx.id === updated.id ? updated : tx));

    try {
      await api.updateTransaction(updated.id, {
        description: updated.description,
        category:    updated.category_display_label ?? updated.category_name ?? undefined,
      });
    } catch {
      // Reverte em caso de erro
      setAllTxs(prev => prev.map(tx => tx.id === updated.id ? tx : tx));
    }
  }, []);

  // ── Derived breadcrumb ────────────────────────────────────────────────────

  const crumbs = useMemo(() => {
    if (!account) return [{ href: '/carteira', label: 'Carteira' }];
    const slug = institutionSlugFor(account);
    return [
      { href: '/carteira', label: 'Carteira' },
      ...(slug
        ? [{ href: `/carteira/${slug}`, label: account.institution ?? 'Instituição' }]
        : []),
      { href: slug ? `/carteira/${slug}` : '/carteira', label: account.name },
    ];
  }, [account]);

  const subtitle = account
    ? [account.institution, account.name].filter(Boolean).join(' · ')
    : undefined;

  const px = isMobile ? 14 : 32;

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <main style={{ padding: 24 }}>
          <p style={{ color: 'var(--red)', fontSize: 14, marginBottom: 12 }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={ghostBtnStyle}
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </main>
      </>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const txSubtitle = monthTxs.length > 0
    ? `${monthTxs.length} lançamento${monthTxs.length > 1 ? 's' : ''} · clique para editar`
    : undefined;

  return (
    <>
      {/* ── Cabeçalho fixo ── */}
      <PageHeader
        title="Movimentações"
        subtitle={subtitle}
        crumbs={crumbs}
        px={px}
      />

      {/* ── Sub-header fixo: MonthNav + KPI ── */}
      {months.length > 0 && (
        <div style={{
          flexShrink: 0,
          padding: `12px ${px}px`,
          borderBottom: '1px solid var(--separator)',
          background: 'var(--surface-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <MonthNav items={months} idx={monthIdx} onNavigate={setMonthIdx} />
          <KPIStrip items={kpiItems} mb={0} />
        </div>
      )}

      {/* ── Área scrollável: só a lista ── */}
      <main style={{
        flex: 1,
        padding: isMobile ? '12px 14px 40px' : '16px 32px 48px',
        maxWidth: 800,
        margin: '0 auto',
        width: '100%',
        minHeight: 0,
      }}>
        {months.length === 0 ? (
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Nenhum lançamento encontrado para esta conta.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Importe um extrato OFX para começar.
            </p>
          </div>
        ) : (
          <TransactionList
            title="Lançamentos"
            subtitle={txSubtitle}
            transactions={monthTxs}
            editable={true}
            categories={categories}
            onSave={handleSave}
          />
        )}
      </main>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '8px 14px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'var(--surface-card)', color: 'var(--text-primary)',
  fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)',
};
