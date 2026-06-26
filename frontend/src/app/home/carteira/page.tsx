/**
 * src/app/(app)/carteira/page.tsx
 *
 * Hub de Carteira — agrupa BankAccounts + CreditCards por instituição.
 * Rota: /carteira
 */

'use client';

import { Suspense, use, useCallback, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Landmark, Plus } from 'lucide-react';
import { CarteiraSkeleton } from '@/components/skeletons/CarteiraSkeleton';
import { Button } from '@/components/ui/button';
import {
  api,
  type BankAccountConfig,
  type CreditCardConfig,
  type CardDashboard,
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { ACCOUNT_TYPE_LABELS } from '@/lib/carteira/account-type-labels';
import { ensureInstitutionId } from '@/lib/carteira/ensure-institution';
import { useIsMobile } from '@/hooks/useIsMobile';
import { BankAccountModal, type BankAccountModalData } from '@/components/carteira/BankAccountModal';
import { AccountSettingsMenu } from '@/components/carteira/AccountSettingsMenu';

// ── Types ─────────────────────────────────────────────────────────────────────

const SEM_INSTITUICAO = -1;

interface InstitutionGroup {
  id: number | null;
  name: string;
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

type CarteiraResult =
  | { ok: true; accounts: BankAccountConfig[]; cards: CreditCardConfig[]; dashboards: Map<number, CardDashboard> }
  | { ok: false; error: string };

async function loadCarteira(): Promise<CarteiraResult> {
  try {
    const [accounts, cards] = await Promise.all([
      api.listBankAccounts(false),
      api.listCards(),
    ]);
    const dashboards = new Map<number, CardDashboard>();
    const results = await Promise.allSettled(cards.map((card) => api.getCardDashboard(card.id)));
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') dashboards.set(cards[index].id, result.value);
    });
    return { ok: true, accounts, cards, dashboards };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao carregar carteira.' };
  }
}

export default function CarteiraPage() {
  const isMobile = useIsMobile();
  const [showBankModal, setShowBankModal] = useState(false);
  const [promise, setPromise] = useState(() => loadCarteira());
  const [, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(() => setPromise(loadCarteira()));
  }, []);

  async function handleCreateBankAccount(payload: BankAccountModalData) {
    const institutionId = payload.institution ? await ensureInstitutionId(payload.institution) : null;
    await api.createBankAccount({ ...payload, institution_id: institutionId ?? undefined, currency: 'BRL', is_active: true });
    setShowBankModal(false);
    reload();
  }

  const padding = isMobile ? '16px 14px 32px' : '24px 32px 40px';

  return (
    <>
      <main style={{ padding, flex: 1, maxWidth: 860, margin: '0 auto', width: '100%' }}>
        <Suspense fallback={<CarteiraSkeleton isMobile={isMobile} />}>
          <CarteiraContent
            promise={promise}
            isMobile={isMobile}
            onReload={reload}
            onRequestAdd={() => setShowBankModal(true)}
          />
        </Suspense>
      </main>
      {showBankModal && (
        <BankAccountModal onClose={() => setShowBankModal(false)} onSubmit={handleCreateBankAccount} />
      )}
    </>
  );
}

interface CarteiraContentProps {
  promise: Promise<CarteiraResult>;
  isMobile: boolean;
  onReload: () => void;
  onRequestAdd: () => void;
}

function CarteiraContent({ promise, isMobile, onReload, onRequestAdd }: CarteiraContentProps) {
  const res = use(promise);

  const institutions = useMemo<InstitutionGroup[]>(() => {
    if (!res.ok) return [];
    const { accounts, cards, dashboards } = res;
    const map = new Map<number, InstitutionGroup>();

    const upsert = (id: number | null, institutionName: string | null): InstitutionGroup => {
      const key = id ?? SEM_INSTITUICAO;
      if (!map.has(key)) {
        map.set(key, {
          id,
          name: institutionName?.trim() || 'Sem instituição',
          accounts: [],
          cards: [],
          dashboards,
        });
      }
      return map.get(key)!;
    };

    accounts.forEach(acc  => upsert(acc.institution_id, acc.institution).accounts.push(acc));
    cards.forEach(card    => upsert(card.institution_id, card.institution).cards.push(card));

    return Array.from(map.values()).sort((a, b) => {
      if (a.name === 'Sem instituição') return 1;
      if (b.name === 'Sem instituição') return -1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [res]);

  if (!res.ok) {
    return (
      <>
        <p style={{ color: 'var(--red-400)', fontSize: 14, marginBottom: 12 }}>{res.error}</p>
        <Button variant="outline" type="button" onClick={onReload} className="inline-flex shrink-0">
          Tentar novamente
        </Button>
      </>
    );
  }

  return (
    <>
      {institutions.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          border: '1px dashed var(--border-default)', borderRadius: 16,
        }}>
          <Landmark size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
          <h2 style={{ fontSize: 17, marginBottom: 8 }}>Nenhuma conta bancária cadastrada</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
            Cadastre um banco ou conta bancária para vincular conta corrente, cartão de crédito, faturas e investimentos.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button type="button" variant="outline" onClick={onRequestAdd}>
              Cadastrar conta bancária
            </Button>
          </div>
        </div>
      )}

      {institutions.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: 12,
        }}>
          {institutions.map(inst => (
            <InstitutionCard key={inst.id ?? inst.name} institution={inst} onDeleted={onReload} />
          ))}
          <button
            type="button"
            onClick={onRequestAdd}
            className="flex min-h-[100px] w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--border-default)] text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <Plus size={15} /> Adicionar conta
          </button>
        </div>
      )}
    </>
  );
}

// ── InstitutionCard ───────────────────────────────────────────────────────────

function InstitutionCard({ institution, onDeleted }: { institution: InstitutionGroup; onDeleted: () => void }) {
  const { name, id, accounts, cards, dashboards } = institution;
  const [hovered, setHovered] = useState(false);

  const color = getInstitutionColor(name);
  const abbr  = getAbbr(name);

  const tagParts = [
    accounts.length > 0 && `${accounts.length} conta${accounts.length > 1 ? 's' : ''}`,
    cards.length > 0    && `${cards.length} cartão`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="relative">
    {id != null && (
      <AccountSettingsMenu
        institutionId={id}
        institutionName={name}
        onDeleted={onDeleted}
        className="absolute right-3 top-3 z-10"
      />
    )}
    <Link
      href={id != null ? `/home/carteira/${id}` : '/home/carteira'}
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
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1, paddingRight: 36 }}>
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
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const productRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '11px 14px',
  background: 'var(--surface-2)',
  borderRadius: 12,
};
