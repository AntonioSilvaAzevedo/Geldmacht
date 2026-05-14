/**
 * src/app/(app)/cartao/[cardId]/page.tsx
 *
 * Dashboard do Cartão — redesenhado.
 * Substitui a versão anterior com:
 *   - CardHero com gradiente da instituição
 *   - KPIStrip com 3 métricas (em vez de 4-5 cards)
 *   - EvolutionBars CSS puro clicável (em vez de Recharts)
 *   - InvoiceList integrada com status
 */

'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit3, Upload } from 'lucide-react';
import EmptyState    from '@/components/EmptyState';
import ErrorState    from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import CreditCardForm from '@/components/Cards/CreditCardForm';
import { api, type CardDashboard, type CreditCardConfig, type InvoiceMini } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getOpeningDay }  from '@/lib/cardDates';
import { useIsMobile }    from '@/hooks/useIsMobile';
import { getInstitutionColor } from '@/lib/institutionColors';

interface PageProps { params: Promise<{ cardId: string }> }

// ─── Month helpers ─────────────────────────────────────────────────────────────
const MONTH_SHORT: Record<string, string> = {
  '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun',
  '07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez',
};
const MONTH_FULL: Record<string, string> = {
  '01':'Janeiro','02':'Fevereiro','03':'Março','04':'Abril',
  '05':'Maio','06':'Junho','07':'Julho','08':'Agosto',
  '09':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro',
};
function shortLabel(m: string) { const [y,mo]=m.split('-'); return `${MONTH_SHORT[mo]??mo}/${y.slice(-2)}`; }
function fullLabel(m: string)  { const [y,mo]=m.split('-'); return `${MONTH_FULL[mo]??mo}/${y}`; }
function invTotal(inv: InvoiceMini) { return inv.total_amount ?? inv.computed_total; }

// ─── CardHero ─────────────────────────────────────────────────────────────────
function CardHero({
  card, dashboard, onImport, onEdit, isMobile,
}: {
  card: CreditCardConfig;
  dashboard: CardDashboard;
  onImport: () => void;
  onEdit: () => void;
  isMobile: boolean;
}) {
  const color    = getInstitutionColor(card.institution ?? card.name);
  const invoice  = dashboard.latest_invoice;
  const invoiceAmt = invoice ? invTotal(invoice) : 0;
  const available  = card.credit_limit != null ? card.credit_limit - invoiceAmt : null;

  return (
    <div style={{
      borderRadius: 20, padding: isMobile ? '18px' : '22px 24px 20px',
      background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
      position: 'relative', overflow: 'hidden', marginBottom: 14,
    }}>
      {/* Decorative circles */}
      <div style={{ position:'absolute', top:-30, right:-30, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.09)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-40, right:60, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />

      {/* Top row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:'rgba(255,255,255,0.65)', marginBottom:5 }}>
            Cartão de crédito
          </div>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.1 }}>{card.name}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.60)', marginTop:3 }}>
            {card.institution || 'Instituição não informada'}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <button onClick={onImport} style={heroButtonStyle}>
            <Upload size={13} /> Importar fatura
          </button>
          <button onClick={onEdit} style={{ ...heroButtonStyle, background:'rgba(255,255,255,0.1)' }}>
            <Edit3 size={13} /> Editar
          </button>
        </div>
      </div>

      {/* KPIs row */}
      <div style={{ display:'flex', gap:isMobile?16:28, flexWrap:'wrap' }}>
        <div>
          <div style={heroLabelStyle}>Fatura atual</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:isMobile?20:26, fontWeight:700, letterSpacing:'-0.025em', lineHeight:1 }}>
            {formatCurrency(invoiceAmt)}
          </div>
          {invoice?.due_date && (
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:4 }}>
              Vence {formatDate(invoice.due_date)}
            </div>
          )}
        </div>
        {card.credit_limit != null && (
          <div>
            <div style={heroLabelStyle}>Limite</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600, letterSpacing:'-0.02em', lineHeight:1 }}>
              {formatCurrency(card.credit_limit)}
            </div>
          </div>
        )}
        {available != null && (
          <div>
            <div style={heroLabelStyle}>Disponível</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:600, letterSpacing:'-0.02em', lineHeight:1, color:'rgba(200,255,200,0.95)' }}>
              {formatCurrency(available)}
            </div>
          </div>
        )}
        <div style={{ marginLeft:'auto', textAlign:'right', alignSelf:'flex-end' }}>
          <div style={heroLabelStyle}>Fecha / Vence</div>
          <div style={{ fontSize:14, fontWeight:600, lineHeight:1 }}>
            Dia {card.closing_day} / Dia {card.due_day}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:3 }}>
            Abre dia {getOpeningDay(card.closing_day)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPIStrip ──────────────────────────────────────────────────────────────────
function KPIStrip({ dashboard }: { dashboard: CardDashboard }) {
  const highest = dashboard.highest_invoice;
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(3,1fr)',
      background:'var(--surface-card)', border:'1px solid var(--border-subtle)',
      borderRadius:16, overflow:'hidden', marginBottom:14,
    }}>
      {[
        { label:'Média mensal',     value:formatCurrency(dashboard.monthly_average),                               color:'var(--text-primary)' },
        { label:'Maior fatura',     value:highest ? formatCurrency(invTotal(highest)) : '—',                       color:'var(--amber-400)',    sub: highest ? fullLabel(highest.due_month) : undefined },
        { label:'Parcelas futuras', value:formatCurrency(dashboard.future_installments_total),                     color:'var(--blue-400)' },
      ].map((k,i) => (
        <div key={i} style={{ padding:'14px 16px', borderRight:i<2?'1px solid var(--border-subtle)':'none' }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:7 }}>
            {k.label}
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700, color:k.color, letterSpacing:'-0.02em', lineHeight:1.1 }}>
            {k.value}
          </div>
          {k.sub && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:3 }}>{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── EvolutionBars (CSS, sem Recharts) ────────────────────────────────────────
function EvolutionBars({
  evolution, currentId, onSelect, isMobile,
}: {
  evolution: InvoiceMini[];
  currentId: number | null;
  onSelect: (id: number) => void;
  isMobile: boolean;
}) {
  if (evolution.length < 2) return null;
  const max = Math.max(...evolution.map(invTotal));
  const visible = isMobile ? evolution.slice(-4) : evolution;

  return (
    <div style={{
      background:'var(--surface-card)', border:'1px solid var(--border-subtle)',
      borderRadius:16, padding:'16px 16px 12px', marginBottom:14,
    }}>
      <div style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.01em', marginBottom:14 }}>
        Evolução das faturas
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
        {visible.map(inv => {
          const pct  = (invTotal(inv) / max) * 100;
          const active = inv.id === currentId;
          return (
            <div key={inv.id} onClick={() => onSelect(inv.id)}
              style={{ flex:1, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div style={{
                fontSize:9, fontFamily:'var(--font-mono)',
                color: active?'var(--text-primary)':'var(--text-muted)',
                fontWeight: active?600:400, transition:'color 0.15s', textAlign:'center',
              }}>
                {formatCurrency(invTotal(inv)).replace('R$ ','').replace('R$ ','')}
              </div>
              <div style={{
                width:'100%', borderRadius:'4px 4px 0 0',
                height:`${Math.max(pct,8)}%`,
                background: active?'var(--blue-400)':'rgba(255,255,255,0.12)',
                transition:'all 0.2s',
              }} />
              <div style={{
                fontSize:10, color:active?'var(--blue-400)':'var(--text-muted)',
                fontWeight:active?600:400, whiteSpace:'nowrap', transition:'color 0.15s',
              }}>
                {shortLabel(inv.due_month)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── InvoiceList ──────────────────────────────────────────────────────────────
function InvoiceList({
  cardId, invoices,
}: {
  cardId: number;
  invoices: InvoiceMini[];
}) {
  if (!invoices.length) return null;
  const sorted = [...invoices].sort((a,b) => b.due_month.localeCompare(a.due_month));

  return (
    <div style={{ background:'var(--surface-card)', border:'1px solid var(--border-subtle)', borderRadius:16, overflow:'hidden' }}>
      <div style={{ padding:'13px 16px', borderBottom:'1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:13, fontWeight:600 }}>Faturas</span>
        <Link href={`/cartao/${cardId}/faturas`} style={{ fontSize:11, color:'var(--blue-400)', textDecoration:'none' }}>
          Ver todas →
        </Link>
      </div>
      {sorted.map((inv, i) => {
        const total = invTotal(inv);
        const isPaid = inv.total_amount != null && inv.total_amount > 0;
        return (
          <Link key={inv.id} href={`/cartao/${cardId}/fatura/${inv.id}`}
            style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 16px', textDecoration:'none', color:'inherit',
              borderBottom: i < sorted.length-1 ? '1px solid var(--border-subtle)' : 'none',
              transition:'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background='var(--surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background='transparent')}
          >
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{fullLabel(inv.due_month)}</div>
              {inv.due_date && (
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                  Vence {formatDate(inv.due_date)}
                </div>
              )}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--red-400)', letterSpacing:'-0.01em' }}>
                {formatCurrency(total)}
              </div>
              {isPaid && <div style={{ fontSize:10, color:'var(--green-400)', marginTop:2 }}>Paga ✓</div>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CardDetailPage({ params }: PageProps) {
  const router      = useRouter();
  const { cardId }  = use(params);
  const id          = Number(cardId);
  const isMobile    = useIsMobile();

  const [card, setCard]           = useState<CreditCardConfig | null>(null);
  const [dashboard, setDashboard] = useState<CardDashboard | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [editing, setEditing]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [c, d] = await Promise.all([api.getCard(id), api.getCardDashboard(id)]);
      setCard(c); setDashboard(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cartão.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function updateCard(payload: Pick<CreditCardConfig,'name'|'institution'|'closing_day'|'due_day'> & { credit_limit: number|null }) {
    setCard(await api.updateCard(id, { ...payload, credit_limit: payload.credit_limit ?? 0 }));
    setEditing(false);
  }

  if (loading) return (
    <main style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <LoadingSpinner />
    </main>
  );
  if (error)              return <ErrorState message={error} />;
  if (!card || !dashboard) return <ErrorState message="Cartão não encontrado." />;

  const hasInvoices = dashboard.invoice_count > 0;
  const padding = isMobile ? '16px 14px 32px' : '24px 28px 40px';

  return (
    <main style={{ flex:1, padding, maxWidth:860, margin:'0 auto', width:'100%' }}>

      <CardHero
        card={card} dashboard={dashboard} isMobile={isMobile}
        onImport={() => router.push(`/upload?type=credit_card&cardId=${card.id}`)}
        onEdit={() => setEditing(v => !v)}
      />

      {editing && (
        <div style={{ maxWidth:540, marginBottom:16 }}>
          <CreditCardForm
            initial={card} submitLabel="Salvar alterações"
            onSubmit={updateCard} onCancel={() => setEditing(false)}
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
          <KPIStrip dashboard={dashboard} />
          <EvolutionBars
            evolution={dashboard.invoice_evolution}
            currentId={dashboard.latest_invoice?.id ?? null}
            onSelect={invId => router.push(`/cartao/${card.id}/fatura/${invId}`)}
            isMobile={isMobile}
          />
          <InvoiceList cardId={card.id} invoices={dashboard.recent_invoices} />
        </>
      )}
    </main>
  );
}

// ─── Shared styles ─────────────────────────────────────────────────────────────
const heroLabelStyle: React.CSSProperties = {
  fontSize:9, fontWeight:600, letterSpacing:'0.09em',
  textTransform:'uppercase', color:'rgba(255,255,255,0.60)', marginBottom:5,
};
const heroButtonStyle: React.CSSProperties = {
  display:'inline-flex', alignItems:'center', gap:6,
  padding:'7px 13px', borderRadius:9,
  background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
  border:'1px solid rgba(255,255,255,0.25)',
  color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer',
  fontFamily:'var(--font-sans)', letterSpacing:'-0.01em',
};
