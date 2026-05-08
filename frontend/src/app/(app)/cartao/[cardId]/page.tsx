'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit3, Upload, ArrowRight, TrendingUp, Layers, Calendar, BarChart3, CreditCard as CreditCardIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Header from '@/components/Layout/Header';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import CategoryIcon from '@/components/CategoryIcon';
import CreditCardForm from '@/components/Cards/CreditCardForm';
import { api, type CardDashboard, type CreditCardConfig } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getOpeningDay } from '@/lib/cardDates';

interface PageProps {
  params: Promise<{ cardId: string }>;
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

function shortLabel(dueMonth: string): string {
  const [year, mon] = dueMonth.split('-');
  return `${MONTH_LABELS[mon] ?? mon}/${year.slice(-2)}`;
}

function fullMonthLabel(dueMonth: string): string {
  const [year, mon] = dueMonth.split('-');
  const full: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
  };
  return `${full[mon] ?? mon}/${year}`;
}

export default function CardDetailPage({ params }: PageProps) {
  const { cardId } = use(params);
  const id = Number(cardId);
  const [card, setCard] = useState<CreditCardConfig | null>(null);
  const [dashboard, setDashboard] = useState<CardDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardData, dashData] = await Promise.all([
        api.getCard(id),
        api.getCardDashboard(id),
      ]);
      setCard(cardData);
      setDashboard(dashData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cartão.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function updateCard(payload: Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'> & { credit_limit: number | null }) {
    // Sentinela: 0 limpa o credit_limit no backend.
    setCard(await api.updateCard(id, { ...payload, credit_limit: payload.credit_limit ?? 0 }));
    setEditing(false);
  }

  if (loading) {
    return (
      <>
        <Header title="Cartão de Crédito" subtitle="Carregando..." />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></main>
      </>
    );
  }
  if (error) return <ErrorState message={error} />;
  if (!card || !dashboard) return <ErrorState message="Cartão não encontrado." />;

  const hasInvoices = dashboard.invoice_count > 0;

  return (
    <>
      <Header title={card.name} subtitle="Visão geral do cartão" />
      <main style={{ padding: 24, flex: 1, display: 'grid', gap: 18, alignContent: 'start' }}>

        {/* ── Cabeçalho do cartão ─────────────────────────────────────────── */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 18,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>
              {card.institution || 'Instituição não informada'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Fechamento: dia {card.closing_day} · Abertura estimada: dia {getOpeningDay(card.closing_day)} · Vencimento: dia {card.due_day}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href={`/upload?type=credit_card&cardId=${card.id}`} style={primaryLinkStyle}>
              <Upload size={15} /> Importar fatura
            </Link>
            <button onClick={() => setEditing(v => !v)} style={secondaryButtonStyle}>
              <Edit3 size={15} /> Editar configurações
            </button>
          </div>
        </div>

        {editing && (
          <div style={{ maxWidth: 540 }}>
            <CreditCardForm
              initial={card}
              submitLabel="Salvar alterações"
              onSubmit={updateCard}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}

        {!hasInvoices ? (
          <EmptyState
            title="Nenhuma fatura importada para este cartão."
            message="Importe uma fatura para começar a visualizar estatísticas."
            actionHref={`/upload?type=credit_card&cardId=${card.id}`}
            actionLabel="Importar fatura"
          />
        ) : (
          <>
            {/* ── Cards de resumo ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <MetricCard
                label="Última fatura"
                value={
                  dashboard.latest_invoice
                    ? formatCurrency(
                        dashboard.latest_invoice.total_amount ??
                          dashboard.latest_invoice.computed_total
                      )
                    : '—'
                }
                subtitle={
                  dashboard.latest_invoice?.due_date
                    ? `Vence ${formatDate(dashboard.latest_invoice.due_date)}`
                    : dashboard.latest_invoice
                      ? fullMonthLabel(dashboard.latest_invoice.due_month)
                      : ''
                }
                icon={<Calendar size={14} color="var(--red-400)" />}
                color="var(--red-400)"
              />
              <MetricCard
                label="Média mensal"
                value={formatCurrency(dashboard.monthly_average)}
                subtitle={`Últimas ${dashboard.invoice_count} fatura${dashboard.invoice_count !== 1 ? 's' : ''}`}
                icon={<BarChart3 size={14} color="var(--blue-400)" />}
                color="var(--blue-400)"
              />
              <MetricCard
                label="Maior fatura"
                value={
                  dashboard.highest_invoice
                    ? formatCurrency(
                        dashboard.highest_invoice.total_amount ??
                          dashboard.highest_invoice.computed_total
                      )
                    : '—'
                }
                subtitle={
                  dashboard.highest_invoice
                    ? fullMonthLabel(dashboard.highest_invoice.due_month)
                    : ''
                }
                icon={<TrendingUp size={14} color="var(--amber-400)" />}
                color="var(--amber-400)"
              />
              <MetricCard
                label="Parcelas futuras"
                value={formatCurrency(dashboard.future_installments_total)}
                subtitle="Estimado a partir da última fatura"
                icon={<Layers size={14} color="var(--green-400)" />}
                color="var(--green-400)"
              />
              {/* Card de limite do cartão — só aparece quando o usuário informou. */}
              {card.credit_limit != null && card.credit_limit > 0 && (() => {
                const latestTotal = dashboard.latest_invoice
                  ? (dashboard.latest_invoice.total_amount ?? dashboard.latest_invoice.computed_total)
                  : null;
                const usagePct = latestTotal != null
                  ? (latestTotal / card.credit_limit) * 100
                  : null;
                return (
                  <MetricCard
                    label="Limite do cartão"
                    value={formatCurrency(card.credit_limit)}
                    subtitle={
                      usagePct != null
                        ? `Última fatura: ${usagePct.toFixed(1)}% do limite informado`
                        : 'Informado pelo usuário'
                    }
                    icon={<CreditCardIcon size={14} color="var(--teal-400)" />}
                    color="var(--teal-400)"
                  />
                );
              })()}
            </div>

            {/* ── Evolução das faturas ───────────────────────────────────── */}
            {dashboard.invoice_evolution.length > 1 && (
              <section style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 18,
              }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 12 }}>
                  Evolução das faturas
                </h2>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={dashboard.invoice_evolution.map(inv => ({
                        label: shortLabel(inv.due_month),
                        total: inv.total_amount ?? inv.computed_total,
                      }))}
                      margin={{ top: 6, right: 12, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={70} tickFormatter={v => formatCurrency(v as number)} />
                      <Tooltip
                        cursor={{ fill: 'rgba(49,130,206,0.08)' }}
                        contentStyle={{
                          background: 'var(--surface-panel)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 8,
                          fontSize: 12,
                          color: 'var(--text-primary)',
                        }}
                        formatter={(v) => formatCurrency(v as number)}
                      />
                      <Bar dataKey="total" fill="#3182ce" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* ── Categorias principais ──────────────────────────────────── */}
            {dashboard.top_categories.length > 0 && (
              <section style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 18,
              }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 12 }}>
                  Categorias principais
                </h2>
                <div style={{ display: 'grid', gap: 8 }}>
                  {dashboard.top_categories.map(cat => (
                    <div key={cat.category_id ?? cat.name} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      <span style={{
                        width: 30, height: 30, borderRadius: 7,
                        background: 'rgba(49,130,206,0.12)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <CategoryIcon icon={cat.icon} size={14} color="var(--blue-400)" />
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, flex: 1 }}>
                        {cat.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--red-400)', fontWeight: 700, fontSize: 13 }}>
                        {formatCurrency(cat.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Faturas recentes ───────────────────────────────────────── */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Faturas recentes
                </h2>
                <Link
                  href={`/cartao/${card.id}/faturas`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    color: 'var(--blue-400)', fontSize: 12, textDecoration: 'none', fontWeight: 600,
                  }}
                >
                  Ver todas as faturas <ArrowRight size={13} />
                </Link>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {dashboard.recent_invoices.map(inv => {
                  const total = inv.total_amount ?? inv.computed_total;
                  return (
                    <Link
                      key={inv.id}
                      href={`/cartao/${card.id}/fatura/${inv.id}`}
                      style={{
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        padding: '12px 14px',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {fullMonthLabel(inv.due_month)}
                        </div>
                        {inv.due_date && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                            Vence em {formatDate(inv.due_date)}
                          </div>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--red-400)', fontWeight: 700, fontSize: 14 }}>
                        {formatCurrency(total)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  color,
  icon,
}: {
  label: string;
  value: string;
  subtitle: string;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: '14px 16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 8,
      }}>
        {icon}
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {subtitle}
        </div>
      )}
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

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 13,
  cursor: 'pointer',
};
