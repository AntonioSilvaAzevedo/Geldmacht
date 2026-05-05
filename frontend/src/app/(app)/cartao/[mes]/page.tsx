'use client';

import { useState, use, useMemo, useEffect } from 'react';
import {
  Search, CreditCard, TrendingUp, TrendingDown, Hash,
  ArrowUpRight, ChevronDown, ChevronRight, AlertTriangle,
} from 'lucide-react';
import EditableDescription from '@/components/EditableDescription';
import Link from 'next/link';
import Header from '@/components/Layout/Header';
import MonthSelector from '@/components/MonthSelector';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorState from '@/components/ErrorState';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { api } from '@/lib/api';
import type { InvoiceSummary } from '@/lib/api';
import type { Transaction } from '@/types/financial';

// ── Barra de progresso de parcelas ───────────────────────────────────────────
function InstallmentBadge({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = (current / total) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <span style={{
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        color: 'var(--amber-400)',
        whiteSpace: 'nowrap',
      }}>
        {current}/{total}
      </span>
      <div style={{
        width: 40,
        height: 5,
        background: 'var(--navy-700)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct >= 100
            ? 'var(--green-400)'
            : pct >= 50
            ? 'var(--amber-400)'
            : 'var(--blue-400)',
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

// ── Accordion reutilizável ────────────────────────────────────────────────────
function Accordion({
  title,
  count,
  total,
  totalColor,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  total: number;
  totalColor: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid var(--border-subtle)' : 'none',
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
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {count} lançamento{count !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 15,
            fontWeight: 700,
            color: totalColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatCurrency(total)}
          </span>
          {isOpen
            ? <ChevronDown size={15} color="var(--text-muted)" />
            : <ChevronRight size={15} color="var(--text-muted)" />
          }
        </div>
      </button>

      {isOpen && <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>{children}</div>}
    </div>
  );
}

// ── Linha de transação ────────────────────────────────────────────────────────
function TxRow({
  tx,
  onDescriptionSave,
}: {
  tx: Transaction;
  onDescriptionSave?: (id: number, desc: string) => Promise<void>;
}) {
  const isParcelada = !!tx.installment_total;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        gap: 12,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {formatDate(tx.date)}
        </span>
        {onDescriptionSave ? (
          <EditableDescription
            value={tx.description}
            onSave={val => onDescriptionSave(tx.id, val)}
            textStyle={{
              fontSize: 13,
              color: tx.amount >= 0 ? 'var(--green-400)' : 'var(--text-primary)',
            }}
          />
        ) : (
          <span style={{
            fontSize: 13,
            color: tx.amount >= 0 ? 'var(--green-400)' : 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {tx.description}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {isParcelada && tx.installment_current != null && tx.installment_total != null && (
          <InstallmentBadge
            current={tx.installment_current}
            total={tx.installment_total}
          />
        )}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          fontWeight: 600,
          color: tx.amount >= 0 ? 'var(--green-400)' : 'var(--red-400)',
          whiteSpace: 'nowrap',
        }}>
          {tx.amount >= 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
        </span>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ mes: string }>;
}

export default function CartaoPage({ params }: PageProps) {
  const { mes } = use(params);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary]           = useState<InvoiceSummary | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [openVista, setOpenVista]       = useState(true);
  const [openParceladas, setOpenParceladas] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSummary(null);
    api.getCardInvoice(mes)
      .then((data) => {
        setTransactions(data.transactions as Transaction[]);
        setSummary(data.summary);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar transações.');
        setLoading(false);
      });
  }, [mes]);

  // ── Agrupamentos ────────────────────────────────────────────────────────────
  const aVista = useMemo(
    () => transactions.filter(tx => !tx.installment_total),
    [transactions],
  );
  const parceladas = useMemo(
    () => transactions.filter(tx => (tx.installment_total ?? 0) > 0),
    [transactions],
  );

  // ── Métricas vindas do backend ──────────────────────────────────────────────
  const totalFatura = summary?.total_invoice ?? 0;
  const paymentAmount = summary?.payment_amount ?? 0;
  const paymentDescription = summary?.payment_description ?? 'Pagamento da fatura';
  const totalOtherCredits = summary?.total_other_credits ?? 0;
  const totalOtherCreditsCount = summary?.total_other_credits_count ?? 0;
  const totalVista = Math.max(0, totalFatura - (summary?.total_installment_value ?? 0));
  const totalParcelado = summary?.total_installment_value ?? 0;
  const comprometimentoFuturo = summary?.future_commitment ?? 0;

  // ── Edição inline de descrição ──────────────────────────────────────────────
  const handleDescSave = async (txId: number, newDesc: string) => {
    await api.updateTransaction(txId, { description: newDesc });
    setTransactions(prev =>
      prev.map(tx => tx.id === txId ? { ...tx, description: newDesc } : tx)
    );
  };

  // ── Filtro de busca (aplicado a todos) ──────────────────────────────────────
  const filteredVista = useMemo(() => {
    if (!search) return aVista;
    const q = search.toLowerCase();
    return aVista.filter(tx => tx.description.toLowerCase().includes(q));
  }, [aVista, search]);

  const filteredParceladas = useMemo(() => {
    if (!search) return parceladas;
    const q = search.toLowerCase();
    return parceladas.filter(tx => tx.description.toLowerCase().includes(q));
  }, [parceladas, search]);

  // ── Loading / Error ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Header title="Cartão de Crédito" subtitle="Carregando..." />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </main>
      </>
    );
  }
  if (error) {
    return (
      <>
        <Header title="Cartão de Crédito" subtitle="Erro" />
        <main style={{ flex: 1 }}><ErrorState message={error} /></main>
      </>
    );
  }
  if (transactions.length === 0) {
    return (
      <>
        <Header title="Cartão de Crédito" subtitle={mes} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px 0' }}>
            <MonthSelector currentMonth={mes} basePath="/cartao" />
          </div>
          <EmptyState />
        </main>
      </>
    );
  }

  // ── Render principal ────────────────────────────────────────────────────────
  return (
    <>
      <Header
        title="Cartão de Crédito"
        subtitle={`Fatura ${mes} · ${transactions.length} lançamentos`}
      />

      <main style={{ padding: '24px', flex: 1 }}>

        {/* Month selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <MonthSelector currentMonth={mes} basePath="/cartao" />
          <Link href={`/mes/${mes}`} style={{
            fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ← Visão Mensal
          </Link>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            {
              label: 'Total da Fatura',
              value: formatCurrency(totalFatura),
              sub: `${summary?.total_expenses ?? 0} gastos`,
              color: 'var(--red-400)',
              accent: '#fc8181',
              icon: <CreditCard size={15} />,
            },
            ...(totalOtherCredits > 0 ? [{
              label: 'Estornos / Reembolsos',
              value: formatCurrency(totalOtherCredits),
              sub: `${totalOtherCreditsCount} créditos`,
              color: 'var(--green-400)',
              accent: '#48bb78',
              icon: <TrendingUp size={15} />,
            }] : []),
            {
              label: 'Maior Gasto',
              value: summary && summary.largest_expense > 0 ? formatCurrency(summary.largest_expense) : '—',
              sub: summary?.largest_expense_description.slice(0, 30) ?? '',
              color: 'var(--amber-400)',
              accent: '#f6ad55',
              icon: <TrendingDown size={15} />,
            },
            {
              label: 'Média por Gasto',
              value: formatCurrency(summary && summary.total_expenses > 0 ? totalFatura / summary.total_expenses : 0),
              sub: 'Ticket médio',
              color: 'var(--text-secondary)',
              accent: '#a0aec0',
              icon: <Hash size={15} />,
            },
          ].map((card, i) => (
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
                  background: `${card.accent}20`, border: `1px solid ${card.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.accent,
                }}>
                  {card.icon}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 19, fontWeight: 700, color: card.color, fontVariantNumeric: 'tabular-nums' }}>
                {card.value}
              </div>
              {card.sub && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{card.sub}</div>
              )}
            </div>
          ))}
        </div>

        {paymentAmount > 0 && (
          <div
            className="animate-in"
            style={{
              padding: '14px 18px',
              background: 'rgba(56,161,105,0.12)',
              border: '1px solid rgba(56,161,105,0.25)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(56,161,105,0.16)',
                border: '1px solid rgba(56,161,105,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--green-400)', flexShrink: 0,
              }}>
                <TrendingUp size={15} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Pagamento recebido
                </div>
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {paymentDescription}
                </div>
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--green-400)',
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}>
              {formatCurrency(paymentAmount)}
            </div>
          </div>
        )}

        {/* Busca global */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={13} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)',
          }} />
          <input
            type="text"
            placeholder="Buscar em todos os lançamentos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        {/* Accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Lançamentos à vista */}
          <Accordion
            title="Lançamentos do mês"
            count={filteredVista.length}
            total={totalVista}
            totalColor="var(--red-400)"
            icon={<CreditCard size={15} />}
            isOpen={openVista}
            onToggle={() => setOpenVista(v => !v)}
          >
            {filteredVista.map(tx => (
              <TxRow key={tx.id} tx={tx} onDescriptionSave={handleDescSave} />
            ))}
            {filteredVista.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Nenhum lançamento encontrado.
              </div>
            )}
          </Accordion>

          {/* Compras parceladas */}
          {parceladas.length > 0 && (
            <Accordion
              title="Compras Parceladas"
              count={filteredParceladas.length}
              total={totalParcelado}
              totalColor="var(--amber-400)"
              icon={<Hash size={15} />}
              isOpen={openParceladas}
              onToggle={() => setOpenParceladas(v => !v)}
            >
              {filteredParceladas.map(tx => (
                <TxRow key={tx.id} tx={tx} onDescriptionSave={handleDescSave} />
              ))}
              {filteredParceladas.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Nenhuma parcelada encontrada.
                </div>
              )}
            </Accordion>
          )}

          {/* Card comprometimento futuro */}
          {comprometimentoFuturo > 0 && (
            <div
              className="animate-in"
              style={{
                padding: '16px 20px',
                background: 'var(--surface-card)',
                border: '1px solid rgba(246,173,85,0.25)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(246,173,85,0.12)',
                  border: '1px solid rgba(246,173,85,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#f6ad55', flexShrink: 0,
                }}>
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Comprometimento futuro
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Parcelas restantes de {parceladas.length} compras nos próximos meses
                  </div>
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 17,
                fontWeight: 700,
                color: '#f6ad55',
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}>
                {formatCurrency(comprometimentoFuturo)}
              </div>
            </div>
          )}

        </div>

        {/* Link visão mensal */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href={`/mes/${mes}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600, color: 'var(--blue-400)',
              textDecoration: 'none', padding: '6px 12px',
              background: 'rgba(99,179,237,0.1)', borderRadius: 6,
              border: '1px solid rgba(99,179,237,0.2)',
            }}
          >
            Ver Visão Mensal de {mes} <ArrowUpRight size={12} />
          </Link>
        </div>

      </main>
    </>
  );
}
