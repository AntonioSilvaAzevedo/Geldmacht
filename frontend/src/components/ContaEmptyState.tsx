'use client';

import { useState } from 'react';
import { api, type BankAccountConfig, type BankAccountType } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InstInfo {
  name: string;
  abbr: string;
  color: string;
}

interface ContaEmptyStateProps {
  inst: InstInfo;
  reason?: 'card_only' | 'new';
  onSave?: (account: BankAccountConfig) => void;
  onImportOFX?: () => void;
}

type AccountTipo = 'pf' | 'pj' | 'poupanca';

const TIPO_TO_ACCOUNT_TYPE: Record<AccountTipo, BankAccountType> = {
  pf:       'checking',
  pj:       'business',
  poupanca: 'savings',
};

// ── Styles ────────────────────────────────────────────────────────────────────

const lbl: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--t3)',
  display: 'block', marginBottom: 4,
};

const inp: React.CSSProperties = {
  padding: '8px 11px', borderRadius: 9,
  border: '1px solid rgba(255,255,255,.1)',
  background: 'var(--surface-2)', color: 'var(--t1)',
  fontSize: 13, width: '100%',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ContaEmptyState({
  inst,
  reason = 'card_only',
  onSave,
  onImportOFX,
}: ContaEmptyStateProps) {
  const [state,   setState]  = useState<'idle' | 'form' | 'success'>('idle');
  const [tipo,    setTipo]   = useState<AccountTipo>('pf');
  const [agencia, setAgencia] = useState('');
  const [numero,  setNumero]  = useState('');
  const [saldo,   setSaldo]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [savedAccount, setSavedAccount] = useState<BankAccountConfig | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const nameParts = [
        inst.name,
        agencia && `Ag. ${agencia}`,
        numero  && `C. ${numero}`,
      ].filter(Boolean);

      const account = await api.createBankAccount({
        name:         nameParts.join(' · '),
        institution:  inst.name,
        account_type: TIPO_TO_ACCOUNT_TYPE[tipo],
        currency:     'BRL',
        is_active:    true,
      });

      // Create initial balance transaction if saldo was provided
      const saldoNum = parseBRL(saldo);
      if (saldoNum !== 0) {
        await api.createManualTransaction({
          transaction_type: saldoNum > 0 ? 'income' : 'expense',
          amount:           Math.abs(saldoNum),
          transaction_date: new Date().toISOString().slice(0, 10),
          description:      'Saldo inicial',
          bank_account_id:  account.id,
        });
      }

      setSavedAccount(account);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setSaving(false);
    }
  }

  // ── Success ──────────────────────────────────────────────────────────────────

  if (state === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 24px', gap: 20 }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(48,209,88,.12)', border: '2px solid rgba(48,209,88,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 8 }}>Conta vinculada!</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.65, maxWidth: 340 }}>
            A conta foi adicionada a <strong style={{ color: 'var(--t1)' }}>{inst.name}</strong>.<br/>
            Suas faturas e transações existentes continuam intactas.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { setState('idle'); setAgencia(''); setNumero(''); setSaldo(''); setSavedAccount(null); }}
            style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: 'var(--t2)', fontSize: 13, cursor: 'pointer' }}
          >
            + Outra conta
          </button>
          <button
            onClick={() => savedAccount && onSave?.(savedAccount)}
            style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Ver detalhe →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* Context banner */}
      <div style={{ background: 'rgba(255,159,10,.07)', border: '1px solid rgba(255,159,10,.22)', borderRadius: 14, padding: '13px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--orange)', marginBottom: 3 }}>
            {reason === 'card_only' ? 'Nenhuma conta bancária vinculada' : 'Instituição sem conta configurada'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65 }}>
            {reason === 'card_only'
              ? <>Você tem um cartão <strong style={{ color: 'var(--t1)' }}>{inst.name}</strong> cadastrado, mas ainda não criou uma conta corrente. Isso acontece quando faturas são importadas antes da carteira ser configurada. <strong style={{ color: 'var(--t1)' }}>Não é necessário limpar o banco de dados.</strong></>
              : <>Esta instituição ainda não tem uma conta bancária. Vincule uma conta para acompanhar o saldo e as movimentações.</>
            }
          </div>
        </div>
      </div>

      {/* CTAs */}
      {state === 'idle' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            onClick={() => setState('form')}
            style={{ background: 'var(--surface-card)', border: '1.5px solid rgba(10,132,255,.4)', borderRadius: 16, padding: '22px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(10,132,255,.08)'; e.currentTarget.style.borderColor = 'rgba(10,132,255,.65)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-card)'; e.currentTarget.style.borderColor = 'rgba(10,132,255,.4)'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(10,132,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zM3 10h18M8 6V3M16 6V3"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: 'var(--t1)' }}>Vincular conta bancária</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.55 }}>
              Informe agência e conta. Suas faturas já importadas continuam intactas.
            </div>
          </button>

          <button
            onClick={() => onImportOFX?.()}
            style={{ background: 'var(--surface-card)', border: '1.5px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '22px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-card)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: 'var(--t1)' }}>Importar extrato (OFX)</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.55 }}>
              Suba o arquivo OFX — a conta é criada automaticamente durante a importação.
            </div>
          </button>
        </div>
      )}

      {/* Inline form */}
      {state === 'form' && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid rgba(10,132,255,.3)', borderRadius: 16, padding: '20px 20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Vincular conta bancária</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{inst.name}</div>
            </div>
            <button onClick={() => setState('idle')} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
          </div>

          {/* Tipo */}
          <div style={{ marginBottom: 14 }}>
            <span style={lbl}>Tipo de conta</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {([{ id: 'pf', label: 'Conta PF' }, { id: 'pj', label: 'Conta PJ' }, { id: 'poupanca', label: 'Poupança' }] as { id: AccountTipo; label: string }[]).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTipo(t.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: '1px solid',
                    borderColor: tipo === t.id ? `${inst.color}66` : 'rgba(255,255,255,.1)',
                    background:  tipo === t.id ? `${inst.color}18` : 'transparent',
                    color:       tipo === t.id ? inst.color : 'var(--t2)',
                    fontSize: 12, fontWeight: tipo === t.id ? 600 : 400,
                    cursor: 'pointer', transition: 'all .12s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Agência + Conta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={lbl}>Agência</span>
              <input value={agencia} onChange={e => setAgencia(e.target.value)} placeholder="Ex: 0502" style={inp}/>
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={lbl}>Conta</span>
              <input value={numero} onChange={e => setNumero(e.target.value)} placeholder="Ex: 079787-1" style={inp}/>
            </label>
          </div>

          {/* Saldo inicial */}
          <label style={{ display: 'grid', gap: 4, marginBottom: 18 }}>
            <span style={lbl}>Saldo atual (opcional)</span>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>R$</span>
              <input
                value={saldo}
                onChange={e => setSaldo(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                style={{ ...inp, paddingLeft: 32, fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <span style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Usado como saldo de abertura para cálculos futuros.</span>
          </label>

          {/* Non-destructive notice */}
          <div style={{ background: 'rgba(48,209,88,.07)', border: '1px solid rgba(48,209,88,.2)', borderRadius: 10, padding: '10px 13px', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <div style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.6 }}>
              Faturas e transações já importadas <strong style={{ color: 'var(--t1)' }}>não serão afetadas</strong>. A conta será criada e vinculada ao histórico existente.
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, padding: '8px 12px', background: 'rgba(255,69,58,.08)', borderRadius: 8, border: '1px solid rgba(255,69,58,.2)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setState('idle')}
              style={{ padding: '10px 18px', borderRadius: 9, border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: 'var(--t2)', fontSize: 13, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: saving ? 'rgba(10,132,255,.4)' : 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all .15s' }}
            >
              {saving ? 'Salvando…' : 'Vincular conta'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseBRL(value: string): number {
  if (!value.trim()) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}
