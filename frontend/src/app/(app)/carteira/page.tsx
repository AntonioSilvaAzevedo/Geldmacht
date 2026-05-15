'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Layout/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  api,
  type BankAccountConfig,
  type CreditCardConfig,
  type CardDashboard,
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

// ── Helpers ───────────────────────────────────────────────────────────────────

const INSTITUTION_COLORS: Record<string, string> = {
  nubank:              '#820AD1',
  itaú:                '#FF6B00',
  itau:                '#FF6B00',
  bradesco:            '#CC0000',
  santander:           '#EC0000',
  inter:               '#FF6B2B',
  'mercado pago':      '#009EE3',
  c6:                  '#444',
  'banco do brasil':   '#FFDD00',
  caixa:               '#006B3F',
  xp:                  '#1A1A2E',
};
const PALETTE = ['#0A84FF', '#5E5CE6', '#30D158', '#FF9F0A', '#FF453A', '#5AC8FA'];

function instColor(name: string, idx: number): string {
  return INSTITUTION_COLORS[name.toLowerCase().trim()] ?? PALETTE[idx % PALETTE.length];
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking:   'PF',
  savings:    'Poupança',
  payment:    'Pagamento',
  business:   'PJ',
  investment: 'Invest.',
  other:      'Outra',
};

function instSlug(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase());
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface InstitutionGroup {
  name: string;
  accounts: BankAccountConfig[];
  cards: CreditCardConfig[];
}

// ── Sub-components ────────────────────────────────────────────────────────────

const sep = '1px solid rgba(255,255,255,0.07)';

function Tag({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
      padding: '2px 6px', borderRadius: 5,
      background: 'rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.5)',
    }}>
      {label}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%',
      background: color, flexShrink: 0,
    }} />
  );
}

function AccountRow({ account, last }: { account: BankAccountConfig; last: boolean }) {
  const tag = ACCOUNT_TYPE_LABELS[account.account_type] ?? account.account_type;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      borderBottom: last ? 'none' : sep,
    }}>
      <Dot color="#30D158" />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#fff', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {account.name}
      </span>
      <Tag label={tag} />
    </div>
  );
}

function CardRow({
  card, dashboard, last,
}: {
  card: CreditCardConfig;
  dashboard: CardDashboard | undefined;
  last: boolean;
}) {
  const invoice = dashboard?.latest_invoice?.computed_total;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      borderBottom: last ? 'none' : sep,
    }}>
      <Dot color="#FF453A" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {card.name}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
          Fecha {card.closing_day} · Vence {card.due_day}
        </div>
      </div>
      {invoice != null && (
        <span style={{ fontFamily: 'var(--font-mono,"DM Mono",monospace)', fontSize: 13, fontWeight: 600, color: '#FF453A', flexShrink: 0 }}>
          {formatCurrency(invoice)}
        </span>
      )}
    </div>
  );
}

function InstitutionCard({
  group, idx, dashboards,
}: {
  group: InstitutionGroup;
  idx: number;
  dashboards: Map<number, CardDashboard>;
}) {
  const [hov, setHov] = useState(false);
  const color = instColor(group.name, idx);
  const initial = group.name.charAt(0).toUpperCase();

  const accountCount = group.accounts.length;
  const cardCount = group.cards.length;
  const subtitle = [
    accountCount > 0 && `${accountCount} conta${accountCount > 1 ? 's' : ''}`,
    cardCount > 0    && `${cardCount} cartão${cardCount > 1 ? 'ões' : ''}`,
  ].filter(Boolean).join(' · ');

  const rows = [
    ...group.accounts.map((a) => ({ type: 'account' as const, item: a })),
    ...group.cards.map((c) => ({ type: 'card' as const, item: c })),
  ];

  return (
    <Link
      href={`/carteira/${instSlug(group.name)}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? '#242424' : '#1C1C1E',
          borderRadius: 20,
          border: `1px solid ${hov ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'}`,
          padding: 20,
          transition: 'background 0.12s, border-color 0.12s',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>
            {initial}
          </div>

          {/* Name + subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {group.name}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              {subtitle}
            </div>
          </div>
        </div>

        {/* Rows */}
        {rows.length > 0 && (
          <div style={{
            background: '#2C2C2E', borderRadius: 12, overflow: 'hidden',
          }}>
            {rows.map((r, i) =>
              r.type === 'account' ? (
                <AccountRow key={`a-${r.item.id}`} account={r.item} last={i === rows.length - 1} />
              ) : (
                <CardRow
                  key={`c-${r.item.id}`}
                  card={r.item}
                  dashboard={dashboards.get(r.item.id)}
                  last={i === rows.length - 1}
                />
              )
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ fontSize: 13, color: '#0A84FF', fontWeight: 500 }}>
          Ver detalhes →
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CarteiraPage() {
  const [groups, setGroups] = useState<InstitutionGroup[]>([]);
  const [dashboards, setDashboards] = useState<Map<number, CardDashboard>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [accounts, cards] = await Promise.all([
        api.listBankAccounts(false),
        api.listCards(),
      ]);

      // Group by institution
      const map = new Map<string, InstitutionGroup>();
      for (const a of accounts) {
        const key = (a.institution?.trim() || 'Sem instituição').toLowerCase();
        const label = a.institution?.trim() || 'Sem instituição';
        if (!map.has(key)) map.set(key, { name: label, accounts: [], cards: [] });
        map.get(key)!.accounts.push(a);
      }
      for (const c of cards) {
        const key = (c.institution?.trim() || 'Sem instituição').toLowerCase();
        const label = c.institution?.trim() || 'Sem instituição';
        if (!map.has(key)) map.set(key, { name: label, accounts: [], cards: [] });
        map.get(key)!.cards.push(c);
      }

      const sorted = Array.from(map.values()).sort((a, b) =>
        a.name.toLowerCase() === 'sem instituição' ? 1
          : b.name.toLowerCase() === 'sem instituição' ? -1
          : a.name.localeCompare(b.name)
      );
      setGroups(sorted);

      // Load dashboards for all cards in parallel
      const results = await Promise.allSettled(
        cards.map((c) => api.getCardDashboard(c.id).then((d) => ({ id: c.id, d })))
      );
      const dm = new Map<number, CardDashboard>();
      for (const r of results) {
        if (r.status === 'fulfilled') dm.set(r.value.id, r.value.d);
      }
      setDashboards(dm);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <Header title="Carteira" subtitle="Suas instituições financeiras" />
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <LoadingSpinner />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
          padding: '0 0 80px',
        }}>
          {groups.map((g, i) => (
            <InstitutionCard key={g.name} group={g} idx={i} dashboards={dashboards} />
          ))}
        </div>
      )}
    </>
  );
}
