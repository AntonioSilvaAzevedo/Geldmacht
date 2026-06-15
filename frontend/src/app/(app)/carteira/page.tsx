/**
 * src/app/(app)/carteira/page.tsx
 *
 * Hub de Carteira — agrupa BankAccounts + CreditCards por instituição.
 * Rota: /carteira
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Landmark,
  Plus,
} from 'lucide-react';
import { useLancamentoModal } from '@/components/LancamentoModal';
import { ModalOverlay } from '@/components/ModalOverlay';
import ManageProductModal from '@/components/Manage/ManageProductModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import {
  api,
  type BankAccountConfig,
  type BankAccountPayload,
  type BankAccountType,
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
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [showNewAccount, setShowNewAccount] = useState(false);

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

  useEffect(() => { void load(); }, []);

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

  const padding = isMobile ? '16px 14px 32px' : '24px 32px 40px';

  return (
    <>
      <NewAccountModal
        isOpen={showNewAccount}
        onClose={() => setShowNewAccount(false)}
        onCreated={() => { setShowNewAccount(false); void load(); }}
      />
<main style={{ padding, flex: 1, maxWidth: 860, margin: '0 auto', width: '100%' }}>

        {/* Empty state */}
        {institutions.length === 0 && (
          <EmptyState
            icon={<Landmark size={24} />}
            title="Nenhuma conta ou cartão cadastrado"
            description="Cadastre contas e cartões para visualizar sua carteira consolidada."
          >
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowNewAccount(true)} style={{ ...primaryLinkStyle, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cadastrar conta</button>
              <Link href="/cartao" style={ghostLinkStyle}>Cadastrar cartão</Link>
            </div>
          </EmptyState>
        )}

        {/* Institution cards grid */}
        {institutions.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {institutions.map(inst => (
              <InstitutionCard key={inst.name} institution={inst} onReload={() => void load()} />
            ))}

            {/* Add CTA */}
            <button
              onClick={() => setShowNewAccount(true)}
              style={{
                border: '1px dashed rgba(255,255,255,0.09)', borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '24px', color: 'rgba(255,255,255,0.25)',
                fontSize: 13, background: 'transparent', cursor: 'pointer',
                transition: 'all 0.15s', minHeight: 100, fontFamily: 'inherit',
                width: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
              }}
            >
              <Plus size={15} /> Nova conta / instituição
            </button>
          </div>
        )}
      </main>
    </>
  );
}

// ── InstitutionCard ───────────────────────────────────────────────────────────

function InstitutionCard({
  institution,
  onReload,
}: {
  institution: InstitutionGroup;
  onReload:    () => void;
}) {
  const { name, slug, accounts, cards } = institution;
  const [hovered,    setHovered]    = useState(false);
  const [showManage, setShowManage] = useState(false);
  const router = useRouter();
  const { openModal } = useLancamentoModal();

  const firstBankId = accounts[0]?.id ?? undefined;

  const color = getInstitutionColor(name);
  const abbr  = getAbbr(name);

  return (
    <div
      onClick={() => router.push(`/carteira/${slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:  hovered ? '#242424' : 'var(--surface-1)',
        border:      `1px solid ${hovered ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 20,
        padding:     20,
        color:       'inherit',
        display:     'block',
        cursor:      'pointer',
        transition:  'background 0.15s, border-color 0.15s',
        userSelect:  'none',
        position:    'relative',
      }}
    >
      {/* ── Botão gerenciar (sliders absoluto) ── */}
      <button
        onClick={e => { e.stopPropagation(); setShowManage(true); }}
        title="Gerenciar"
        style={{
          position: 'absolute', top: 14, right: 14,
          padding: '4px', border: 'none', background: 'transparent',
          color: 'rgba(255,255,255,0.20)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color .12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.20)'; }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <line x1="2" y1="4.5" x2="14" y2="4.5" />
          <circle cx="5.5" cy="4.5" r="2" fill="var(--surface-1)" stroke="currentColor" strokeWidth="1.6" />
          <line x1="2" y1="11.5" x2="14" y2="11.5" />
          <circle cx="10.5" cy="11.5" r="2" fill="var(--surface-1)" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingRight: 22 }}>

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

        {/* Nome */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em',
            lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
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
        {cards.map(card => (
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

            {card.credit_limit != null && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
                  letterSpacing: '-0.01em', lineHeight: 1,
                  color: 'var(--text-secondary)',
                }}>
                  {formatCurrency(card.credit_limit)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                  limite
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={e => {
            e.stopPropagation();
            openModal({ bankAccountId: firstBankId });
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all .12s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background  = 'rgba(10,132,255,0.1)';
            e.currentTarget.style.borderColor = 'rgba(10,132,255,0.3)';
            e.currentTarget.style.color       = 'var(--blue, #0A84FF)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
            e.currentTarget.style.color       = 'rgba(255,255,255,0.4)';
          }}
        >
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Lançar
        </button>

        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--blue-400, #0A84FF)', letterSpacing: '-0.005em' }}>
          Ver detalhes →
        </span>
      </div>

      {/* ── ManageProductModal ── */}
      {showManage && (
        <ManageProductModal
          inst={{ name, abbr, color, accounts, cards }}
          onClose={() => setShowManage(false)}
          onDeleted={onReload}
        />
      )}
    </div>
  );
}

// ── NewAccountModal ───────────────────────────────────────────────────────────

const ACCOUNT_TYPE_OPTIONS: { value: BankAccountType; label: string }[] = [
  { value: 'checking',   label: 'Conta corrente' },
  { value: 'savings',    label: 'Conta poupança' },
  { value: 'payment',    label: 'Conta pagamento' },
  { value: 'business',   label: 'Conta PJ' },
  { value: 'investment', label: 'Conta investimento' },
  { value: 'other',      label: 'Outra' },
];

function NewAccountModal({ isOpen, onClose, onCreated }: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName]               = useState('');
  const [institution, setInstitution] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('checking');
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState('');

  const reset = () => { setName(''); setInstitution(''); setAccountType('checking'); setErr(''); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr('Informe o nome da conta.'); return; }
    setSaving(true);
    setErr('');
    try {
      const payload: BankAccountPayload = {
        name: name.trim(),
        institution: institution.trim() || null,
        account_type: accountType,
        is_active: true,
      };
      await api.createBankAccount(payload);
      reset();
      onCreated();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Erro ao criar conta.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 9,
    border: '1px solid var(--border-default)',
    background: 'var(--surface-panel)',
    color: 'var(--text-primary)', fontSize: 14,
    fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 6,
    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
    letterSpacing: '0.04em', textTransform: 'uppercase',
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={handleClose} title="Nova conta bancária" width={420}>
      <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={labelStyle}>
          Nome da conta
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Nubank · CC"
            style={inputStyle}
            autoFocus
          />
        </label>

        <label style={labelStyle}>
          Instituição
          <input
            value={institution}
            onChange={e => setInstitution(e.target.value)}
            placeholder="Ex: Nubank"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Tipo de conta
          <select
            value={accountType}
            onChange={e => setAccountType(e.target.value as BankAccountType)}
            style={inputStyle}
          >
            {ACCOUNT_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        {err && (
          <p style={{ fontSize: 12, color: 'var(--red-400)', margin: 0 }}>{err}</p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              flex: 1, padding: '11px', borderRadius: 9,
              border: '1px solid var(--border-default)',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 2, padding: '11px', borderRadius: 9, border: 'none',
              background: saving ? 'var(--surface-card)' : 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
              color: saving ? 'var(--text-muted)' : '#fff',
              fontSize: 14, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {saving ? 'Criando...' : 'Criar conta'}
          </button>
        </div>
      </form>
    </ModalOverlay>
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
