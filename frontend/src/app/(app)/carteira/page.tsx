/**
 * src/app/(app)/carteira/page.tsx
 *
 * Hub de Carteira — agrupa BankAccounts + CreditCards por instituição.
 * Rota: /carteira
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Plus,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/Layout/PageHeader';
import {
  api,
  type BankAccountConfig,
  type CreditCardConfig,
  type CardDashboard,
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/useIsMobile';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InstitutionGroup {
  name: string;
  slug: string;
  accounts: BankAccountConfig[];
  cards: CreditCardConfig[];
  dashboards: Map<number, CardDashboard>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase());
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking:   'Conta corrente',
  savings:    'Conta poupança',
  payment:    'Conta pagamento',
  business:   'Conta PJ',
  investment: 'Conta investimento',
  other:      'Outra',
};

// Paleta de cores por instituição
const INSTITUTION_COLORS: Record<string, string> = {
  nubank:              '#820AD1',
  'nu invest':         '#820AD1',
  nuinvest:            '#820AD1',
  itaú:                '#FF6B00',
  itau:                '#FF6B00',
  bradesco:            '#CC092F',
  santander:           '#EC0000',
  caixa:               '#006AAC',
  'banco do brasil':   '#F9B900',
  'bb ':               '#F9B900',
  inter:               '#FF7A00',
  'mercado pago':      '#00B1EA',
  'mercado livre':     '#FFE600',
  xp:                  '#1A1A1A',
  c6:                  '#2D2D2D',
  next:                '#00E06C',
  picpay:              '#21C25E',
  pagbank:             '#03A64A',
  avenue:              '#2563EB',
  sicoob:              '#006E35',
  sicredi:             '#009A44',
  sofisa:              '#E8612C',
  original:            '#00A859',
  'will bank':         '#FFDD00',
};

const FALLBACK_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#14B8A6'];

function getInstitutionColor(name: string): string {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(INSTITUTION_COLORS)) {
    if (key.includes(k)) return v;
  }
  const sum = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[sum % FALLBACK_COLORS.length];
}

function getAbbr(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CarteiraPage() {
  const isMobile = useIsMobile();
  const [accounts, setAccounts]     = useState<BankAccountConfig[]>([]);
  const [cards, setCards]           = useState<CreditCardConfig[]>([]);
  const [dashboards, setDashboards] = useState<Map<number, CardDashboard>>(new Map());
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accs, cds] = await Promise.all([
        api.listBankAccounts(false),
        api.listCards(),
      ]);
      setAccounts(accs);
      setCards(cds);

      // Carrega dashboards dos cartões em paralelo (ignora falhas individuais)
      const map = new Map<number, CardDashboard>();
      await Promise.allSettled(
        cds.map(async card => {
          try { map.set(card.id, await api.getCardDashboard(card.id)); }
          catch { /* skip */ }
        }),
      );
      setDashboards(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar carteira.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Agrupa por campo `institution` (string livre em ambos os tipos)
  const institutions = useMemo<InstitutionGroup[]>(() => {
    const map = new Map<string, InstitutionGroup>();

    const upsert = (institutionName: string | null): InstitutionGroup => {
      const name = institutionName?.trim() || 'Sem instituição';
      if (!map.has(name)) {
        map.set(name, { name, slug: toSlug(name), accounts: [], cards: [], dashboards });
      }
      return map.get(name)!;
    };

    accounts.forEach(acc  => upsert(acc.institution).accounts.push(acc));
    cards.forEach(card    => upsert(card.institution).cards.push(card));

    // Ordena alfabeticamente, "Sem instituição" vai para o final
    return Array.from(map.values()).sort((a, b) => {
      if (a.name === 'Sem instituição') return 1;
      if (b.name === 'Sem instituição') return -1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [accounts, cards, dashboards]);

  // Totais para o summary strip
  const totalFaturas = useMemo(
    () => cards.reduce((sum, card) => sum + (dashboards.get(card.id)?.latest_invoice?.computed_total ?? 0), 0),
    [cards, dashboards],
  );

  // ── Loading / Error ──
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
          <p style={{ color: 'var(--red-400)', fontSize: 14, marginBottom: 12 }}>{error}</p>
          <button onClick={() => void load()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid var(--border-default)',
            background: 'var(--surface-card)', color: 'var(--text-primary)',
            fontSize: 13, cursor: 'pointer',
          }}>
            Tentar novamente
          </button>
        </main>
      </>
    );
  }

  const activeAccountCount = accounts.filter(a => a.is_active).length;
  const padding = isMobile ? '16px 14px 32px' : '24px 32px 40px';

  return (
    <>
      <PageHeader
        title="Carteira"
        subtitle="Contas, cartões e investimentos — por instituição"
        px={isMobile ? 14 : 32}
      />
<main style={{ padding, flex: 1, maxWidth: 860, margin: '0 auto', width: '100%' }}>

        {/* Summary strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 20,
          boxShadow: 'var(--shadow-card)',
        }}>
          {[
            { label: 'Contas ativas',        value: String(activeAccountCount),   mono: false },
            { label: 'Cartões',              value: String(cards.length),          mono: false },
            { label: 'Fatura atual (total)', value: formatCurrency(totalFaturas),  mono: true,  color: totalFaturas > 0 ? 'var(--red-400)' : undefined },
            { label: 'Instituições',         value: String(institutions.length),   mono: false },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '14px 18px',
              borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none',
              borderBottom: isMobile && i < 2 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{
                fontFamily: s.mono ? 'var(--font-mono)' : 'inherit',
                fontSize: 17, fontWeight: 700,
                color: s.color ?? 'var(--text-primary)',
                letterSpacing: s.mono ? '-0.02em' : 0,
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {institutions.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            border: '1px dashed var(--border-default)', borderRadius: 16,
          }}>
            <Landmark size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <h2 style={{ fontSize: 17, marginBottom: 8 }}>Nenhuma conta ou cartão cadastrado</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Cadastre contas e cartões para visualizar sua carteira consolidada.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contas" style={primaryLinkStyle}>Cadastrar conta</Link>
              <Link href="/cartao" style={ghostLinkStyle}>Cadastrar cartão</Link>
            </div>
          </div>
        )}

        {/* Institution cards grid */}
        {institutions.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {institutions.map(inst => (
              <InstitutionCard key={inst.name} institution={inst} />
            ))}

            {/* Add CTA */}
            <Link href="/contas" style={{
              border: '1px dashed rgba(255,255,255,0.09)', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '24px', color: 'rgba(255,255,255,0.25)',
              fontSize: 13, textDecoration: 'none', transition: 'all 0.15s',
              minHeight: 100,
            }}>
              <Plus size={15} /> Nova conta / instituição
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

// ── InstitutionCard ───────────────────────────────────────────────────────────

function InstitutionCard({ institution }: { institution: InstitutionGroup }) {
  const { name, slug, accounts, cards, dashboards } = institution;
  const [hovered, setHovered] = useState(false);

  const color = getInstitutionColor(name);
  const abbr  = getAbbr(name);

  const tagParts = [
    accounts.length > 0 && `${accounts.length} conta${accounts.length > 1 ? 's' : ''}`,
    cards.length > 0    && `${cards.length} cartão`,
  ].filter(Boolean).join(' · ');

  const totalFatura = cards.reduce(
    (sum, card) => sum + (dashboards.get(card.id)?.latest_invoice?.computed_total ?? 0), 0,
  );

  return (
    <Link
      href={`/carteira/${slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:     hovered ? '#242424' : 'var(--surface-1)',
        border:         `1px solid ${hovered ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius:   20,
        padding:        20,
        textDecoration: 'none',
        color:          'inherit',
        display:        'block',
        cursor:         'pointer',
        transition:     'background 0.15s, border-color 0.15s',
        userSelect:     'none',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>

        {/* Avatar colorido */}
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.02em',
        }}>
          {abbr.charAt(0)}
        </div>

        {/* Nome + subtitle */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <div style={{
            fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em',
            lineHeight: 1.15, marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '-0.005em' }}>
            {tagParts}
          </div>
        </div>

        {/* Total fatura (se houver) */}
        {totalFatura > 0 && (
          <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 1 }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 17, fontWeight: 700,
              letterSpacing: '-0.025em', lineHeight: 1.1,
              color: 'var(--red-400)',
            }}>
              {formatCurrency(totalFatura)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary, rgba(255,255,255,0.35))', marginTop: 3 }}>
              fatura
            </div>
          </div>
        )}
      </div>

      {/* ── Products ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Contas bancárias */}
        {accounts.map(acc => (
          <div key={acc.id} style={productRowStyle}>
            {/* Dot */}
            <div style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: acc.is_active ? 'var(--green-400)' : 'rgba(255,255,255,0.2)',
            }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {acc.name}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 5, padding: '2px 6px',
                  color: 'rgba(255,255,255,0.55)',
                }}>
                  {ACCOUNT_TYPE_LABELS[acc.account_type] ?? acc.account_type}
                </span>
                {!acc.is_active && (
                  <span style={{ fontSize: 9, color: 'var(--amber-400)', fontWeight: 700, letterSpacing: '0.04em' }}>
                    INATIVA
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Cartões de crédito */}
        {cards.map(card => {
          const dash    = dashboards.get(card.id);
          const invoice = dash?.latest_invoice?.computed_total ?? null;
          return (
            <div key={card.id} style={productRowStyle}>
              {/* Dot vermelho */}
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: 'var(--red-400)', marginTop: 1,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {card.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                  Fecha {card.closing_day} · Vence {card.due_day}
                </div>
              </div>

              {invoice != null && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
                    letterSpacing: '-0.01em', lineHeight: 1,
                    color: 'var(--red-400)',
                  }}>
                    {formatCurrency(invoice)}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    fatura
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: 14, textAlign: 'right' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--blue-400)', letterSpacing: '-0.005em' }}>
          Ver detalhes →
        </span>
      </div>
    </Link>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const productRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '11px 14px',
  background: 'var(--surface-2)',
  borderRadius: 12,
};

const primaryLinkStyle: React.CSSProperties = {
  padding: '9px 18px', borderRadius: 9,
  background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
  color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none',
};

const ghostLinkStyle: React.CSSProperties = {
  padding: '9px 18px', borderRadius: 9,
  border: '1px solid var(--border-default)',
  color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none',
};
