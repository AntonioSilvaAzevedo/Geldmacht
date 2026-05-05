'use client';

import { useState, use } from 'react';
import {
  TrendingUp, TrendingDown, PiggyBank, Wallet,
  ChevronDown, ChevronRight, ArrowUpRight, CreditCard,
  ArrowRightLeft, Home, Landmark,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Layout/Header';
import MonthSelector, { AVAILABLE_MONTHS } from '@/components/MonthSelector';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { useFinancialData } from '@/hooks/useFinancialData';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Transaction } from '@/types/financial';

interface SectionProps {
  title: string;
  total: number;
  totalColor: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  informativo?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, total, totalColor, icon, isOpen, onToggle, informativo, children }: SectionProps) {
  return (
    <div
      className="animate-in"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid var(--border-subtle)' : 'none',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${totalColor}18`,
            border: `1px solid ${totalColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: totalColor, flexShrink: 0,
          }}>
            {icon}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
            {informativo && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                Informativo — não soma no total
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 15,
            fontWeight: 700,
            color: informativo ? 'var(--text-muted)' : totalColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatCurrency(Math.abs(total))}
          </span>
          {isOpen ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
        </div>
      </button>

      {isOpen && <div>{children}</div>}
    </div>
  );
}

function TxRow({ tx, informativo }: { tx: Transaction; informativo?: boolean }) {
  const color = informativo
    ? 'var(--text-muted)'
    : tx.amount >= 0
      ? 'var(--green-400)'
      : 'var(--red-400)';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 20px',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{tx.description}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {formatDate(tx.date)}
          {tx.account_type && <> · <span style={{ fontFamily: 'var(--font-mono)' }}>{tx.account_type}</span></>}
          {tx.category && <> · {tx.category}</>}
        </div>
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        fontWeight: 600,
        color,
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
        marginLeft: 16,
      }}>
        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
      </span>
    </div>
  );
}

interface PageProps {
  params: Promise<{ mes: string }>;
}

export default function MesPage({ params }: PageProps) {
  const { mes } = use(params);
  const { data: monthlyData, loading: loadingMonthly, error: errorMonthly } = useFinancialData('monthly');
  const { data: transactions, loading: loadingTx, error: errorTx } = useFinancialData('transactions');

  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['entradas', 'fixos', 'cartao', 'investimentos'])
  );

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loading = loadingMonthly || loadingTx;
  const error = errorMonthly ?? errorTx;

  const monthInfo = AVAILABLE_MONTHS.find(m => m.key === mes);
  const monthName = monthInfo?.full ?? mes;

  const monthData = monthlyData?.[mes];

  // ── Regras de categorização (MVP — sem category_group no banco) ─────────────
  const INVEST_KEYWORDS = ['aplicação rdb', 'compra de ações', 'compra de fii', 'compra de etf'];
  const isInvestment = (desc: string) =>
    INVEST_KEYWORDS.some(kw => desc.toLowerCase().includes(kw));

  const txForMonth = transactions?.filter(tx => tx.date.startsWith(mes)) ?? [];

  // Movimentações internas (is_internal_transfer = true)
  const txMovim = txForMonth.filter(tx => tx.is_internal_transfer);

  // Investimentos: saídas com keywords de aplicação/compra
  const txInvest = txForMonth.filter(
    tx => !tx.is_internal_transfer && tx.amount < 0 && isInvestment(tx.description),
  );

  // Fatura do cartão: filtra por billing_month (mês da fatura) se disponível,
  // senão cai no filtro por data (compatibilidade com dados antigos)
  const txCartao = (transactions ?? []).filter(tx => {
    if (tx.account_type !== 'nubank_cartao') return false;
    if (tx.billing_month) return tx.billing_month === mes;
    return tx.date.startsWith(mes);
  });

  // Entradas reais: positivas, não internas, não cartão
  const txEntradas = txForMonth.filter(
    tx => tx.amount > 0 && !tx.is_internal_transfer && tx.account_type !== 'nubank_cartao',
  );

  // Fixos/Moradia: saídas não internas, não investimentos, não cartão
  const txFixos = txForMonth.filter(
    tx =>
      tx.amount < 0 &&
      !tx.is_internal_transfer &&
      tx.account_type !== 'nubank_cartao' &&
      !isInvestment(tx.description),
  );

  // ── Totais calculados das transações reais (não do dashboard/monthly) ────────
  const totalEntradas = txEntradas.reduce((s, tx) => s + tx.amount, 0);
  const totalCartao   = txCartao.reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalFixos    = txFixos.reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalInvest   = txInvest.reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalGastos   = totalCartao + totalFixos;
  const saldoLiquido  = totalEntradas - totalGastos - totalInvest;

  if (error) return <ErrorState message={error.message} />;
  if (!loading && !monthlyData) return <EmptyState />;

  if (loading) {
    return (
      <>
        <Header title="Carregando..." subtitle={monthName} />
        <main style={{ padding: 24, flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                height: 64,
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                opacity: 1 - i * 0.15,
              }} />
            ))}
          </div>
        </main>
      </>
    );
  }

  if (!monthData) {
    return (
      <>
        <Header title="Mês não encontrado" subtitle={mes} />
        <main style={{ padding: 24, flex: 1 }}>
          <div style={{ color: 'var(--text-muted)' }}>
            Nenhum dado encontrado para {mes}.{' '}
            <Link href="/mes/2026-04" style={{ color: 'var(--blue-400)' }}>
              Ver Abril 2026
            </Link>
          </div>
        </main>
      </>
    );
  }

  const kpiCards = [
    {
      label: 'Total Entradas',
      value: totalEntradas,
      color: 'var(--green-400)',
      accent: '#48bb78',
      icon: <TrendingUp size={16} />,
    },
    {
      label: 'Total Gastos',
      value: totalGastos,
      color: 'var(--red-400)',
      accent: '#fc8181',
      icon: <TrendingDown size={16} />,
    },
    {
      label: 'Investimentos',
      value: totalInvest,
      color: 'var(--blue-400)',
      accent: '#63b3ed',
      icon: <PiggyBank size={16} />,
    },
    {
      label: 'Saldo Líquido',
      value: saldoLiquido,
      color: saldoLiquido >= 0 ? 'var(--green-400)' : 'var(--red-400)',
      accent: saldoLiquido >= 0 ? '#48bb78' : '#fc8181',
      icon: <Wallet size={16} />,
    },
  ];

  return (
    <>
      <Header
        title={`Visão Mensal — ${monthName}`}
        subtitle="Entradas, Gastos e Investimentos"
      />

      <main style={{ padding: '24px', flex: 1 }}>

        {/* Month selector row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <MonthSelector currentMonth={mes} basePath="/mes" />
          <Link href="/" style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            ← Dashboard Anual
          </Link>
        </div>

        {/* KPI cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}>
          {kpiCards.map((card, i) => (
            <div
              key={card.label}
              className={`animate-in delay-${i + 1}`}
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '18px 20px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: 80, height: 80, borderRadius: '50%',
                background: `radial-gradient(circle, ${card.accent}22 0%, transparent 70%)`,
                transform: 'translate(20%, -20%)', pointerEvents: 'none',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {card.label}
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: `${card.accent}20`,
                  border: `1px solid ${card.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.accent,
                }}>
                  {card.icon}
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 19,
                fontWeight: 700,
                color: card.color,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {formatCurrency(card.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Collapsible sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Entradas */}
          <CollapsibleSection
            title="Entradas"
            total={totalEntradas}
            totalColor="var(--green-400)"
            icon={<TrendingUp size={15} />}
            isOpen={openSections.has('entradas')}
            onToggle={() => toggleSection('entradas')}
          >
            {txEntradas.length > 0 ? (
              txEntradas.map(tx => <TxRow key={tx.id} tx={tx} />)
            ) : (
              <div style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                Nenhuma entrada registrada neste mês.
              </div>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 0,
              borderTop: '1px solid var(--border-subtle)',
            }}>
              {[
                { label: 'Salário CLT', value: monthData.entradas.salarioCLT },
                { label: 'Honorários PJ', value: monthData.entradas.honorariosPJ },
                { label: 'Vale Alim.', value: monthData.entradas.valeAlimentacao },
              ].map((item, i) => (
                <div key={item.label} style={{
                  padding: '12px 20px',
                  borderRight: i < 2 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-300)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Contas Fixas / Moradia */}
          <CollapsibleSection
            title="Contas Fixas / Moradia"
            total={totalFixos}
            totalColor="var(--amber-400)"
            icon={<Home size={15} />}
            isOpen={openSections.has('fixos')}
            onToggle={() => toggleSection('fixos')}
          >
            {txFixos.length > 0 ? (
              txFixos.map(tx => <TxRow key={tx.id} tx={tx} />)
            ) : (
              <div style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                Nenhuma conta fixa registrada neste mês.
              </div>
            )}
          </CollapsibleSection>

          {/* Fatura Cartão */}
          <CollapsibleSection
            title="Fatura Cartão Nubank"
            total={totalCartao}
            totalColor="var(--red-400)"
            icon={<CreditCard size={15} />}
            isOpen={openSections.has('cartao')}
            onToggle={() => toggleSection('cartao')}
          >
            {txCartao.map(tx => <TxRow key={tx.id} tx={tx} />)}
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Ver todas as transações do cartão, filtros por categoria e gráfico de pizza
              </div>
              <Link
                href={`/cartao/${mes}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--blue-400)',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  background: 'rgba(99,179,237,0.1)',
                  borderRadius: 6,
                  border: '1px solid rgba(99,179,237,0.2)',
                }}
              >
                Ver detalhes da fatura <ArrowUpRight size={12} />
              </Link>
            </div>
          </CollapsibleSection>

          {/* Movimentações de Contas */}
          <CollapsibleSection
            title="Movimentações de Contas"
            total={0}
            totalColor="var(--text-muted)"
            icon={<ArrowRightLeft size={15} />}
            isOpen={openSections.has('movimentacoes')}
            onToggle={() => toggleSection('movimentacoes')}
            informativo
          >
            {txMovim.length > 0 ? (
              txMovim.map(tx => <TxRow key={tx.id} tx={tx} informativo />)
            ) : (
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Transferências Pix entre contas próprias, resgates de caixinhas e outras movimentações internas.
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.7 }}>
                  Nenhuma movimentação registrada neste período.
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* Investimentos */}
          <CollapsibleSection
            title="Investimentos"
            total={totalInvest}
            totalColor="var(--blue-400)"
            icon={<Landmark size={15} />}
            isOpen={openSections.has('investimentos')}
            onToggle={() => toggleSection('investimentos')}
          >
            {txInvest.length > 0 ? (
              txInvest.map(tx => <TxRow key={tx.id} tx={tx} />)
            ) : (
              <div style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                Nenhum investimento registrado neste mês.
              </div>
            )}
            {txInvest.length > 0 && (
              <div style={{ padding: '10px 20px 10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                    Ações
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue-400)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(monthData.investimentos.acoes)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                    FIIs
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue-400)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(monthData.investimentos.fiis)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                    ETFs
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue-400)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(monthData.investimentos.etfs)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                    Renda Fixa
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue-400)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(monthData.investimentos.rendaFixa)}
                  </div>
                </div>
              </div>
            )}
          </CollapsibleSection>
        </div>

        {/* Balance indicator */}
        <div style={{
          marginTop: 20,
          padding: '14px 20px',
          background: 'var(--surface-card)',
          border: `1px solid ${saldoLiquido >= 0 ? 'rgba(72,187,120,0.2)' : 'rgba(252,129,129,0.2)'}`,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Saldo do Mês (Entradas − Gastos − Investimentos)
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              {formatCurrency(totalEntradas)} − {formatCurrency(totalGastos)} − {formatCurrency(totalInvest)}
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 22,
            fontWeight: 800,
            color: saldoLiquido >= 0 ? 'var(--green-400)' : 'var(--red-400)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ fontSize: 14, marginRight: 4 }}>
              {saldoLiquido >= 0 ? '▲' : '▼'}
            </span>
            {formatCurrency(saldoLiquido)}
          </div>
        </div>
      </main>
    </>
  );
}
