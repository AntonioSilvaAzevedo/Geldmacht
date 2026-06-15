/**
 * src/app/(app)/carteira/page.tsx
 *
 * Hub de Carteira — agrupa BankAccounts + CreditCards por instituição.
 * Rota: /carteira
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Landmark, Plus } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  api,
  type BankAccountConfig,
  type CreditCardConfig,
  type CardDashboard,
  type InstitutionConfig,
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { ACCOUNT_TYPE_LABELS } from '@/lib/carteira/account-type-labels';
import { toSlug } from '@/lib/carteira/institution-helpers';
import { useIsMobile } from '@/hooks/useIsMobile';
import { CreateInstitutionModal } from '@/components/carteira/CreateInstitutionModal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InstitutionGroup {
  name: string;
  slug: string;
  accounts: BankAccountConfig[];
  cards: CreditCardConfig[];
  dashboards: Map<number, CardDashboard>;
}

// ── Institution colors ──────────────────────────────────────────────────────
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
  const [institutionEntities, setInstitutionEntities] = useState<InstitutionConfig[]>([]);
  const [dashboards, setDashboards] = useState<Map<number, CardDashboard>>(new Map());
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accs, cds, insts] = await Promise.all([
        api.listBankAccounts(false),
        api.listCards(),
        api.listInstitutions(),
      ]);
      setAccounts(accs);
      setCards(cds);
      setInstitutionEntities(insts);

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

  useEffect(() => { void load(); }, []);

  async function handleCreateInstitution(name: string) {
    await api.createInstitution(name);
    setShowInstitutionModal(false);
    await load();
  }

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

    institutionEntities.forEach(inst => upsert(inst.name));
    accounts.forEach(acc  => upsert(acc.institution).accounts.push(acc));
    cards.forEach(card    => upsert(card.institution).cards.push(card));

    // Ordena alfabeticamente, "Sem instituição" vai para o final
    return Array.from(map.values()).sort((a, b) => {
      if (a.name === 'Sem instituição') return 1;
      if (b.name === 'Sem instituição') return -1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [accounts, cards, dashboards, institutionEntities]);

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
          <Button variant="outline" type="button" onClick={() => void load()} className="inline-flex shrink-0">
            Tentar novamente
          </Button>
        </main>
      </>
    );
  }

  const padding = isMobile ? '16px 14px 32px' : '24px 32px 40px';

  return (
    <>
<main style={{ padding, flex: 1, maxWidth: 860, margin: '0 auto', width: '100%' }}>

        {/* Empty state */}
        {institutions.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            border: '1px dashed var(--border-default)', borderRadius: 16,
          }}>
            <Landmark size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <h2 style={{ fontSize: 17, marginBottom: 8 }}>Nenhuma conta cadastrada</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Cadastre uma instituição para começar a organizar suas contas e cartões.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button type="button" variant="outline" onClick={() => setShowInstitutionModal(true)}>
                Cadastrar conta
              </Button>
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
            <button
              type="button"
              onClick={() => setShowInstitutionModal(true)}
              className="flex min-h-[100px] w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--border-default)] text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            >
              <Plus size={15} /> Adicionar conta
            </button>
          </div>
        )}
      </main>
      {showInstitutionModal && (
        <CreateInstitutionModal
          onClose={() => setShowInstitutionModal(false)}
          onSubmit={handleCreateInstitution}
        />
      )}
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
      href={`/home/carteira/${slug}`}
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
