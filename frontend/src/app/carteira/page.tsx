'use client';

import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Briefcase, TrendingUp, BarChart2,
  Bitcoin, Building2, Filter,
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import EmptyState from '@/components/EmptyState';
import { useFinancialData } from '@/hooks/useFinancialData';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import type { InvestmentAsset } from '@/types/financial';

const TYPE_COLORS: Record<string, string> = {
  'Ação': '#48bb78',
  'FII':  '#63b3ed',
  'ETF':  '#b794f4',
};

const FII_SEGMENTS = ['Logística', 'Papel', 'Híbrido', 'Agro', 'Shopping'];

interface TooltipPayload {
  name: string;
  value: number;
}

interface PieTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 3, fontWeight: 500 }}>{name}</div>
      <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}

type AssetType = 'Todos' | 'Ação' | 'FII' | 'ETF';

interface StatKpiProps {
  label: string;
  value: number;
  color: string;
  accent: string;
  icon: React.ReactNode;
  subtitle?: string;
  delay?: number;
}

function StatKpi({ label, value, color, accent, icon, subtitle, delay = 1 }: StatKpiProps) {
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
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 19, fontWeight: 700,
        color, fontVariantNumeric: 'tabular-nums',
      }}>
        {formatCurrency(value)}
      </div>
      {subtitle && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>{subtitle}</div>
      )}
    </div>
  );
}

export default function CarteiraPage() {
  const { data, loading } = useFinancialData('investments');
  const [activeType, setActiveType] = useState<AssetType>('Todos');
  const [fiiSegment, setFiiSegment] = useState<string>('Todos');

  const filteredAssets = useMemo<InvestmentAsset[]>(() => {
    if (!data) return [];
    let assets = data.assets;
    if (activeType !== 'Todos') assets = assets.filter(a => a.type === activeType);
    if (activeType === 'FII' && fiiSegment !== 'Todos') {
      assets = assets.filter(a => a.segment === fiiSegment);
    }
    return assets.sort((a, b) => b.totalValue - a.totalValue);
  }, [data, activeType, fiiSegment]);

  const top10 = useMemo<InvestmentAsset[]>(() => {
    if (!data) return [];
    return [...data.assets].sort((a, b) => b.totalValue - a.totalValue).slice(0, 10);
  }, [data]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Ações', value: data.totals.acoes },
      { name: 'FIIs', value: data.totals.fiis },
      { name: 'ETFs', value: data.totals.etfs },
      { name: 'Renda Fixa', value: data.totals.rendaFixa },
    ].filter(d => d.value > 0);
  }, [data]);

  const pieColors = ['#48bb78', '#63b3ed', '#b794f4', '#f6ad55'];

  const aporteMonths = data ? Object.keys(data.aportesMensais) : [];

  if (loading) {
    return (
      <>
        <Header title="Carteira B3" subtitle="Carregando..." />
        <main style={{ padding: 24, flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[0,1,2,3].map(i => (
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
        <Header title="Carteira B3" subtitle="Sem dados" />
        <EmptyState />
      </>
    );
  }

  const tabItems: AssetType[] = ['Todos', 'Ação', 'FII', 'ETF'];

  return (
    <>
      <Header title="Carteira B3" subtitle={`Atualizado em ${data.lastUpdate} · NuInvest ${data.account}`} />

      <main style={{ padding: '24px', flex: 1 }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatKpi
            label="Total Ações"
            value={data.totals.acoes}
            color="var(--green-400)"
            accent="#48bb78"
            icon={<TrendingUp size={15} />}
            subtitle={`${data.assets.filter(a => a.type === 'Ação').length} ativos`}
            delay={1}
          />
          <StatKpi
            label="Total FIIs"
            value={data.totals.fiis}
            color="var(--blue-400)"
            accent="#63b3ed"
            icon={<Building2 size={15} />}
            subtitle={`${data.assets.filter(a => a.type === 'FII').length} ativos`}
            delay={2}
          />
          <StatKpi
            label="Total ETFs"
            value={data.totals.etfs}
            color="var(--purple-400)"
            accent="#b794f4"
            icon={<BarChart2 size={15} />}
            subtitle={`${data.assets.filter(a => a.type === 'ETF').length} ativo`}
            delay={3}
          />
          <StatKpi
            label="Patrimônio Total"
            value={data.totals.patrimonio}
            color="var(--text-primary)"
            accent="#63b3ed"
            icon={<Briefcase size={15} />}
            subtitle={`Incl. Renda Fixa ${formatCurrency(data.totals.rendaFixa)}`}
            delay={4}
          />
        </div>

        {/* Charts + Top 10 row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Allocation pie */}
          <div className="animate-in" style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '20px',
          }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Alocação por Categoria
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Distribuição percentual do patrimônio
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top 10 */}
          <div className="animate-in" style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '20px',
          }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Top 10 Posições
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Por valor total
              </div>
            </div>
            {top10.map((asset, i) => {
              const barWidth = (asset.totalValue / top10[0].totalValue) * 100;
              return (
                <div key={asset.ticker} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 14 }}>{i + 1}.</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {asset.ticker}
                      </span>
                      <span style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 8,
                        background: `${TYPE_COLORS[asset.type]}20`,
                        color: TYPE_COLORS[asset.type],
                        border: `1px solid ${TYPE_COLORS[asset.type]}30`,
                      }}>
                        {asset.type}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(asset.totalValue)}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--navy-700)', borderRadius: 2 }}>
                    <div style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: TYPE_COLORS[asset.type],
                      borderRadius: 2,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assets table */}
        <div className="animate-in" style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          {/* Tabs */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {tabItems.map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveType(tab); setFiiSegment('Todos'); }}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: activeType === tab ? 600 : 400,
                    cursor: 'pointer',
                    border: `1px solid ${activeType === tab ? (tab === 'Todos' ? 'var(--blue-500)' : TYPE_COLORS[tab] ?? 'var(--blue-500)') : 'var(--border-default)'}`,
                    background: activeType === tab ? `${tab === 'Todos' ? '#3182ce' : (TYPE_COLORS[tab] ?? '#3182ce')}20` : 'transparent',
                    color: activeType === tab ? (tab === 'Todos' ? 'var(--blue-400)' : (TYPE_COLORS[tab] ?? 'var(--blue-400)')) : 'var(--text-secondary)',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* FII sub-filter */}
            {activeType === 'FII' && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Filter size={12} color="var(--text-muted)" />
                {['Todos', ...FII_SEGMENTS].map(seg => (
                  <button
                    key={seg}
                    onClick={() => setFiiSegment(seg)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: fiiSegment === seg ? 600 : 400,
                      cursor: 'pointer',
                      border: `1px solid ${fiiSegment === seg ? 'var(--blue-400)' : 'var(--border-default)'}`,
                      background: fiiSegment === seg ? 'rgba(99,179,237,0.15)' : 'transparent',
                      color: fiiSegment === seg ? 'var(--blue-400)' : 'var(--text-muted)',
                    }}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            )}

            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {filteredAssets.length} ativo{filteredAssets.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th className="text-right">Qtde</th>
                  <th className="text-right">PM</th>
                  <th className="text-right">Preço Atual</th>
                  <th className="text-right">Valor Total</th>
                  <th className="text-right">% Carteira</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => {
                  const rentab = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
                  return (
                    <tr key={asset.ticker}>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: TYPE_COLORS[asset.type],
                        }}>
                          {asset.ticker}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{asset.name}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 10,
                          background: `${TYPE_COLORS[asset.type]}18`,
                          border: `1px solid ${TYPE_COLORS[asset.type]}30`,
                          color: TYPE_COLORS[asset.type],
                        }}>
                          {asset.type}
                          {asset.segment ? ` · ${asset.segment}` : ''}
                          {asset.sector ? ` · ${asset.sector}` : ''}
                        </span>
                      </td>
                      <td className="numeric" style={{ color: 'var(--text-secondary)' }}>{asset.quantity}</td>
                      <td className="numeric" style={{ color: 'var(--text-muted)' }}>
                        {formatCurrency(asset.avgPrice)}
                      </td>
                      <td className="numeric">
                        <div>{formatCurrency(asset.currentPrice)}</div>
                        <div style={{
                          fontSize: 10,
                          color: rentab >= 0 ? 'var(--green-400)' : 'var(--red-400)',
                          marginTop: 1,
                        }}>
                          {rentab >= 0 ? '+' : ''}{formatPercent(rentab)}
                        </div>
                      </td>
                      <td className="numeric" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatCurrency(asset.totalValue)}
                      </td>
                      <td className="numeric">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                          <div style={{
                            width: 48,
                            height: 4,
                            background: 'var(--navy-700)',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(asset.portfolioPercent * 5, 100)}%`,
                              background: TYPE_COLORS[asset.type],
                              borderRadius: 2,
                            }} />
                          </div>
                          <span style={{ color: 'var(--text-secondary)', minWidth: 36, textAlign: 'right' }}>
                            {formatPercent(asset.portfolioPercent)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly contributions table */}
        <div className="animate-in" style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Aportes Mensais por Categoria</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Janeiro — Abril 2026</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th className="text-right" style={{ color: 'var(--green-400)' }}>Ações</th>
                  <th className="text-right" style={{ color: 'var(--blue-400)' }}>FIIs</th>
                  <th className="text-right" style={{ color: 'var(--purple-400)' }}>ETFs</th>
                  <th className="text-right" style={{ color: '#f6ad55' }}>Renda Fixa</th>
                  <th className="text-right" style={{ color: 'var(--text-secondary)' }}>Bitcoin</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {aporteMonths.map(k => {
                  const a = data.aportesMensais[k];
                  const monthLabel = k === '2026-01' ? 'Janeiro' : k === '2026-02' ? 'Fevereiro' : k === '2026-03' ? 'Março' : 'Abril';
                  return (
                    <tr key={k}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{monthLabel} 2026</td>
                      <td className="numeric" style={{ color: 'var(--green-400)' }}>
                        {a.acoes > 0 ? formatCurrency(a.acoes) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="numeric" style={{ color: 'var(--blue-400)' }}>
                        {a.fiis > 0 ? formatCurrency(a.fiis) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="numeric" style={{ color: 'var(--purple-400)' }}>
                        {a.etfs > 0 ? formatCurrency(a.etfs) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="numeric" style={{ color: '#f6ad55' }}>
                        {a.rendaFixa > 0 ? formatCurrency(a.rendaFixa) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="numeric" style={{ color: 'var(--text-muted)' }}>—</td>
                      <td className="numeric" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(a.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Período</td>
                  <td className="numeric" style={{ color: 'var(--green-400)', fontWeight: 700 }}>
                    {formatCurrency(aporteMonths.reduce((s, k) => s + data.aportesMensais[k].acoes, 0))}
                  </td>
                  <td className="numeric" style={{ color: 'var(--blue-400)', fontWeight: 700 }}>
                    {formatCurrency(aporteMonths.reduce((s, k) => s + data.aportesMensais[k].fiis, 0))}
                  </td>
                  <td className="numeric" style={{ color: 'var(--purple-400)', fontWeight: 700 }}>
                    {formatCurrency(aporteMonths.reduce((s, k) => s + data.aportesMensais[k].etfs, 0))}
                  </td>
                  <td className="numeric" style={{ color: '#f6ad55', fontWeight: 700 }}>
                    {formatCurrency(aporteMonths.reduce((s, k) => s + data.aportesMensais[k].rendaFixa, 0))}
                  </td>
                  <td className="numeric" style={{ color: 'var(--text-muted)' }}>R$ 0,00</td>
                  <td className="numeric" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatCurrency(aporteMonths.reduce((s, k) => s + data.aportesMensais[k].total, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bitcoin placeholder */}
        <div style={{
          marginTop: 16,
          padding: '14px 20px',
          background: 'var(--surface-card)',
          border: '1px dashed rgba(107,70,193,0.3)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Bitcoin size={16} color="var(--purple-400)" />
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Bitcoin — Categoria reservada. Antonio ainda não investe em cripto.
          </div>
        </div>
      </main>
    </>
  );
}
