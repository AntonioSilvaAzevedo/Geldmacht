'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, Edit3 } from 'lucide-react';
import Header from '@/components/Layout/Header';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import CreditCardForm from '@/components/Cards/CreditCardForm';
import { api, type CardDashboard, type CardInvoice, type CreditCardConfig, type InvoiceMini } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

// ── Label helpers ─────────────────────────────────────────────────────────────

const FULL_MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const SHORT_MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function fullLabel(dueMonth: string): string {
  const [year, mon] = dueMonth.split('-');
  return `${FULL_MONTHS[parseInt(mon, 10) - 1] ?? mon} ${year}`;
}
function shortLabel(dueMonth: string): string {
  const [year, mon] = dueMonth.split('-');
  return `${SHORT_MONTHS[parseInt(mon, 10) - 1] ?? mon}/${year.slice(-2)}`;
}
function invTotal(inv: InvoiceMini): number {
  return inv.total_amount ?? inv.computed_total;
}
function fmtDue(dueDate: string): string {
  return new Date(dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

// ── Card accent color ─────────────────────────────────────────────────────────

const INSTITUTION_COLORS: Record<string, string> = {
  nubank: '#820AD1', itaú: '#FF6B00', itau: '#FF6B00',
  bradesco: '#CC0000', santander: '#EC0000',
  inter: '#FF6B2B', 'mercado pago': '#009EE3',
  c6: '#1A1A2E', xp: '#1D1D1F',
};
const CARD_PALETTE = ['#0A84FF', '#5E5CE6', '#FF9F0A', '#30D158', '#FF453A', '#5AC8FA'];

function cardAccent(card: CreditCardConfig): string {
  const key = (card.institution ?? '').toLowerCase().trim();
  return INSTITUTION_COLORS[key] ?? CARD_PALETTE[card.id % CARD_PALETTE.length];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CardDetailPage({ params }: { params: Promise<{ cardId: string }> }) {
  const router = useRouter();
  const { cardId } = use(params);
  const id = Number(cardId);

  const [card, setCard]           = useState<CreditCardConfig | null>(null);
  const [dashboard, setDashboard] = useState<CardDashboard | null>(null);
  const [invoices, setInvoices]   = useState<CardInvoice[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [editing, setEditing]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardData, dashData, invData] = await Promise.all([
        api.getCard(id),
        api.getCardDashboard(id),
        api.getCardInvoices(id),
      ]);
      setCard(cardData);
      setDashboard(dashData);
      setInvoices(invData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cartão.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function updateCard(
    payload: Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'> & { credit_limit: number | null }
  ) {
    setCard(await api.updateCard(id, { ...payload, credit_limit: payload.credit_limit ?? 0 }));
    setEditing(false);
  }

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
  if (error)               return <ErrorState message={error} />;
  if (!card || !dashboard) return <ErrorState message="Cartão não encontrado." />;

  const accent       = cardAccent(card);
  const hasInvoices  = dashboard.invoice_count > 0;
  const latestInv    = dashboard.latest_invoice;
  const latestTotal  = latestInv ? invTotal(latestInv) : 0;
  const disponivel   = card.credit_limit != null ? card.credit_limit - latestTotal : null;

  // Faturas ordenadas mais recente → mais antiga
  const sortedInvoices = [...invoices].sort((a, b) => b.due_month.localeCompare(a.due_month));
  const chartInvoices  = [...dashboard.invoice_evolution].sort((a, b) => a.due_month.localeCompare(b.due_month));
  const chartMax       = chartInvoices.length > 0 ? Math.max(...chartInvoices.map(invTotal)) : 1;

  return (
    <>
      <Header title={card.name} subtitle={card.institution ?? 'Cartão de crédito'} />

      <main style={{ padding: '0 20px 40px', flex: 1, maxWidth: 680, margin: '0 auto', width: '100%' }}>

        {/* ── Card Hero ── */}
        <div style={{ padding: '20px 0 0' }}>
          <div style={{
            borderRadius: 20, padding: '22px 24px 20px',
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}88 100%)`,
            position: 'relative', overflow: 'hidden', marginBottom: 16,
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.09)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 5 }}>
                  Cartão de crédito
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{card.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', marginTop: 3 }}>{card.institution ?? '—'}</div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Link href={`/upload?type=credit_card&cardId=${card.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 9,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                }}>
                  <Upload size={13} /> Importar fatura
                </Link>
                <button onClick={() => setEditing(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 11px', borderRadius: 9,
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.20)',
                  color: 'rgba(255,255,255,0.85)', fontSize: 12, cursor: 'pointer',
                }}>
                  <Edit3 size={13} />
                </button>
              </div>
            </div>

            {/* KPIs row */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={heroLabel}>Fatura atual</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1 }}>
                  {formatCurrency(latestTotal)}
                </div>
              </div>
              {card.credit_limit != null && (
                <div>
                  <div style={heroLabel}>Limite</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {formatCurrency(card.credit_limit)}
                  </div>
                </div>
              )}
              {disponivel != null && (
                <div>
                  <div style={heroLabel}>Disponível</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: 'rgba(200,255,200,0.9)' }}>
                    {formatCurrency(disponivel)}
                  </div>
                </div>
              )}
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={heroLabel}>Fecha / Vence</div>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1 }}>
                  Dia {card.closing_day} / Dia {card.due_day}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div style={{ marginBottom: 20 }}>
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
            {/* KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: S1, border: PANEL_BORDER, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
              {[
                { label: 'Média mensal',     value: formatCurrency(dashboard.monthly_average),                                                            color: '#fff' },
                { label: 'Maior fatura',     value: dashboard.highest_invoice ? formatCurrency(invTotal(dashboard.highest_invoice)) : '—', color: 'var(--orange-400, #FF9F0A)' },
                { label: 'Parcelas futuras', value: formatCurrency(dashboard.future_installments_total),                                  color: 'var(--blue-400, #0A84FF)' },
              ].map((k, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? `1px solid ${SEP}` : 'none' }}>
                  <div style={kpiLabel}>{k.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: k.color, letterSpacing: '-0.02em' }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Evolution Chart (pure CSS) */}
            {chartInvoices.length > 1 && (
              <div style={{ background: S1, border: PANEL_BORDER, borderRadius: 16, padding: '16px 16px 12px', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, letterSpacing: '-0.01em' }}>Evolução das faturas</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {chartInvoices.map(inv => {
                    const total   = invTotal(inv);
                    const pct     = chartMax > 0 ? (total / chartMax) * 100 : 0;
                    const isCur   = inv.id === latestInv?.id;
                    return (
                      <div key={inv.id}
                        onClick={() => router.push(`/cartao/${id}/fatura/${inv.id}`)}
                        style={{ flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
                      >
                        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: isCur ? '#fff' : T3, fontWeight: isCur ? 600 : 400, whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
                          {formatCurrency(total).replace(/R\$ ?/, '')}
                        </div>
                        <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 8)}%`, background: isCur ? 'var(--blue-400, #0A84FF)' : 'rgba(255,255,255,0.12)', transition: 'all 0.2s' }} />
                        <div style={{ fontSize: 10, color: isCur ? 'var(--blue-400, #0A84FF)' : T3, fontWeight: isCur ? 600 : 400, whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
                          {shortLabel(inv.due_month)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Invoice List */}
            <div style={{ background: S1, border: PANEL_BORDER, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: `1px solid ${SEP}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Faturas</span>
                <span style={{ fontSize: 11, color: T3 }}>{dashboard.invoice_count} faturas</span>
              </div>

              {sortedInvoices.map((inv, i) => {
                const isCur  = inv.id === latestInv?.id;
                const total  = inv.computed_total;
                return (
                  <Link key={inv.id} href={`/cartao/${id}/fatura/${inv.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: i < sortedInvoices.length - 1 ? `1px solid ${SEP}` : 'none',
                    background: isCur ? 'rgba(10,132,255,0.08)' : 'transparent',
                    textDecoration: 'none', color: 'inherit',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: isCur ? 600 : 500 }}>
                        {inv.label ?? fullLabel(inv.due_month)}
                        {isCur && (
                          <span style={{ marginLeft: 8, fontSize: 9, color: 'var(--blue-400, #0A84FF)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(10,132,255,0.15)', borderRadius: 4, padding: '2px 6px' }}>
                            ATUAL
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: T3, marginTop: 2 }}>
                        {inv.due_date ? `Vence ${fmtDue(inv.due_date)} · ` : ''}
                        {inv.transactions_count} lançamentos
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--red-400, #FF453A)', letterSpacing: '-0.01em' }}>
                      {formatCurrency(total)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}

// ── Shared tokens ─────────────────────────────────────────────────────────────

const S1           = 'var(--s1, #1C1C1E)';
const SEP          = 'rgba(255,255,255,0.07)';
const PANEL_BORDER = '1px solid rgba(255,255,255,0.06)';
const T3           = 'var(--text-muted, rgba(255,255,255,0.35))';

const heroLabel: React.CSSProperties = {
  fontSize: 9, fontWeight: 600, letterSpacing: '0.09em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 4,
};

const kpiLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
  textTransform: 'uppercase', color: T3, marginBottom: 7,
};
