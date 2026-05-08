'use client';

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Layout/Header';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import WelcomeFlowGate from '@/components/WelcomeFlowGate';
import { useFinancialData } from '@/hooks/useFinancialData';
import { formatCurrency, classifyValue } from '@/lib/formatters';
import type { MonthlyData } from '@/types/financial';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; name: string; value: number; color: string }>;
  label?: string;
}

function BarTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function LineTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{ color: val >= 0 ? 'var(--green-400)' : 'var(--red-400)', fontFamily: 'var(--font-mono)' }}>
        Saldo: {formatCurrency(val)}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  accent: string;
  delay: number;
  subtitle?: string;
}

function StatCard({ label, value, icon, color, accent, delay, subtitle }: StatCardProps) {
  return (
    <div
      className={`animate-in delay-${delay}`}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0, right: 0,
        width: 120, height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        transform: 'translate(30%, -30%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: `${accent}20`, border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700,
        color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1.1,
      }}>
        {formatCurrency(value)}
      </div>

      {subtitle && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: '20px 22px',
      height: 100,
      animation: 'fadeInUp 0.5s ease both',
    }}>
      <div style={{ height: 11, width: '60%', background: 'var(--navy-700)', borderRadius: 4, marginBottom: 16 }} />
      <div style={{ height: 22, width: '80%', background: 'var(--navy-700)', borderRadius: 4 }} />
    </div>
  );
}

function buildChartData(data: MonthlyData) {
  return Object.keys(data).map(k => ({
    mes: data[k].month.substring(0, 3),
    entradas: Math.round(data[k].totalEntradas),
    gastos: Math.round(data[k].totalGastos),
    investimentos: Math.round(data[k].totalInvestimentos),
    saldo: Math.round(data[k].saldoLiquido),
  }));
}

export default function DashboardPage() {
  const { data, loading, error } = useFinancialData('monthly');

  const months = data ? Object.keys(data) : [];
  const monthCount = months.length || 1; // evita divisão por zero ao calcular médias
  const totalEntradas = data ? months.reduce((s, k) => s + data[k].totalEntradas, 0) : 0;
  const totalGastos   = data ? months.reduce((s, k) => s + data[k].totalGastos, 0) : 0;
  const totalInvest   = data ? months.reduce((s, k) => s + data[k].totalInvestimentos, 0) : 0;
  const saldoLiquido  = data ? months.reduce((s, k) => s + data[k].saldoLiquido, 0) : 0;
  const chartData = data ? buildChartData(data) : [];

  // Range dinâmico: usa o primeiro e último mês carregados (ex: "Janeiro — Abril 2026")
  const rangeLabel = (() => {
    if (!data || months.length === 0) return undefined;
    const first = data[months[0]];
    const last = data[months[months.length - 1]];
    if (!first || !last) return undefined;
    if (months.length === 1) return `${first.month} ${first.year}`;
    if (first.year === last.year) return `${first.month} — ${last.month} ${last.year}`;
    return `${first.month}/${first.year} — ${last.month}/${last.year}`;
  })();

  // Melhor e pior mês calculados a partir dos dados reais (saldo líquido).
  const { bestMonth, worstMonth } = (() => {
    if (!data || months.length === 0) return { bestMonth: null, worstMonth: null };
    let best = months[0];
    let worst = months[0];
    months.forEach(k => {
      if (data[k].saldoLiquido > data[best].saldoLiquido) best = k;
      if (data[k].saldoLiquido < data[worst].saldoLiquido) worst = k;
    });
    return {
      bestMonth: { key: best, ...data[best] },
      worstMonth: { key: worst, ...data[worst] },
    };
  })();

  if (error)              return <ErrorState message={error.message} />;
  if (!loading && !data)  return <EmptyState actionHref="/upload" actionLabel="Importar extrato" />;

  return (
    <>
      <WelcomeFlowGate />
      <Header title="Dashboard Anual" subtitle={rangeLabel} />

      <main style={{ padding: '24px', flex: 1 }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {loading ? (
            [0,1,2,3].map(i => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Total Entradas"
                value={totalEntradas}
                icon={<TrendingUp size={18} />}
                color="var(--green-400)"
                accent="#48bb78"
                delay={1}
                subtitle={`Média ${formatCurrency(totalEntradas / monthCount)}/mês`}
              />
              <StatCard
                label="Total Gastos"
                value={-totalGastos}
                icon={<TrendingDown size={18} />}
                color="var(--red-400)"
                accent="#fc8181"
                delay={2}
                subtitle={`Média ${formatCurrency(totalGastos / monthCount)}/mês`}
              />
              <StatCard
                label="Total Investido"
                value={totalInvest}
                icon={<PiggyBank size={18} />}
                color="var(--blue-400)"
                accent="#63b3ed"
                delay={3}
                subtitle={`Média ${formatCurrency(totalInvest / monthCount)}/mês`}
              />
              <StatCard
                label="Saldo Líquido"
                value={saldoLiquido}
                icon={<Wallet size={18} />}
                color={saldoLiquido >= 0 ? 'var(--green-400)' : 'var(--red-400)'}
                accent={saldoLiquido >= 0 ? '#48bb78' : '#fc8181'}
                delay={4}
                subtitle={rangeLabel ? `${rangeLabel} · acumulado` : 'Acumulado'}
              />
            </>
          )}
        </div>

        {!loading && data && (
          <>
            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>

              <div className="animate-in" style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '20px',
              }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Entradas vs Gastos vs Investimentos
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {rangeLabel ? `Por mês · ${rangeLabel}` : 'Por mês'}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={chartData} barCategoryGap="28%" barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="mes" tick={{ fill: '#566a84', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: '#566a84', fontSize: 10 }}
                      axisLine={false} tickLine={false} width={36}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} iconType="square" iconSize={8} />
                    <Bar dataKey="entradas"      name="Entradas"      fill="#48bb78" radius={[3,3,0,0]} />
                    <Bar dataKey="gastos"        name="Gastos"        fill="#fc8181" radius={[3,3,0,0]} />
                    <Bar dataKey="investimentos" name="Investimentos" fill="#63b3ed" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="animate-in" style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '20px',
              }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Evolução do Saldo Líquido
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Acumulado mês a mês</div>
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="mes" tick={{ fill: '#566a84', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
                      tick={{ fill: '#566a84', fontSize: 10 }}
                      axisLine={false} tickLine={false} width={40}
                    />
                    <Tooltip content={<LineTooltip />} />
                    <Line
                      type="monotone" dataKey="saldo" name="Saldo"
                      stroke="#63b3ed" strokeWidth={2.5}
                      dot={{ r: 5, fill: '#63b3ed', strokeWidth: 2, stroke: 'var(--surface-card)' }}
                      activeDot={{ r: 7, fill: '#63b3ed', stroke: 'var(--surface-card)', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly table */}
            <div className="animate-in" style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Resumo Mensal</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {rangeLabel ? `Consolidado · ${rangeLabel}` : 'Consolidado'}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {months.length} {months.length === 1 ? 'mês' : 'meses'}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th className="text-right">Salário CLT</th>
                      <th className="text-right">Honorários PJ</th>
                      <th className="text-right">Vale Alim.</th>
                      <th className="text-right">Total Entradas</th>
                      <th className="text-right">Fatura Cartão</th>
                      <th className="text-right">Fixos/Moradia</th>
                      <th className="text-right">Total Gastos</th>
                      <th className="text-right">Investimentos</th>
                      <th className="text-right">Saldo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map(k => {
                      const m = data[k];
                      const saldo = m.saldoLiquido;
                      return (
                        <tr key={k}>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.month} {m.year}</td>
                          <td className="numeric value-positive">{formatCurrency(m.entradas.salarioCLT)}</td>
                          <td className="numeric" style={{ color: 'var(--teal-400)' }}>
                            {m.entradas.honorariosPJ > 0 ? formatCurrency(m.entradas.honorariosPJ) : '—'}
                          </td>
                          <td className="numeric value-neutral">{formatCurrency(m.entradas.valeAlimentacao)}</td>
                          <td className="numeric" style={{ fontWeight: 600, color: 'var(--green-300)' }}>
                            {formatCurrency(m.totalEntradas)}
                          </td>
                          <td className="numeric value-negative">{formatCurrency(m.gastos.faturaCartao)}</td>
                          <td className="numeric" style={{ color: 'var(--amber-400)' }}>
                            {formatCurrency(m.gastos.fixosMoradia)}
                          </td>
                          <td className="numeric" style={{ fontWeight: 600, color: 'var(--red-400)' }}>
                            {formatCurrency(m.totalGastos)}
                          </td>
                          <td className="numeric value-invest">{formatCurrency(m.totalInvestimentos)}</td>
                          <td className="numeric" style={{ fontWeight: 700 }}>
                            <span className={classifyValue(saldo)}>
                              <span style={{ marginRight: 4, fontSize: 10 }}>{saldo >= 0 ? '▲' : '▼'}</span>
                              {formatCurrency(saldo)}
                            </span>
                          </td>
                          <td>
                            <Link href={`/mes/${k}`} style={{
                              fontSize: 11, color: 'var(--blue-400)', textDecoration: 'none',
                              display: 'flex', alignItems: 'center', gap: 3,
                              whiteSpace: 'nowrap', opacity: 0.8,
                            }}>
                              Detalhar <ArrowUpRight size={11} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Totais
                      </td>
                      <td className="numeric value-positive">{formatCurrency(months.reduce((s,k) => s + data[k].entradas.salarioCLT, 0))}</td>
                      <td className="numeric" style={{ color: 'var(--teal-400)' }}>{formatCurrency(months.reduce((s,k) => s + data[k].entradas.honorariosPJ, 0))}</td>
                      <td className="numeric value-neutral">{formatCurrency(months.reduce((s,k) => s + data[k].entradas.valeAlimentacao, 0))}</td>
                      <td className="numeric" style={{ color: 'var(--green-300)', fontWeight: 700 }}>{formatCurrency(totalEntradas)}</td>
                      <td className="numeric value-negative">{formatCurrency(months.reduce((s,k) => s + data[k].gastos.faturaCartao, 0))}</td>
                      <td className="numeric" style={{ color: 'var(--amber-400)' }}>{formatCurrency(months.reduce((s,k) => s + data[k].gastos.fixosMoradia, 0))}</td>
                      <td className="numeric" style={{ color: 'var(--red-400)', fontWeight: 700 }}>{formatCurrency(totalGastos)}</td>
                      <td className="numeric value-invest">{formatCurrency(totalInvest)}</td>
                      <td className="numeric" style={{ fontWeight: 700 }}>
                        <span className={classifyValue(saldoLiquido)}>
                          <span style={{ marginRight: 4, fontSize: 10 }}>{saldoLiquido >= 0 ? '▲' : '▼'}</span>
                          {formatCurrency(saldoLiquido)}
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid var(--border-subtle)' }}>
                {[
                  {
                    label: 'Taxa de Poupança',
                    value: totalEntradas > 0 ? `${((totalInvest / totalEntradas) * 100).toFixed(1)}%` : '—',
                    color: 'var(--blue-400)',
                  },
                  {
                    label: 'Gasto/Entrada',
                    value: totalEntradas > 0 ? `${((totalGastos / totalEntradas) * 100).toFixed(1)}%` : '—',
                    color: 'var(--amber-400)',
                  },
                  {
                    label: 'Melhor Mês',
                    value: bestMonth
                      ? `${bestMonth.month} (${bestMonth.saldoLiquido >= 0 ? '+' : ''}${formatCurrency(bestMonth.saldoLiquido)})`
                      : '—',
                    color: 'var(--green-400)',
                  },
                  {
                    label: 'Pior Mês',
                    value: worstMonth
                      ? `${worstMonth.month} (${worstMonth.saldoLiquido >= 0 ? '+' : ''}${formatCurrency(worstMonth.saldoLiquido)})`
                      : '—',
                    color: 'var(--red-400)',
                  },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '14px 20px',
                    borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
