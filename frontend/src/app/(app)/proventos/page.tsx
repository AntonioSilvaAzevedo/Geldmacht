'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Award, Calendar,
  ChevronDown, ChevronRight, Coins,
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import EmptyState from '@/components/EmptyState';
import { useFinancialData } from '@/hooks/useFinancialData';
import { formatCurrency, formatDate, formatPercent } from '@/lib/formatters';

const MONTH_LABELS: Record<string, string> = {
  '2026-01': 'Janeiro',
  '2026-02': 'Fevereiro',
  '2026-03': 'Março',
  '2026-04': 'Abril',
};

const TYPE_COLORS = {
  Rendimento: '#63b3ed',
  Dividendo:  '#48bb78',
  JCP:        '#f6ad55',
};

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; name: string; value: number; color: string }>;
  label?: string;
}

function StackedTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 6,
        paddingTop: 6,
        display: 'flex',
        justifyContent: 'space-between',
        color: 'var(--text-primary)',
        fontWeight: 700,
      }}>
        <span>Total</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

interface StatKpiProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  accent: string;
  icon: React.ReactNode;
  delay?: number;
}

function StatKpi({ label, value, sub, color, accent, icon, delay = 1 }: StatKpiProps) {
  return (
    <div className={`animate-in delay-${delay}`} style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        transform: 'translate(20%, -20%)', pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: `${accent}20`, border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 19, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

export default function ProventosPage() {
  const { data, loading } = useFinancialData('dividends');
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (key: string) => {
    setOpenMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const months = useMemo(() => (data ? Object.keys(data) : []), [data]);

  const totalYear = useMemo(() => months.reduce((s, k) => s + (data?.[k].total ?? 0), 0), [data, months]);
  const avgMonth  = useMemo(() => months.length ? totalYear / months.length : 0, [totalYear, months]);
  const bestMonth = useMemo(() => {
    if (!data || !months.length) return { key: '', total: 0 };
    return months.reduce((best, k) => data[k].total > best.total ? { key: k, total: data[k].total } : best, { key: months[0], total: 0 });
  }, [data, months]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return months.map(k => ({
      mes: MONTH_LABELS[k]?.substring(0, 3) ?? k,
      Rendimento: data[k].byType.Rendimento,
      Dividendo:  data[k].byType.Dividendo,
      JCP:        data[k].byType.JCP,
    }));
  }, [data, months]);

  const topPayers = useMemo(() => {
    if (!data) return [];
    const totals: Record<string, number> = {};
    months.forEach(k => {
      data[k].transactions.forEach(tx => {
        totals[tx.ticker] = (totals[tx.ticker] ?? 0) + tx.value;
      });
    });
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [data, months]);

  const grandTotal = useMemo(() => months.reduce((s, k) => s + (data?.[k].total ?? 0), 0), [data, months]);

  if (loading) {
    return (
      <>
        <Header title="Proventos" subtitle="Carregando..." />
        <main style={{ padding: 24, flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ height: 90, background: 'var(--surface-card)', borderRadius: 12 }} />
            ))}
          </div>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header title="Proventos" subtitle="Sem dados" />
        <EmptyState actionHref="/upload" actionLabel="Importar extrato" />
      </>
    );
  }

  return (
    <>
      <Header title="Proventos" subtitle="Dividendos, JCP e Rendimentos de FIIs — 2026" />

      <main style={{ padding: '24px', flex: 1 }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatKpi
            label="Total Recebido no Ano"
            value={formatCurrency(totalYear)}
            sub={`${months.length} meses registrados`}
            color="var(--green-400)"
            accent="#48bb78"
            icon={<Coins size={15} />}
            delay={1}
          />
          <StatKpi
            label="Média Mensal"
            value={formatCurrency(avgMonth)}
            sub="Jan — Abr 2026"
            color="var(--blue-400)"
            accent="#63b3ed"
            icon={<TrendingUp size={15} />}
            delay={2}
          />
          <StatKpi
            label="Maior Mês"
            value={formatCurrency(bestMonth.total)}
            sub={MONTH_LABELS[bestMonth.key] ?? bestMonth.key}
            color="var(--amber-400)"
            accent="#f6ad55"
            icon={<Award size={15} />}
            delay={3}
          />
        </div>

        {/* Chart + Top Payers row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Stacked bar chart */}
          <div className="animate-in" style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '20px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Proventos por Mês
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Rendimentos (FII) · Dividendos · JCP
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barCategoryGap="32%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" tick={{ fill: '#566a84', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={v => `R$${(v).toFixed(0)}`}
                  tick={{ fill: '#566a84', fontSize: 10 }}
                  axisLine={false} tickLine={false} width={52}
                />
                <Tooltip content={<StackedTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} iconType="square" iconSize={8} />
                <Bar dataKey="Rendimento" name="Rendimentos (FII)" stackId="a" fill={TYPE_COLORS.Rendimento} radius={[0,0,0,0]} />
                <Bar dataKey="Dividendo"  name="Dividendos"        stackId="a" fill={TYPE_COLORS.Dividendo} radius={[0,0,0,0]} />
                <Bar dataKey="JCP"        name="JCP"               stackId="a" fill={TYPE_COLORS.JCP} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top payers */}
          <div className="animate-in" style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '20px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Top 5 Pagadores
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Acumulado no ano
              </div>
            </div>
            {topPayers.map(([ticker, total], i) => {
              const pct = (total / grandTotal) * 100;
              return (
                <div key={ticker} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                        width: 14, textAlign: 'right',
                      }}>{i + 1}.</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {ticker}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(total)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {formatPercent(pct)} do total
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'var(--navy-700)', borderRadius: 3 }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: i === 0 ? '#63b3ed' : i === 1 ? '#48bb78' : i === 2 ? '#b794f4' : i === 3 ? '#f6ad55' : '#4fd1c5',
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly summary table */}
        <div className="animate-in" style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Resumo Mensal</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th className="text-right">Nº Lançamentos</th>
                  <th className="text-right" style={{ color: TYPE_COLORS.Rendimento }}>Rendimentos (FII)</th>
                  <th className="text-right" style={{ color: TYPE_COLORS.Dividendo }}>Dividendos</th>
                  <th className="text-right" style={{ color: TYPE_COLORS.JCP }}>JCP</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {months.map(k => {
                  const m = data[k];
                  return (
                    <tr key={k}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {MONTH_LABELS[k]} 2026
                      </td>
                      <td className="numeric" style={{ color: 'var(--text-muted)' }}>{m.transactions.length}</td>
                      <td className="numeric" style={{ color: TYPE_COLORS.Rendimento }}>
                        {formatCurrency(m.byType.Rendimento)}
                      </td>
                      <td className="numeric" style={{ color: TYPE_COLORS.Dividendo }}>
                        {m.byType.Dividendo > 0 ? formatCurrency(m.byType.Dividendo) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="numeric" style={{ color: TYPE_COLORS.JCP }}>
                        {m.byType.JCP > 0 ? formatCurrency(m.byType.JCP) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="numeric" style={{ fontWeight: 700, color: 'var(--green-400)' }}>
                        {formatCurrency(m.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Ano</td>
                  <td className="numeric" style={{ color: 'var(--text-muted)' }}>
                    {months.reduce((s, k) => s + data[k].transactions.length, 0)}
                  </td>
                  <td className="numeric" style={{ color: TYPE_COLORS.Rendimento, fontWeight: 700 }}>
                    {formatCurrency(months.reduce((s, k) => s + data[k].byType.Rendimento, 0))}
                  </td>
                  <td className="numeric" style={{ color: TYPE_COLORS.Dividendo, fontWeight: 700 }}>
                    {formatCurrency(months.reduce((s, k) => s + data[k].byType.Dividendo, 0))}
                  </td>
                  <td className="numeric" style={{ color: TYPE_COLORS.JCP, fontWeight: 700 }}>
                    {formatCurrency(months.reduce((s, k) => s + data[k].byType.JCP, 0))}
                  </td>
                  <td className="numeric" style={{ fontWeight: 800, color: 'var(--green-300)' }}>
                    {formatCurrency(totalYear)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Accordion per month */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {months.map(k => {
            const m = data[k];
            const isOpen = openMonths.has(k);
            return (
              <div key={k} className="animate-in" style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => toggleMonth(k)}
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
                      background: 'rgba(72,187,120,0.12)',
                      border: '1px solid rgba(72,187,120,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--green-400)', flexShrink: 0,
                    }}>
                      <Calendar size={14} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {MONTH_LABELS[k]} 2026
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {m.transactions.length} lançamentos
                        {' · '}
                        <span style={{ color: TYPE_COLORS.Rendimento }}>
                          FII {formatCurrency(m.byType.Rendimento)}
                        </span>
                        {' · '}
                        <span style={{ color: TYPE_COLORS.Dividendo }}>
                          Div {formatCurrency(m.byType.Dividendo)}
                        </span>
                        {m.byType.JCP > 0 && (
                          <>{' · '}<span style={{ color: TYPE_COLORS.JCP }}>JCP {formatCurrency(m.byType.JCP)}</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 15, fontWeight: 700,
                      color: 'var(--green-400)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {formatCurrency(m.total)}
                    </span>
                    {isOpen ? <ChevronDown size={15} color="var(--text-muted)" /> : <ChevronRight size={15} color="var(--text-muted)" />}
                  </div>
                </button>

                {isOpen && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Ticker</th>
                          <th>Tipo</th>
                          <th className="text-right">Qtde</th>
                          <th className="text-right">Val. Unit.</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.transactions.map((tx, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {formatDate(tx.date)}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 12 }}>
                              {tx.ticker}
                            </td>
                            <td>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontSize: 10,
                                background: `${TYPE_COLORS[tx.type]}18`,
                                border: `1px solid ${TYPE_COLORS[tx.type]}30`,
                                color: TYPE_COLORS[tx.type],
                              }}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="numeric" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{tx.quantity}</td>
                            <td className="numeric" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                              {tx.unitValue > 0 ? formatCurrency(tx.unitValue) : '—'}
                            </td>
                            <td className="numeric" style={{
                              fontWeight: 600,
                              color: tx.value > 0 ? 'var(--green-400)' : 'var(--text-muted)',
                              fontSize: 12,
                            }}>
                              {tx.value > 0 ? formatCurrency(tx.value) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
