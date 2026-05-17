/**
 * src/app/(app)/carteira/[slug]/page.tsx
 *
 * Detalhe de Instituição — tabs Extrato / Cartão / Resumo.
 * Rota: /carteira/[slug]
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Landmark, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/Layout/PageHeader';
import AccountCard from '@/components/Cards/AccountCard';
import KPIStrip from '@/components/KPIStrip';
import { TransactionList } from '@/components/TransactionList';
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
import ContaEmptyState from '@/components/ContaEmptyState';
import { useLancamentoModal } from '@/components/LancamentoModal';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'conta' | 'cartao' | 'resumo';

/** Entradas / saídas do mês para o KPIStrip */
interface MonthStats {
  entradas: number;
  saidas: number;
}

/** Sigla da instituição para o avatar do AccountCard */
function institutionAbbr(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/** Mês atual no formato "YYYY-MM" */
function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Label legível do mês atual: "Maio 2026" */
function currentMonthLabel(): string {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

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


// ── ContaTab ──────────────────────────────────────────────────────────────────

function ContaTab({
  accounts,
  cards,
  activeAccountId,
  setActiveAccountId,
  transactions,
  txLoading,
  monthStats,
  displayName,
  institutionColor,
  onVerTodas,
  onAccountCreated,
  onImportOFX,
}: {
  accounts: BankAccountConfig[];
  cards: CreditCardConfig[];
  activeAccountId: number | null;
  setActiveAccountId: (id: number) => void;
  transactions: Transaction[];
  txLoading: boolean;
  monthStats: MonthStats;
  displayName: string;
  institutionColor: string;
  onVerTodas: () => void;
  onAccountCreated: (account: BankAccountConfig) => void;
  onImportOFX: () => void;
}) {
  const activeAccount = accounts.find(a => a.id === activeAccountId);

  // Saldo = soma de todas as transações carregadas
  const balance = transactions.reduce((s, tx) => s + tx.amount, 0);

  const inst = {
    name:  displayName,
    abbr:  institutionAbbr(displayName),
    color: institutionColor,
  };

  const conta = {
    label:   activeAccount?.name ?? 'Conta',
    number:  null,
    balance,
    type:    ACCOUNT_TYPE_LABELS[activeAccount?.account_type ?? ''] ?? 'Conta pagamento',
  };

  const saldo = monthStats.entradas - monthStats.saidas;
  const monthLabel = currentMonthLabel();

  // capitalize first letter
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  if (accounts.length === 0) {
    const reason = cards.length > 0 ? 'card_only' : 'new';
    return (
      <ContaEmptyState
        inst={inst}
        reason={reason}
        onSave={onAccountCreated}
        onImportOFX={onImportOFX}
      />
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      {/* Account switcher — só quando há múltiplas contas */}
      {accounts.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setActiveAccountId(acc.id)}
              style={{
                padding: '5px 13px', borderRadius: 9, border: '1px solid',
                borderColor: activeAccountId === acc.id ? 'var(--blue)' : 'rgba(255,255,255,0.1)',
                background: activeAccountId === acc.id ? 'rgba(10,132,255,0.15)' : 'transparent',
                color: activeAccountId === acc.id ? 'var(--blue)' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: activeAccountId === acc.id ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.12s',
              }}
            >
              {acc.name.length > 14 ? acc.name.slice(0, 12) + '…' : acc.name}
            </button>
          ))}
        </div>
      )}

      {/* ② AccountCard */}
      <div style={{ marginBottom: 14 }}>
        <AccountCard inst={inst} conta={conta} />
      </div>

      {/* ③ KPIStrip */}
      {txLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <LoadingSpinner />
        </div>
      ) : (
        <KPIStrip
          mb={14}
          items={[
            { label: 'Entradas', value: formatCurrency(monthStats.entradas), color: 'var(--green)' },
            { label: 'Saídas',   value: formatCurrency(monthStats.saidas),   color: 'var(--red)'   },
            { label: 'Saldo',    value: formatCurrency(saldo),               color: saldo < 0 ? 'var(--red)' : undefined },
          ]}
        />
      )}

      {/* ④ TransactionList */}
      {!txLoading && (
        transactions.length === 0 ? (
          <EmptyExtrato accountId={activeAccountId} />
        ) : (
          <TransactionList
            title="Lançamentos recentes"
            subtitle={monthLabelCap}
            transactions={transactions}
            limit={5}
            headerRight={
              <button
                onClick={onVerTodas}
                style={{
                  background: 'none', border: 'none', color: 'var(--blue)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                Ver todas as movimentações →
              </button>
            }
          />
        )
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
          href={`/cartao/${card.id}/fatura/${inv.id}`}
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
        href={`/cartao/${cardId}`}
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
        href={`/upload?type=credit_card&cardId=${cardId}`}
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
            <Link href={`/upload?type=bank_statement&bankAccountId=${acc.id}`} style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              OFX
            </Link>
            <Link href={`/contas/${acc.id}`} style={{ fontSize: 12, color: 'var(--blue-400)', textDecoration: 'none' }}>
              Extrato →
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
              <Link href={`/cartao/${card.id}`} style={{ fontSize: 12, color: 'var(--blue-400)', textDecoration: 'none' }}>
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
  const { openModal } = useLancamentoModal();
  const [hov2, setHov2] = useState(false);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <button
        onClick={() => openModal()}
        style={{
          padding: '13px', borderRadius: 12, border: 'none',
          background: 'var(--blue, #0A84FF)', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          letterSpacing: '-0.01em', fontFamily: 'inherit',
          transition: 'opacity 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        + Novo lançamento
      </button>
      <Link
        href="/upload"
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
  const { openModal } = useLancamentoModal();
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <Landmark size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
        Nenhum lançamento nesta conta ainda.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => openModal({ bankAccountId: accountId ?? undefined })}
          style={{ ...primaryLinkStyle, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Adicionar lançamento
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InstitutionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const institutionName = decodeSlug(slug ?? '');
  const isMobile = useIsMobile();

  const [accounts, setAccounts]             = useState<BankAccountConfig[]>([]);
  const [cards, setCards]                   = useState<CreditCardConfig[]>([]);
  const [cardDashboards, setCardDashboards] = useState<Map<number, CardDashboard>>(new Map());
  const [cardInvoices, setCardInvoices]     = useState<Map<number, CardInvoice[]>>(new Map());

  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [transactions, setTransactions]       = useState<Transaction[]>([]);
  const [monthStats, setMonthStats]           = useState<MonthStats>({ entradas: 0, saidas: 0 });
  const [txLoading, setTxLoading]             = useState(false);

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [tab, setTab]                 = useState<Tab>('conta');
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
        else if (filteredCards.length > 0) { setTab('cartao'); }

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
      // Busca todas as transações disponíveis (sem limit) para calcular saldo e KPIs
      const txs = await api.getTransactions({ bank_account_id: accountId }) as Transaction[];
      const sorted = txs.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(sorted);

      // Calcula entradas/saídas do mês atual
      const ym = currentYearMonth(); // "YYYY-MM"
      const monthTxs = sorted.filter(tx => tx.date.startsWith(ym));
      const entradas = monthTxs
        .filter(tx => tx.amount > 0 && tx.transaction_type !== 'transfer')
        .reduce((s, tx) => s + tx.amount, 0);
      const saidas = monthTxs
        .filter(tx => tx.amount < 0 && tx.transaction_type !== 'transfer')
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
      setMonthStats({ entradas, saidas });
    } catch {
      setTransactions([]);
      setMonthStats({ entradas: 0, saidas: 0 });
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeAccountId != null) void loadTransactions(activeAccountId);
  }, [activeAccountId, loadTransactions]);

  const tabs = useMemo<{ id: Tab; label: string }[]>(() => [
    { id: 'conta', label: 'Conta' },
    ...(cards.length > 0 ? [{ id: 'cartao' as Tab, label: cards.length === 1 ? 'Cartão' : 'Cartões' }] : []),
    { id: 'resumo', label: 'Resumo' },
  ], [cards]);

  const subtitle = useMemo(() => [
    accounts.length > 0 && `${accounts.length} conta${accounts.length > 1 ? 's' : ''}`,
    cards.length > 0    && `${cards.length} cartão`,
  ].filter(Boolean).join(' · '), [accounts, cards]);

  const institutionColor = getInstitutionColor(displayName || institutionName);
  const padding = isMobile ? '24px 14px 32px' : '24px 32px 40px';

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
          <button onClick={() => window.location.reload()} style={ghostButtonStyle}>
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={displayName || institutionName}
        subtitle={subtitle}
        crumbs={[{ href: '/carteira', label: 'Carteira' }]}
        right={
          <div style={{
            display: 'flex', gap: 2,
            background: 'var(--surface-2)',
            borderRadius: 12,
            padding: 4,
          }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '7px 18px', borderRadius: 9, border: 'none',
                  background: tab === t.id ? '#000' : 'transparent',
                  color:      tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.1s',
                  fontFamily: 'inherit',
                  boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
        px={isMobile ? 14 : 32}
      />
<main style={{ padding, flex: 1, maxWidth: 860, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        {/* Tab: Conta */}
        {tab === 'conta' && (
          <ContaTab
            accounts={accounts}
            cards={cards}
            activeAccountId={activeAccountId}
            setActiveAccountId={setActiveAccountId}
            transactions={transactions}
            txLoading={txLoading}
            monthStats={monthStats}
            displayName={displayName || institutionName}
            institutionColor={institutionColor}
            onVerTodas={() => {
              if (activeAccountId) router.push(`/contas/${activeAccountId}`);
            }}
            onAccountCreated={account => {
              setAccounts(prev => [...prev, account]);
              setActiveAccountId(account.id);
            }}
            onImportOFX={() => router.push('/upload?type=bank_statement')}
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
  background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
  color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

const ghostLinkStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 8,
  border: '1px solid var(--border-default)',
  color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

const ghostButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '8px 14px', borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'var(--surface-card)', color: 'var(--text-primary)',
  fontSize: 13, cursor: 'pointer',
};
