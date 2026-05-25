/**
 * src/app/(app)/carteira/[slug]/page.tsx
 *
 * Detalhe de Instituição — tabs Extrato / Cartão / Resumo.
 * Rota: /carteira/[slug]
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Landmark, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/Layout/PageHeader';
import { Button } from '@/components/ui/button';
import {
  api,
  type BankAccountConfig,
  type CreditCardConfig,
  type CardDashboard,
  type CardInvoice,
} from '@/lib/api';
import type { Transaction } from '@/types/financial';
import { formatCurrency } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getInstitutionColor } from '@/lib/institutionColors';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'extrato' | 'cartao' | 'resumo';

// ── Color palette ─────────────────────────────────────────────────────────────
// Importado de @/lib/institutionColors — compartilhado com cartao/[cardId]

// ── Helpers ───────────────────────────────────────────────────────────────────

function decodeSlug(slug: string): string {
  try { return decodeURIComponent(slug); } catch { return slug; }
}

function matchesInstitution(field: string | null, name: string): boolean {
  return (field?.trim() || 'sem instituição').toLowerCase() === name.toLowerCase();
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking:   'Conta corrente',
  savings:    'Conta poupança',
  payment:    'Conta pagamento',
  business:   'Conta PJ',
  investment: 'Conta investimento',
  other:      'Outra',
};

function fmtTxDate(iso: string): string {
  const d = iso.split('T')[0].split('-');
  return d.length === 3 ? `${d[2]}/${d[1]}` : iso;
}

function txDotColor(tx: Transaction): string {
  if (tx.is_internal_transfer) return 'rgba(255,255,255,0.25)';
  if (tx.transaction_type === 'income')  return 'var(--green-400)';
  if (tx.transaction_type === 'expense' || tx.transaction_type === 'payment') return 'var(--red-400)';
  return 'rgba(255,255,255,0.25)';
}

function txAmountColor(tx: Transaction): string {
  if (tx.is_internal_transfer) return 'var(--text-muted)';
  if (tx.transaction_type === 'income')  return 'var(--green-400)';
  if (tx.transaction_type === 'expense' || tx.transaction_type === 'payment') return 'var(--red-400)';
  return 'var(--text-muted)';
}

function fmtSignedAmount(amount: number): string {
  const prefix = amount >= 0 ? '+' : '−';
  return `${prefix}${formatCurrency(Math.abs(amount))}`;
}

// ── TxRow ─────────────────────────────────────────────────────────────────────

function TxRow({ tx, last }: { tx: Transaction; last: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      data-txrow=""
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 20px',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.07)',
        background: hov ? 'rgba(255,255,255,0.03)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {/* Dot */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: txDotColor(tx),
        flexShrink: 0, marginTop: 7,
      }} />

      {/* Description + category */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, color: 'var(--text-primary)' }}>
          {tx.description}
        </div>
        {tx.category_name && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            {tx.category_name}
          </div>
        )}
      </div>

      {/* Amount + date */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 15, fontWeight: 600,
          letterSpacing: '-0.01em', lineHeight: 1.2,
          color: txAmountColor(tx),
        }}>
          {fmtSignedAmount(tx.amount)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
          {fmtTxDate(tx.date)}
        </div>
      </div>
    </div>
  );
}

// ── ExtratoPanel ──────────────────────────────────────────────────────────────

function ExtratoPanel({
  accounts, activeAccountId, setActiveAccountId, transactions, txLoading,
}: {
  accounts: BankAccountConfig[];
  activeAccountId: number | null;
  setActiveAccountId: (id: number) => void;
  transactions: Transaction[];
  txLoading: boolean;
}) {
  const activeAccount = accounts.find(a => a.id === activeAccountId);
  const listRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const listH = list.clientHeight;
      if (listH <= 0) return;
      const firstRow = list.querySelector<HTMLElement>('[data-txrow]');
      if (!firstRow) return;
      const rowH = firstRow.getBoundingClientRect().height;
      if (rowH <= 0) return;
      setVisibleCount(Math.max(1, Math.floor(listH / rowH)));
    };

    const frame = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); };
  }, [activeAccountId, transactions.length]);

  const visibleTxs = transactions.slice(0, visibleCount);

  if (accounts.length === 0) {
    return (
      <div style={{
        background: 'var(--surface-card)', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Nenhuma conta bancária nesta instituição.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--surface-card)', borderRadius: 20,
      border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Extrato</div>
          {activeAccount && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
              {activeAccount.name}
            </div>
          )}
        </div>

        {/* Account switcher — only when multiple */}
        {accounts.length > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {accounts.map(acc => (
              <Button
                key={acc.id}
                type="button"
                variant={activeAccountId === acc.id ? 'secondary' : 'outline'}
                size="sm"
                className={`max-w-[148px] shrink truncate px-3 py-[5px] text-xs font-semibold tracking-wide ${activeAccountId === acc.id ? '' : 'font-normal opacity-95'}`}
                onClick={() => setActiveAccountId(acc.id)}
              >
                {acc.name.length > 12 ? acc.name.slice(0, 10) + '…' : acc.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Transactions — flex: 1 fills remaining height, overflow hidden clips excess */}
      <div ref={listRef} style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {txLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <LoadingSpinner />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyExtrato accountId={activeAccountId} />
        ) : (
          visibleTxs.map((tx, i) => (
            <TxRow key={tx.id} tx={tx} last={i === visibleTxs.length - 1} />
          ))
        )}
      </div>

      {/* Footer */}
      {transactions.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '12px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {visibleTxs.length} de {transactions.length} lançamentos
          </span>
        </div>
      )}
    </div>
  );
}

// ── CardVisual ────────────────────────────────────────────────────────────────

function CardVisual({ card, dashboard, color }: {
  card: CreditCardConfig;
  dashboard: CardDashboard | undefined;
  color: string;
}) {
  const invoice = dashboard?.latest_invoice?.computed_total ?? 0;
  return (
    <div style={{
      borderRadius: 16, padding: '22px 24px 20px',
      background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
      position: 'relative', overflow: 'hidden', margin: '0 0 12px',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, right: 60, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

      {/* Type label */}
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.70)', marginBottom: 14 }}>
        Cartão de Crédito
      </div>

      {/* Card name + institution */}
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
        {card.name}
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>
        {card.institution ?? ''}
      </div>

      {/* Invoice + limit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 5 }}>
            Fatura atual
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1 }}>
            {formatCurrency(invoice)}
          </div>
        </div>
        {card.credit_limit != null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 5 }}>
              Limite
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {formatCurrency(card.credit_limit)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── InfoTiles ─────────────────────────────────────────────────────────────────

function InfoTiles({ card, dashboard }: { card: CreditCardConfig; dashboard: CardDashboard | undefined }) {
  const invoice    = dashboard?.latest_invoice?.computed_total ?? 0;
  const disponivel = (card.credit_limit ?? 0) - invoice;
  const hasLimit   = card.credit_limit != null;

  const tiles = [
    { label: 'Fecha dia',  value: String(card.closing_day), color: 'var(--text-primary)', mono: false },
    { label: 'Vence dia',  value: String(card.due_day),     color: 'var(--text-primary)', mono: false },
    hasLimit
      ? { label: 'Disponível', value: formatCurrency(disponivel), color: disponivel > 0 ? 'var(--green-400)' : 'var(--red-400)', mono: true }
      : { label: 'Fatura',     value: formatCurrency(invoice),    color: 'var(--red-400)', mono: true },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
      {tiles.map((tile, i) => (
        <div key={i} style={{
          background: 'var(--surface-2)', borderRadius: 14,
          padding: '14px 16px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '-0.005em' }}>
            {tile.label}
          </div>
          <div style={{
            fontFamily: tile.mono ? 'var(--font-mono)' : 'inherit',
            fontSize: tile.mono ? 15 : 22,
            fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1,
            color: tile.color,
          }}>
            {tile.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── RecentInvoiceRows ─────────────────────────────────────────────────────────

function RecentInvoiceRows({ card, invoices }: { card: CreditCardConfig; invoices: CardInvoice[] }) {
  if (!invoices.length) return null;
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 0 }}>
      <div style={{ padding: '10px 20px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Faturas recentes
      </div>
      {invoices.slice(0, 5).map((inv, i) => (
        <Link
          key={inv.id}
          href={`/home/cartao/${card.id}/fatura/${inv.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px',
              borderBottom: i < Math.min(invoices.length - 1, 4) ? '1px solid rgba(255,255,255,0.07)' : 'none',
              cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{inv.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--red-400)', fontWeight: 600 }}>
                {formatCurrency(inv.computed_total)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {inv.transactions_count} itens
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── CardActionButtons ─────────────────────────────────────────────────────────

function CardActionButtons({ cardId }: { cardId: number }) {
  const [hov1, setHov1] = useState(false);
  const [hov2, setHov2] = useState(false);
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px', display: 'flex', gap: 10 }}>
      <Link
        href={`/home/cartao/${cardId}`}
        onMouseEnter={() => setHov1(true)}
        onMouseLeave={() => setHov1(false)}
        style={{
          flex: 1, padding: '13px', borderRadius: 12, border: 'none',
          background: 'var(--blue-400)', color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          textDecoration: 'none', textAlign: 'center', display: 'block',
          letterSpacing: '-0.01em',
          opacity: hov1 ? 0.88 : 1, transition: 'opacity 0.12s',
        }}
      >
        Ver todas as faturas
      </Link>
      <Link
        href={`/home/upload?type=credit_card&cardId=${cardId}`}
        onMouseEnter={() => setHov2(true)}
        onMouseLeave={() => setHov2(false)}
        style={{
          flex: 1, padding: '13px', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          background: hov2 ? '#3A3A3C' : 'var(--surface-2)',
          color: hov2 ? '#fff' : 'var(--text-secondary)',
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
          textDecoration: 'none', textAlign: 'center', display: 'block',
          letterSpacing: '-0.01em', transition: 'all 0.12s',
        }}
      >
        Importar fatura PDF
      </Link>
    </div>
  );
}

// ── CardPanel ─────────────────────────────────────────────────────────────────

function CardPanel({ card, dashboard, invoices, color }: {
  card: CreditCardConfig;
  dashboard: CardDashboard | undefined;
  invoices: CardInvoice[];
  color: string;
}) {
  return (
    <div style={{
      background: 'var(--surface-card)', borderRadius: 20,
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 16px 0' }}>
        <CardVisual card={card} dashboard={dashboard} color={color} />
        <InfoTiles card={card} dashboard={dashboard} />
      </div>
      <RecentInvoiceRows card={card} invoices={invoices} />
      <CardActionButtons cardId={card.id} />
    </div>
  );
}

// ── Resumo sub-components ─────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
    }}>
      {label}
    </div>
  );
}

function ResumoRow({ children, last }: { children: React.ReactNode; last: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '13px 16px',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.07)',
        background: hov ? 'rgba(255,255,255,0.025)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {children}
    </div>
  );
}

function SummaryStrip({ cards, dashboards }: {
  cards: CreditCardConfig[];
  dashboards: Map<number, CardDashboard>;
}) {
  const totalFaturas = cards.reduce(
    (s, c) => s + (dashboards.get(c.id)?.latest_invoice?.computed_total ?? 0), 0,
  );
  const avgMensal = cards.reduce(
    (s, c) => s + (dashboards.get(c.id)?.monthly_average ?? 0), 0,
  );

  const tiles = [
    { label: 'Contas',          value: String(0),                      color: 'var(--text-primary)', mono: false, note: 'saldo indisponível' },
    { label: 'Faturas abertas', value: formatCurrency(totalFaturas),   color: 'var(--red-400)',      mono: true  },
    { label: 'Média mensal',    value: formatCurrency(avgMensal),      color: 'var(--text-primary)', mono: true  },
  ];

  // Se não tem cartões, simplifica para 1 tile
  if (cards.length === 0) {
    return null;
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${tiles.length}, 1fr)`,
      background: 'var(--surface-card)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden', marginBottom: 12,
    }}>
      {tiles.map((s, i) => (
        <div key={i} style={{
          padding: '14px 16px', textAlign: 'center',
          borderRight: i < tiles.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 7 }}>
            {s.label}
          </div>
          <div style={{
            fontFamily: s.mono ? 'var(--font-mono)' : 'inherit',
            fontSize: 14, fontWeight: 700, color: s.color, letterSpacing: '-0.02em',
          }}>
            {s.value}
          </div>
          {s.note && (
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3, letterSpacing: '0.02em' }}>
              {s.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AccountsSection({ accounts }: { accounts: BankAccountConfig[] }) {
  if (accounts.length === 0) return null;
  return (
    <div style={{ background: 'var(--surface-card)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
      <SectionLabel label="Contas bancárias" />
      {accounts.map((acc, i) => (
        <ResumoRow key={acc.id} last={i === accounts.length - 1}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{acc.name}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 4, padding: '2px 6px', color: 'var(--text-secondary)',
              }}>
                {ACCOUNT_TYPE_LABELS[acc.account_type] ?? acc.account_type}
              </span>
              {!acc.is_active && (
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--amber-400)', letterSpacing: '0.05em' }}>
                  INATIVA
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Link href={`/home/upload?type=bank_statement&bankAccountId=${acc.id}`} style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              OFX
            </Link>
          </div>
        </ResumoRow>
      ))}
    </div>
  );
}

function CardsSection({ cards, dashboards }: {
  cards: CreditCardConfig[];
  dashboards: Map<number, CardDashboard>;
}) {
  if (cards.length === 0) return null;
  return (
    <div style={{ background: 'var(--surface-card)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
      <SectionLabel label="Cartões de crédito" />
      {cards.map((card, i) => {
        const invoice = dashboards.get(card.id)?.latest_invoice?.computed_total ?? 0;
        return (
          <ResumoRow key={card.id} last={i === cards.length - 1}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 3 }}>{card.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Fecha {card.closing_day} · Vence {card.due_day}
                {card.credit_limit != null && (
                  <span style={{ marginLeft: 6 }}>· Limite {formatCurrency(card.credit_limit)}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--red-400)', fontWeight: 600 }}>
                  {formatCurrency(invoice)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>fatura</div>
              </div>
              <Link href={`/home/cartao/${card.id}`} style={{ fontSize: 12, color: 'var(--blue-400)', textDecoration: 'none' }}>
                Faturas →
              </Link>
            </div>
          </ResumoRow>
        );
      })}
    </div>
  );
}

function StatsSection({ displayName }: { displayName: string }) {
  return (
    <div style={{ background: 'var(--surface-card)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
      <SectionLabel label="Informações" />
      {[
        { label: 'Instituição', value: displayName },
      ].map((s, i, arr) => (
        <ResumoRow key={i} last={i === arr.length - 1}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{s.value}</span>
        </ResumoRow>
      ))}
    </div>
  );
}

function QuickActions() {
  const [hov1, setHov1] = useState(false);
  const [hov2, setHov2] = useState(false);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Link
        href="/home/lancamentos/novo"
        onMouseEnter={() => setHov1(true)}
        onMouseLeave={() => setHov1(false)}
        style={{
          padding: '13px', borderRadius: 12, border: 'none',
          background: 'var(--blue-400)', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          textDecoration: 'none', textAlign: 'center',
          letterSpacing: '-0.01em',
          opacity: hov1 ? 0.88 : 1, transition: 'opacity 0.12s',
        }}
      >
        + Novo lançamento
      </Link>
      <Link
        href="/home/upload"
        onMouseEnter={() => setHov2(true)}
        onMouseLeave={() => setHov2(false)}
        style={{
          padding: '13px', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          background: hov2 ? '#3A3A3C' : 'var(--surface-2)',
          color: hov2 ? '#fff' : 'var(--text-secondary)',
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
          textDecoration: 'none', textAlign: 'center',
          letterSpacing: '-0.01em', transition: 'all 0.12s',
        }}
      >
        Importar extrato
      </Link>
    </div>
  );
}

function ResumoTab({ accounts, cards, dashboards, displayName }: {
  accounts: BankAccountConfig[];
  cards: CreditCardConfig[];
  dashboards: Map<number, CardDashboard>;
  displayName: string;
}) {
  return (
    <div>
      <SummaryStrip cards={cards} dashboards={dashboards} />
      <AccountsSection accounts={accounts} />
      <CardsSection cards={cards} dashboards={dashboards} />
      <StatsSection displayName={displayName} />
      <QuickActions />
    </div>
  );
}

// ── EmptyExtrato ──────────────────────────────────────────────────────────────

function EmptyExtrato({ accountId }: { accountId: number | null }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <Landmark size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
        Nenhum lançamento nesta conta ainda.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {accountId && (
          <Link href={`/home/upload?type=bank_statement&bankAccountId=${accountId}`} style={primaryLinkStyle}>
            Importar extrato OFX
          </Link>
        )}
        <Link href="/home/lancamentos/novo" style={ghostLinkStyle}>
          Lançamento manual
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InstitutionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const institutionName = decodeSlug(slug ?? '');
  const isMobile = useIsMobile();

  const [accounts, setAccounts]             = useState<BankAccountConfig[]>([]);
  const [cards, setCards]                   = useState<CreditCardConfig[]>([]);
  const [cardDashboards, setCardDashboards] = useState<Map<number, CardDashboard>>(new Map());
  const [cardInvoices, setCardInvoices]     = useState<Map<number, CardInvoice[]>>(new Map());

  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [transactions, setTransactions]       = useState<Transaction[]>([]);
  const [txLoading, setTxLoading]             = useState(false);

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [tab, setTab]                 = useState<Tab>('extrato');
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    if (!institutionName) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [allAccounts, allCards] = await Promise.all([
          api.listBankAccounts(false),
          api.listCards(),
        ]);

        const filteredAccounts = allAccounts.filter(a =>
          matchesInstitution(a.institution, institutionName),
        );
        const filteredCards = allCards.filter(c =>
          matchesInstitution(c.institution, institutionName),
        );

        setAccounts(filteredAccounts);
        setCards(filteredCards);

        // Recupera capitalização original dos dados reais
        setDisplayName(
          filteredAccounts[0]?.institution?.trim() ||
          filteredCards[0]?.institution?.trim()    ||
          institutionName,
        );

        if (filteredAccounts.length > 0) setActiveAccountId(filteredAccounts[0].id);
        else if (filteredCards.length > 0) setTab('cartao');

        const dashMap = new Map<number, CardDashboard>();
        const invMap  = new Map<number, CardInvoice[]>();
        await Promise.allSettled([
          ...filteredCards.map(async c => {
            try { dashMap.set(c.id, await api.getCardDashboard(c.id)); } catch { /* skip */ }
          }),
          ...filteredCards.map(async c => {
            try { invMap.set(c.id, await api.getCardInvoices(c.id)); } catch { /* skip */ }
          }),
        ]);
        setCardDashboards(dashMap);
        setCardInvoices(invMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar instituição.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [institutionName]);

  const loadTransactions = useCallback(async (accountId: number) => {
    setTxLoading(true);
    try {
      const txs = await api.getTransactions({ bank_account_id: accountId, limit: 20 }) as Transaction[];
      setTransactions(txs.sort((a, b) => b.date.localeCompare(a.date)));
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeAccountId != null) void loadTransactions(activeAccountId);
  }, [activeAccountId, loadTransactions]);

  const tabs = useMemo<{ id: Tab; label: string }[]>(() => [
    { id: 'extrato', label: 'Extrato' },
    ...(cards.length > 0 ? [{ id: 'cartao' as Tab, label: cards.length === 1 ? 'Cartão' : 'Cartões' }] : []),
    { id: 'resumo', label: 'Resumo' },
  ], [cards]);

  const subtitle = useMemo(() => [
    accounts.length > 0 && `${accounts.length} conta${accounts.length > 1 ? 's' : ''}`,
    cards.length > 0    && `${cards.length} cartão`,
  ].filter(Boolean).join(' · '), [accounts, cards]);

  const currentInvoiceTotal = useMemo(
    () => cards.reduce((sum, c) => sum + (cardDashboards.get(c.id)?.latest_invoice?.computed_total ?? 0), 0),
    [cards, cardDashboards],
  );

  const institutionColor = getInstitutionColor(displayName || institutionName);
  const padding = isMobile ? '0 14px 32px' : '0 32px 40px';

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
          <Button variant="ghost" type="button" size="sm" onClick={() => window.location.reload()} className="inline-flex gap-2">
            <RefreshCw size={14} /> Tentar novamente
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={displayName || institutionName}
        subtitle={subtitle}
        crumbs={[{ href: '/home/carteira', label: 'Carteira' }]}
        right={cards.length > 0 && currentInvoiceTotal > 0 ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
              Fatura atual
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700, color: 'var(--red-400)', letterSpacing: '-0.025em' }}>
              {formatCurrency(currentInvoiceTotal)}
            </div>
          </div>
        ) : undefined}
        px={isMobile ? 14 : 32}
      />
<main style={{ padding, flex: 1, maxWidth: 860, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', borderRadius: 12, padding: 4, marginBottom: 20, width: 'fit-content' }}>
          {tabs.map(t => (
            <Button key={t.id} type="button" variant={tab === t.id ? 'secondary' : 'ghost'} className={`rounded-[9px] px-[18px] py-[7px] text-sm shadow-none transition-colors ${tab === t.id ? 'shadow-[0_1px_4px_rgba(0,0,0,0.4)]' : '!font-normal'}`} onClick={() => setTab(t.id)}>
              {t.label}
            </Button>
          ))}
        </div>

        {/* Tab: Extrato */}
        {tab === 'extrato' && (
          <ExtratoPanel
            accounts={accounts}
            activeAccountId={activeAccountId}
            setActiveAccountId={setActiveAccountId}
            transactions={transactions}
            txLoading={txLoading}
          />
        )}

        {/* Tab: Cartão */}
        {tab === 'cartao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cards.map(card => (
              <CardPanel
                key={card.id}
                card={card}
                dashboard={cardDashboards.get(card.id)}
                invoices={cardInvoices.get(card.id) ?? []}
                color={institutionColor}
              />
            ))}
          </div>
        )}

        {/* Tab: Resumo */}
        {tab === 'resumo' && (
          <ResumoTab
            accounts={accounts}
            cards={cards}
            dashboards={cardDashboards}
            displayName={displayName || institutionName}
          />
        )}
      </main>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const primaryLinkStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 8,
  background: 'var(--primary-gradient)',
  color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

const ghostLinkStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 8,
  border: '1px solid var(--border-default)',
  color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};
