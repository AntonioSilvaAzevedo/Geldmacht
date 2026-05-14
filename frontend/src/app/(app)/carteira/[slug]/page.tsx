/**
 * src/app/(app)/carteira/[slug]/page.tsx
 *
 * Detalhe de Instituição — tabs contextuais por produto.
 * Rota: /carteira/[slug]  (ex: /carteira/nubank)
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Landmark,
  CreditCard as CreditCardIcon,
  Upload,
  RefreshCw,
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
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
import { getOpeningDay } from '@/lib/cardDates';
import { useIsMobile } from '@/hooks/useIsMobile';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'extrato' | 'cartao' | 'resumo';

// ── Helpers ───────────────────────────────────────────────────────────────────

function decodeSlug(slug: string): string {
  try { return decodeURIComponent(slug); }
  catch { return slug; }
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

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<Tab>('extrato');

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

        if (filteredAccounts.length > 0) setActiveAccountId(filteredAccounts[0].id);

        const dashMap = new Map<number, CardDashboard>();
        const invMap  = new Map<number, CardInvoice[]>();
        await Promise.allSettled([
          ...filteredCards.map(async c => {
            try { dashMap.set(c.id, await api.getCardDashboard(c.id)); } catch {}
          }),
          ...filteredCards.map(async c => {
            try { invMap.set(c.id, await api.getCardInvoices(c.id)); } catch {}
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

  const padding = isMobile ? '0 14px 32px' : '0 32px 40px';

  if (loading) {
    return (
      <>
        <Header title={institutionName} subtitle="Carregando..." />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title={institutionName} />
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
      <Header title={institutionName} subtitle={subtitle} />

      <main style={{ padding, flex: 1, maxWidth: 860, margin: '0 auto', width: '100%' }}>

        {/* Back + quick stats */}
        <div style={{ padding: '16px 0 0', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 18 }}>
          <Link href="/carteira" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            color: 'var(--blue-400)', fontSize: 13, textDecoration: 'none', marginBottom: 14,
          }}>
            <ChevronLeft size={15} /> Carteira
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 3 }}>
                {institutionName}
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{subtitle}</p>
            </div>

            {cards.length > 0 && currentInvoiceTotal > 0 && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
                  Fatura atual
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--red-400)', letterSpacing: '-0.025em' }}>
                  {formatCurrency(currentInvoiceTotal)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', borderRadius: 10, padding: 3, marginBottom: 20, width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '6px 16px', borderRadius: 8, border: 'none',
              background: tab === t.id ? 'var(--surface-0)' : 'transparent',
              color:      tab === t.id ? '#fff' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.1s',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab: Extrato */}
        {tab === 'extrato' && (
          <div>
            {accounts.length > 1 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {accounts.map(acc => (
                  <button key={acc.id} onClick={() => setActiveAccountId(acc.id)} style={{
                    padding: '5px 12px', borderRadius: 20, border: '1px solid', cursor: 'pointer',
                    borderColor: activeAccountId === acc.id ? 'rgba(10,132,255,0.5)' : 'rgba(255,255,255,0.1)',
                    background:  activeAccountId === acc.id ? 'rgba(10,132,255,0.12)' : 'transparent',
                    color:       activeAccountId === acc.id ? 'var(--blue-400)' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: activeAccountId === acc.id ? 600 : 400,
                  }}>
                    {acc.name}
                  </button>
                ))}
              </div>
            )}

            {txLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <LoadingSpinner />
              </div>
            ) : transactions.length > 0 ? (
              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
                <TransactionList transactions={transactions} isMobile={isMobile} />
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Exibindo até 20 lançamentos recentes
                  </span>
                  {activeAccountId && (
                    <Link href={`/contas/${activeAccountId}`} style={{ color: 'var(--blue-400)', fontSize: 12, textDecoration: 'none' }}>
                      Ver extrato completo →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <EmptyExtrato accountId={activeAccountId} />
            )}
          </div>
        )}

        {/* Tab: Cartão */}
        {tab === 'cartao' && (
          <div style={{ display: 'grid', gap: 14 }}>
            {cards.map(card => (
              <CardPanel
                key={card.id}
                card={card}
                dashboard={cardDashboards.get(card.id)}
                invoices={cardInvoices.get(card.id) ?? []}
              />
            ))}
          </div>
        )}

        {/* Tab: Resumo */}
        {tab === 'resumo' && (
          <ResumoTab accounts={accounts} cards={cards} />
        )}
      </main>
    </>
  );
}

// ── CardPanel ─────────────────────────────────────────────────────────────────

function CardPanel({ card, dashboard, invoices }: {
  card: CreditCardConfig;
  dashboard: CardDashboard | undefined;
  invoices: CardInvoice[];
}) {
  const latestInvoice = dashboard?.latest_invoice;

  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>{card.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Fecha dia {card.closing_day} · Vence dia {card.due_day} · Abre dia {getOpeningDay(card.closing_day)}
          </div>
          {card.credit_limit != null && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Limite: <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(card.credit_limit)}</span>
              {latestInvoice != null && (
                <span style={{ color: 'var(--green-400)', marginLeft: 8 }}>
                  · Disponível: {formatCurrency(card.credit_limit - latestInvoice.computed_total)}
                </span>
              )}
            </div>
          )}
        </div>

        {latestInvoice && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
              Fatura atual
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--red-400)', letterSpacing: '-0.02em' }}>
              {formatCurrency(latestInvoice.computed_total)}
            </div>
            {latestInvoice.due_date && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                vence {new Date(latestInvoice.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        )}
      </div>

      {invoices.length > 0 && (
        <div>
          <div style={{ padding: '10px 18px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Faturas recentes
          </div>
          {invoices.slice(0, 5).map((inv, i) => (
            <Link key={inv.id} href={`/cartao/${card.id}/fatura/${inv.id}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 18px',
              borderBottom: i < Math.min(invoices.length - 1, 4) ? '1px solid var(--border-subtle)' : 'none',
              textDecoration: 'none', color: 'inherit', transition: 'background 0.1s',
            }}>
              <span style={{ fontSize: 13 }}>{inv.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--red-400)' }}>
                  {formatCurrency(inv.computed_total)}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {inv.transactions_count} itens
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href={`/cartao/${card.id}`} style={{ ...primaryLinkStyle, flex: 1, textAlign: 'center' }}>
          Ver todas as faturas
        </Link>
        <Link href={`/upload?type=credit_card&cardId=${card.id}`} style={{ ...ghostLinkStyle, flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Upload size={13} /> Importar PDF
        </Link>
      </div>
    </div>
  );
}

// ── ResumoTab ─────────────────────────────────────────────────────────────────

function ResumoTab({ accounts, cards }: { accounts: BankAccountConfig[]; cards: CreditCardConfig[] }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {accounts.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Contas bancárias
            </div>
          </div>
          {accounts.map((acc, i) => (
            <div key={acc.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: i < accounts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {acc.name}
                  {!acc.is_active && <span style={{ fontSize: 9, color: 'var(--amber-400)', fontWeight: 700 }}>INATIVA</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {ACCOUNT_TYPE_LABELS[acc.account_type] ?? acc.account_type}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link href={`/upload?type=bank_statement&bankAccountId=${acc.id}`} style={{ fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  OFX
                </Link>
                <Link href={`/contas/${acc.id}`} style={{ fontSize: 12, color: 'var(--blue-400)', textDecoration: 'none' }}>
                  Extrato →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {cards.length > 0 && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Cartões de crédito
            </div>
          </div>
          {cards.map((card, i) => (
            <div key={card.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: i < cards.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{card.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Fecha {card.closing_day} · Vence {card.due_day}
                  {card.credit_limit != null && ` · Limite ${formatCurrency(card.credit_limit)}`}
                </div>
              </div>
              <Link href={`/cartao/${card.id}`} style={{ fontSize: 12, color: 'var(--blue-400)', textDecoration: 'none' }}>
                Faturas →
              </Link>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Link href="/lancamentos/novo" style={{ ...primaryLinkStyle, textAlign: 'center', padding: '11px' }}>
          + Novo lançamento
        </Link>
        <Link href="/upload" style={{ ...ghostLinkStyle, textAlign: 'center', padding: '11px' }}>
          Importar extrato
        </Link>
      </div>
    </div>
  );
}

// ── EmptyExtrato ──────────────────────────────────────────────────────────────

function EmptyExtrato({ accountId }: { accountId: number | null }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
      <Landmark size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
        Nenhum lançamento nesta conta ainda.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {accountId && (
          <Link href={`/upload?type=bank_statement&bankAccountId=${accountId}`} style={primaryLinkStyle}>
            Importar extrato OFX
          </Link>
        )}
        <Link href="/lancamentos/novo" style={ghostLinkStyle}>
          Lançamento manual
        </Link>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

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
