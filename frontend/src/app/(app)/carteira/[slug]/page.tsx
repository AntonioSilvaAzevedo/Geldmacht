'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Landmark, Upload, RefreshCw } from 'lucide-react';
import Header from '@/components/Layout/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
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

const INSTITUTION_COLORS: Record<string, string> = {
  nubank:        '#820AD1',
  itaú:          '#FF6B00',
  itau:          '#FF6B00',
  bradesco:      '#CC0000',
  santander:     '#EC0000',
  inter:         '#FF6B2B',
  'mercado pago':'#009EE3',
  c6:            '#1A1A2E',
  'banco do brasil': '#FFDD00',
  caixa:         '#006B3F',
  xp:            '#000',
};
const CARD_PALETTE = ['#0A84FF', '#5E5CE6', '#30D158', '#FF9F0A', '#FF453A', '#5AC8FA'];

function cardAccent(card: CreditCardConfig, idx: number): string {
  const key = (card.institution ?? '').toLowerCase().trim();
  return INSTITUTION_COLORS[key] ?? CARD_PALETTE[idx % CARD_PALETTE.length];
}

function txDotColor(type: string | null): string {
  if (type === 'income')   return 'var(--green-400, #30D158)';
  if (type === 'expense')  return 'var(--red-400, #FF453A)';
  return 'rgba(255,255,255,0.25)';
}
function txAmountColor(type: string | null): string {
  if (type === 'income')   return 'var(--green-400, #30D158)';
  if (type === 'expense')  return 'var(--red-400, #FF453A)';
  return 'var(--text-muted, rgba(255,255,255,0.35))';
}
function txPrefix(amount: number): string {
  return amount >= 0 ? '+' : '−';
}
function fmtTxAmount(amount: number): string {
  return formatCurrency(Math.abs(amount));
}
function fmtDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch { return dateStr; }
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

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<Tab>('extrato');

  // ── Load institution data ──
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
        const filteredAccounts = allAccounts.filter(a => matchesInstitution(a.institution, institutionName));
        const filteredCards    = allCards.filter(c => matchesInstitution(c.institution, institutionName));
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

  // ── Load transactions ──
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
    () => cards.reduce((s, c) => s + (cardDashboards.get(c.id)?.latest_invoice?.computed_total ?? 0), 0),
    [cards, cardDashboards],
  );

  const pad = isMobile ? '0 14px 32px' : '0 28px 40px';

  // ── Loading / Error ──
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
          <p style={{ color: 'var(--red-400, #FF453A)', fontSize: 14, marginBottom: 12 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={ghostBtnStyle}>
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title={institutionName} subtitle={subtitle} />

      <main style={{ padding: pad, flex: 1, maxWidth: 700, margin: '0 auto', width: '100%' }}>

        {/* Back + title row */}
        <div style={{ padding: '16px 0 18px', marginBottom: 20, borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.07))' }}>
          <Link href="/carteira" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--blue-400, #0A84FF)', fontSize: 13, textDecoration: 'none', marginBottom: 14 }}>
            <ChevronLeft size={15} /> Carteira
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 3 }}>{institutionName}</h1>
              <p style={{ fontSize: 12, color: 'var(--text-secondary, rgba(255,255,255,0.6))', margin: 0 }}>{subtitle}</p>
            </div>
            {cards.length > 0 && currentInvoiceTotal > 0 && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted, rgba(255,255,255,0.35))', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Fatura atual</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--red-400, #FF453A)', letterSpacing: '-0.025em' }}>
                  {formatCurrency(currentInvoiceTotal)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--s2, #2C2C2E)', borderRadius: 12, padding: 4, marginBottom: 20, width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '7px 18px', borderRadius: 9, border: 'none',
              background: tab === t.id ? 'var(--s0, #000)' : 'transparent',
              color:      tab === t.id ? '#fff' : 'var(--text-secondary, rgba(255,255,255,0.6))',
              fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.1s',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab: Extrato ── */}
        {tab === 'extrato' && (
          <ExtratoTab
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSelectAccount={setActiveAccountId}
            transactions={transactions}
            txLoading={txLoading}
          />
        )}

        {/* ── Tab: Cartão ── */}
        {tab === 'cartao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cards.map((card, idx) => (
              <CardPanel
                key={card.id}
                card={card}
                accent={cardAccent(card, idx)}
                dashboard={cardDashboards.get(card.id)}
                invoices={cardInvoices.get(card.id) ?? []}
              />
            ))}
          </div>
        )}

        {/* ── Tab: Resumo ── */}
        {tab === 'resumo' && (
          <ResumoTab
            accounts={accounts}
            cards={cards}
            cardDashboards={cardDashboards}
            institutionName={institutionName}
          />
        )}
      </main>
    </>
  );
}

// ── ExtratoTab ────────────────────────────────────────────────────────────────

function ExtratoTab({
  accounts, activeAccountId, onSelectAccount, transactions, txLoading,
}: {
  accounts: BankAccountConfig[];
  activeAccountId: number | null;
  onSelectAccount: (id: number) => void;
  transactions: Transaction[];
  txLoading: boolean;
}) {
  const activeAccount = accounts.find(a => a.id === activeAccountId);

  if (txLoading) {
    return (
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div style={{ ...panelStyle, textAlign: 'center', padding: '40px 24px' }}>
        <Landmark size={32} color="var(--text-muted, rgba(255,255,255,0.35))" style={{ margin: '0 auto 12px', display: 'block' }} />
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Nenhuma conta bancária nesta instituição.
        </p>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--sep, rgba(255,255,255,0.07))' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Extrato</div>
          {activeAccount && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
              {activeAccount.name}
            </div>
          )}
        </div>
        {/* Account switcher — só com mais de uma conta */}
        {accounts.length > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {accounts.map(acc => (
              <button key={acc.id} onClick={() => onSelectAccount(acc.id)} style={{
                padding: '5px 13px', borderRadius: 9, border: '1px solid',
                borderColor: activeAccountId === acc.id ? 'var(--blue-400, #0A84FF)' : 'rgba(255,255,255,0.1)',
                background:  activeAccountId === acc.id ? 'rgba(10,132,255,0.15)' : 'transparent',
                color:       activeAccountId === acc.id ? 'var(--blue-400, #0A84FF)' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: activeAccountId === acc.id ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.12s',
              }}>{acc.name}</button>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      {transactions.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Nenhum lançamento nesta conta ainda.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {activeAccountId && (
              <Link href={`/upload?type=bank_statement&bankAccountId=${activeAccountId}`} style={primaryLinkStyle}>
                Importar extrato OFX
              </Link>
            )}
            <Link href="/lancamentos/novo" style={ghostLinkStyle}>Lançamento manual</Link>
          </div>
        </div>
      ) : (
        <>
          {transactions.map((tx, i) => (
            <TxRow key={tx.id} tx={tx} last={i === transactions.length - 1} />
          ))}
          <div style={{ borderTop: '1px solid var(--sep, rgba(255,255,255,0.07))', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>
              {transactions.length} lançamentos recentes
            </span>
            {activeAccountId && (
              <Link href={`/contas/${activeAccountId}`} style={{ background: 'none', border: 'none', color: 'var(--blue-400, #0A84FF)', fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>
                Ver extrato completo →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── TxRow ─────────────────────────────────────────────────────────────────────

function TxRow({ tx, last }: { tx: Transaction; last: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 20px',
      borderBottom: last ? 'none' : '1px solid var(--sep, rgba(255,255,255,0.07))',
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: txDotColor(tx.transaction_type), flexShrink: 0, marginTop: 6 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, color: 'var(--text-primary, #fff)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.description}
        </div>
        {tx.category_name && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary, rgba(255,255,255,0.6))', marginTop: 3 }}>
            {tx.category_name}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: txAmountColor(tx.transaction_type) }}>
          {txPrefix(tx.amount)}{fmtTxAmount(tx.amount)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted, rgba(255,255,255,0.35))', marginTop: 3 }}>
          {fmtDate(tx.date)}
        </div>
      </div>
    </div>
  );
}

// ── CardPanel ─────────────────────────────────────────────────────────────────

function CardPanel({
  card, accent, dashboard, invoices,
}: {
  card: CreditCardConfig;
  accent: string;
  dashboard: CardDashboard | undefined;
  invoices: CardInvoice[];
}) {
  const latestInvoice = dashboard?.latest_invoice;
  const invoiceTotal  = latestInvoice?.computed_total ?? 0;
  const disponivel    = card.credit_limit != null ? card.credit_limit - invoiceTotal : null;

  return (
    <div style={{ background: 'var(--s1, #1C1C1E)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>

      {/* Card visual */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ borderRadius: 16, padding: '22px 24px 20px', background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`, position: 'relative', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 60, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.70)', marginBottom: 14 }}>
            Cartão de Crédito
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>{card.name}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>{card.institution}</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 5 }}>Fatura atual</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1 }}>
                {formatCurrency(invoiceTotal)}
              </div>
            </div>
            {card.credit_limit != null && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 5 }}>Limite</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {formatCurrency(card.credit_limit)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: disponivel != null ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Fecha dia', value: String(card.closing_day), mono: false, color: 'var(--text-primary, #fff)' },
            { label: 'Vence dia', value: String(card.due_day),     mono: false, color: 'var(--text-primary, #fff)' },
            ...(disponivel != null ? [{ label: 'Disponível', value: formatCurrency(disponivel), mono: true, color: 'var(--green-400, #30D158)' }] : []),
          ].map((tile, i) => (
            <div key={i} style={{ background: 'var(--s2, #2C2C2E)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{tile.label}</div>
              <div style={{ fontFamily: tile.mono ? 'var(--font-mono)' : 'inherit', fontSize: tile.mono ? 16 : 22, fontWeight: 700, letterSpacing: '-0.02em', color: tile.color }}>
                {tile.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Closing/opening days (se não tiver limite) */}
      {card.credit_limit == null && (
        <div style={{ padding: '0 16px 12px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Abre dia {getOpeningDay(card.closing_day)}
        </div>
      )}

      {/* Recent invoices */}
      {invoices.length > 0 && (
        <div style={{ borderTop: '1px solid var(--sep, rgba(255,255,255,0.07))' }}>
          <div style={{ padding: '10px 20px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>
            Faturas recentes
          </div>
          {invoices.slice(0, 5).map((inv, i) => (
            <Link key={inv.id} href={`/cartao/${card.id}/fatura/${inv.id}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px',
              borderBottom: i < Math.min(invoices.length - 1, 4) ? '1px solid var(--sep, rgba(255,255,255,0.07))' : 'none',
              textDecoration: 'none', color: 'inherit',
            }}>
              <span style={{ fontSize: 13 }}>{inv.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--red-400, #FF453A)', fontWeight: 600 }}>
                  {formatCurrency(inv.computed_total)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>{inv.transactions_count} itens</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ borderTop: '1px solid var(--sep, rgba(255,255,255,0.07))', padding: '14px 16px', display: 'flex', gap: 10 }}>
        <Link href={`/cartao/${card.id}`} style={{
          flex: 1, padding: '13px', borderRadius: 12, border: 'none',
          background: 'var(--blue-400, #0A84FF)', color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          textDecoration: 'none', textAlign: 'center', display: 'block',
        }}>
          Ver todas as faturas
        </Link>
        <Link href={`/upload?type=credit_card&cardId=${card.id}`} style={{
          flex: 1, padding: '13px', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'var(--s2, #2C2C2E)', color: 'var(--text-secondary)',
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
          textDecoration: 'none', textAlign: 'center', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Upload size={13} /> Importar fatura PDF
        </Link>
      </div>
    </div>
  );
}

// ── ResumoTab ─────────────────────────────────────────────────────────────────

function ResumoTab({
  accounts, cards, cardDashboards, institutionName,
}: {
  accounts: BankAccountConfig[];
  cards: CreditCardConfig[];
  cardDashboards: Map<number, CardDashboard>;
  institutionName: string;
}) {
  const totalFaturas = cards.reduce((s, c) => s + (cardDashboards.get(c.id)?.latest_invoice?.computed_total ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: 'var(--s1, #1C1C1E)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {[
          { label: 'Contas',         value: accounts.length > 0 ? `${accounts.length}` : '—',           color: 'var(--text-primary, #fff)', mono: false },
          { label: 'Faturas abertas', value: totalFaturas > 0 ? formatCurrency(totalFaturas) : '—',      color: 'var(--red-400, #FF453A)',   mono: true  },
          { label: 'Cartões',        value: cards.length > 0 ? `${cards.length}` : '—',                 color: 'var(--text-primary, #fff)', mono: false },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted, rgba(255,255,255,0.35))', marginBottom: 7 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: s.mono ? 'var(--font-mono)' : 'inherit', fontSize: s.mono ? 14 : 22, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Contas */}
      {accounts.length > 0 && (
        <div style={{ background: 'var(--s1, #1C1C1E)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <SectionLabel label="Contas bancárias" />
          {accounts.map((acc, i) => (
            <ResumoRow key={acc.id} last={i === accounts.length - 1}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{acc.name}</span>
                  {!acc.is_active && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--amber-400, #FF9F0A)', letterSpacing: '0.05em' }}>INATIVA</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>
                  {ACCOUNT_TYPE_LABELS[acc.account_type] ?? acc.account_type}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <Link href={`/upload?type=bank_statement&bankAccountId=${acc.id}`} style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}>OFX</Link>
                <Link href={`/contas/${acc.id}`} style={{ fontSize: 12, color: 'var(--blue-400, #0A84FF)', textDecoration: 'none' }}>Extrato →</Link>
              </div>
            </ResumoRow>
          ))}
        </div>
      )}

      {/* Cartões */}
      {cards.length > 0 && (
        <div style={{ background: 'var(--s1, #1C1C1E)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <SectionLabel label="Cartões de crédito" />
          {cards.map((card, i) => (
            <ResumoRow key={card.id} last={i === cards.length - 1}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 3 }}>{card.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>
                  Fecha {card.closing_day} · Vence {card.due_day}
                  {card.credit_limit != null && ` · Limite ${formatCurrency(card.credit_limit)}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {cardDashboards.get(card.id)?.latest_invoice && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--red-400, #FF453A)', fontWeight: 600 }}>
                      {formatCurrency(cardDashboards.get(card.id)!.latest_invoice!.computed_total)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>fatura</div>
                  </div>
                )}
                <Link href={`/cartao/${card.id}`} style={{ fontSize: 12, color: 'var(--blue-400, #0A84FF)', textDecoration: 'none' }}>Faturas →</Link>
              </div>
            </ResumoRow>
          ))}
        </div>
      )}

      {/* Informações */}
      <div style={{ background: 'var(--s1, #1C1C1E)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <SectionLabel label="Informações" />
        {[
          { label: 'Instituição',     value: institutionName },
          { label: 'Total de contas', value: `${accounts.length} conta${accounts.length !== 1 ? 's' : ''}` },
          { label: 'Cartões',         value: `${cards.length} cartão${cards.length !== 1 ? 'ões' : ''}` },
        ].map((s, i, arr) => (
          <ResumoRow key={i} last={i === arr.length - 1}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{s.value}</span>
          </ResumoRow>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Link href="/lancamentos/novo" style={{ ...primaryLinkStyle, textAlign: 'center', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
          + Novo lançamento
        </Link>
        <Link href="/upload" style={{ ...ghostLinkStyle, textAlign: 'center', padding: '13px', borderRadius: 12, fontSize: 14 }}>
          Importar extrato
        </Link>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--sep, rgba(255,255,255,0.07))', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted, rgba(255,255,255,0.35))' }}>
      {label}
    </div>
  );
}

function ResumoRow({ children, last }: { children: React.ReactNode; last: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: last ? 'none' : '1px solid var(--sep, rgba(255,255,255,0.07))' }}>
      {children}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  background: 'var(--s1, #1C1C1E)',
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.06)',
  overflow: 'hidden',
};

const primaryLinkStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 8,
  background: 'var(--blue-400, #0A84FF)',
  color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

const ghostLinkStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'var(--s2, #2C2C2E)',
  color: 'var(--text-secondary, rgba(255,255,255,0.6))', fontSize: 13, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '8px 14px', borderRadius: 8,
  border: '1px solid var(--border-default, rgba(255,255,255,0.1))',
  background: 'var(--s1, #1C1C1E)', color: 'var(--text-primary, #fff)',
  fontSize: 13, cursor: 'pointer',
};
