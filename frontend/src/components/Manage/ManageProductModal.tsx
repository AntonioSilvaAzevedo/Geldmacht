/**
 * ManageProductModal
 *
 * Modal de gerenciamento de instituição — opera no nível da instituição,
 * expondo ações sobre a conta bancária e o cartão de crédito vinculados.
 *
 * Uso:
 *   <ManageProductModal
 *     inst={{ name: 'Nubank', abbr: 'N', color: '#820AD1', accounts: [...], cards: [...] }}
 *     onClose={() => setShowManage(false)}
 *     onDeleted={() => void load()}
 *   />
 */

'use client';
import { useState } from 'react';
import {
  api,
  type BankAccountConfig,
  type BankAccountType,
  type CreditCardConfig,
} from '@/lib/api';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface InstInfo {
  name:     string;
  abbr:     string;
  color:    string;
  accounts: BankAccountConfig[];
  cards:    CreditCardConfig[];
}

type Step        = 'main' | 'edit' | 'confirm' | 'loading' | 'done' | 'error';
type ConfirmType = 'conta' | 'cartao';
type DoneReason  = 'deleted' | 'updated';

interface Props {
  inst:      InstInfo;
  onClose:   () => void;
  /** Chamado após qualquer conclusão bem-sucedida — use para recarregar a lista */
  onDeleted: () => void;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_OPTIONS: { value: BankAccountType; label: string }[] = [
  { value: 'checking',   label: 'Conta corrente'    },
  { value: 'savings',    label: 'Conta poupança'     },
  { value: 'payment',    label: 'Conta pagamento'    },
  { value: 'business',   label: 'Conta PJ'           },
  { value: 'investment', label: 'Conta investimento' },
  { value: 'other',      label: 'Outra'              },
];

const ACCOUNT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ACCOUNT_TYPE_OPTIONS.map(o => [o.value, o.label]),
);

// ── Estilos compartilhados ────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '24px 16px',
};

const containerStyle: React.CSSProperties = {
  background:   'var(--surface-1)',
  border:       '1px solid rgba(255,255,255,0.10)',
  borderRadius: 24,
  padding:      22,
  width:        '100%',
  maxWidth:     420,
  boxShadow:    '0 32px 80px rgba(0,0,0,0.75)',
  animation:    'gm-fade-up 0.18s ease both',
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function ManageProductModal({ inst, onClose, onDeleted }: Props) {
  const contas    = inst.accounts;
  const cartoes   = inst.cards;
  const hasCartao = cartoes.length > 0;

  const [step,        setStep]        = useState<Step>('main');
  const [confirmType, setConfirmType] = useState<ConfirmType | null>(null);
  const [doneReason,  setDoneReason]  = useState<DoneReason>('deleted');
  const [errorMsg,    setErrorMsg]    = useState('');

  // Subtítulo do header: nomes dos produtos
  const subtitleParts = [
    ...contas.map(c => ACCOUNT_TYPE_LABELS[c.account_type] ?? c.name),
    ...cartoes.map(c => c.name),
  ].join(' · ');

  // ── Handlers ────────────────────────────────────────────────────────────────

  function askConfirm(type: ConfirmType) {
    setConfirmType(type);
    setStep('confirm');
  }

  async function handleDelete() {
    if (!confirmType) return;
    setStep('loading');
    try {
      if (confirmType === 'cartao' && cartoes[0]) {
        await api.deleteCard(cartoes[0].id);
      } else if (confirmType === 'conta' && contas[0]) {
        await api.deactivateBankAccount(contas[0].id);
      }
      setDoneReason('deleted');
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado.');
      setStep('error');
    }
  }

  async function handleUpdate(payload: Record<string, unknown>) {
    if (!contas[0]) return;
    setStep('loading');
    try {
      await api.updateBankAccount(
        contas[0].id,
        payload as Parameters<typeof api.updateBankAccount>[1],
      );
      setDoneReason('updated');
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado.');
      setStep('error');
    }
  }

  function handleClose() {
    onDeleted();
    onClose();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={containerStyle}>

        {/* Header */}
        <ModalHeader
          inst={inst}
          subtitle={subtitleParts}
          onClose={onClose}
          hidden={step === 'loading' || step === 'done' || step === 'error'}
        />

        {step === 'main' && (
          <StepMain
            contas={contas}
            cartoes={cartoes}
            hasCartao={hasCartao}
            onEdit={() => setStep('edit')}
            onDeleteConta={() => askConfirm('conta')}
            onDeleteCartao={() => askConfirm('cartao')}
          />
        )}
        {step === 'edit' && contas[0] && (
          <StepEdit
            account={contas[0]}
            onCancel={() => setStep('main')}
            onSave={handleUpdate}
          />
        )}
        {step === 'confirm' && confirmType && (
          <StepConfirm
            confirmType={confirmType}
            conta={contas[0] ?? null}
            cartao={cartoes[0] ?? null}
            onCancel={() => setStep('main')}
            onConfirm={() => void handleDelete()}
          />
        )}
        {step === 'loading' && (
          <StepLoading confirmType={confirmType} />
        )}
        {step === 'done' && (
          <StepDone
            reason={doneReason}
            confirmType={confirmType}
            onClose={handleClose}
          />
        )}
        {step === 'error' && (
          <StepError
            msg={errorMsg}
            onRetry={() => setStep('confirm')}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// ── ModalHeader ───────────────────────────────────────────────────────────────

function ModalHeader({
  inst,
  subtitle,
  onClose,
  hidden,
}: {
  inst:     InstInfo;
  subtitle: string;
  onClose:  () => void;
  hidden:   boolean;
}) {
  if (hidden) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: inst.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
      }}>
        {inst.abbr.charAt(0)}
      </div>

      {/* Textos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 700, letterSpacing: '-0.015em',
          lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {inst.name}
        </div>
        {subtitle && (
          <div style={{
            fontSize: 11, color: 'var(--text-secondary)', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Botão fechar */}
      <button
        onClick={onClose}
        style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.45)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontFamily: 'inherit',
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── DangerBtn ─────────────────────────────────────────────────────────────────

function DangerBtn({ icon, title, desc, onClick }: {
  icon:    string;
  title:   string;
  desc:    string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px',
        borderRadius: 12,
        border: '1px solid rgba(255,59,48,0.22)',
        background: 'rgba(255,59,48,0.07)',
        color: 'var(--text-primary)',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        fontFamily: 'inherit', transition: 'background 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.14)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.07)'; }}
    >
      <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red-400, #FF453A)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,100,80,0.7)', marginTop: 2 }}>{desc}</div>
      </div>
      <span style={{ color: 'rgba(255,100,80,0.5)', fontSize: 15 }}>›</span>
    </button>
  );
}

// ── StepMain ──────────────────────────────────────────────────────────────────

function StepMain({ contas, cartoes, hasCartao, onEdit, onDeleteConta, onDeleteCartao }: {
  contas:          BankAccountConfig[];
  cartoes:         CreditCardConfig[];
  hasCartao:       boolean;
  onEdit:          () => void;
  onDeleteConta:   () => void;
  onDeleteCartao:  () => void;
}) {
  const hasContas = contas.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Editar conta — botão neutro */}
      {hasContas && (
        <button
          onClick={onEdit}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            cursor: 'pointer', width: '100%', textAlign: 'left',
            fontFamily: 'inherit', transition: 'background 0.12s, border-color 0.12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--surface-2)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: 'center' }}>✏️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Editar conta</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Renomear ou ajustar dados da conta
            </div>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 15 }}>›</span>
        </button>
      )}

      {/* Separador */}
      {hasContas && (
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
      )}

      {/* Excluir conta */}
      {hasContas && (
        <DangerBtn
          icon="🗑"
          title="Excluir conta"
          desc="Desativa e oculta a conta"
          onClick={onDeleteConta}
        />
      )}

      {/* Excluir crédito — apenas se houver cartão */}
      {hasCartao && (
        <DangerBtn
          icon="💳"
          title="Excluir crédito"
          desc={`Remove ${cartoes[0]?.name ?? 'o cartão'} e dados`}
          onClick={onDeleteCartao}
        />
      )}
    </div>
  );
}

// ── StepEdit ──────────────────────────────────────────────────────────────────

function StepEdit({ account, onCancel, onSave }: {
  account:  BankAccountConfig;
  onCancel: () => void;
  onSave:   (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [name,        setName]        = useState(account.name);
  const [institution, setInstitution] = useState(account.institution ?? '');
  const [accountType, setAccountType] = useState<BankAccountType>(account.account_type);
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'var(--surface-2)',
    color: 'var(--text-primary)', fontSize: 14,
    fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 5,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
    textTransform: 'uppercase', color: 'var(--text-secondary)',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr('Informe o nome.'); return; }
    setSaving(true);
    setErr('');
    try {
      await onSave({
        name:         name.trim(),
        institution:  institution.trim() || null,
        account_type: accountType,
      });
    } catch {
      setErr('Erro ao salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={e => { void handleSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <label style={labelStyle}>
        Nome
        <input
          value={name}
          onChange={e => setName(e.target.value)}
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
        <p style={{ fontSize: 12, color: 'var(--red-400, #FF453A)', margin: 0 }}>{err}</p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, padding: '10px', borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 2, padding: '10px', borderRadius: 9, border: 'none',
            background: saving ? 'var(--surface-2)' : 'var(--blue-400, #0A84FF)',
            color: saving ? 'var(--text-secondary)' : '#fff',
            fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}

// ── StepConfirm ───────────────────────────────────────────────────────────────

function StepConfirm({ confirmType, conta, cartao, onCancel, onConfirm }: {
  confirmType: ConfirmType;
  conta:       BankAccountConfig | null;
  cartao:      CreditCardConfig | null;
  onCancel:    () => void;
  onConfirm:   () => void;
}) {
  const isCard = confirmType === 'cartao';
  const title  = isCard ? 'Excluir crédito?' : 'Excluir conta?';
  const label  = isCard ? cartao?.name : conta?.name;

  const warningHeader = isCard
    ? 'Todos os dados serão perdidos permanentemente'
    : 'A conta ficará oculta na interface';

  type Item = { text: string; positive: boolean };
  const items: Item[] = isCard
    ? [
        { text: 'Todo o histórico de transações',      positive: false },
        { text: 'Faturas e lançamentos do cartão',     positive: false },
        { text: 'Categorias e notas associadas',       positive: false },
        { text: 'Esta operação não pode ser desfeita', positive: false },
      ]
    : [
        { text: 'A conta sumirá da Carteira e de todas as telas',          positive: false },
        { text: 'Os lançamentos e extratos são preservados',                positive: true  },
        { text: 'Pode ser reativada nas configurações a qualquer momento',  positive: true  },
      ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em' }}>
        {title}
      </div>

      <div style={{
        padding: '14px 16px', borderRadius: 12,
        background: 'rgba(255,69,58,0.08)',
        border: '1px solid rgba(255,69,58,0.25)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
          color: 'var(--red-400, #FF453A)', marginBottom: 10,
          textTransform: 'uppercase',
        }}>
          ⚠️ {warningHeader}
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {items.map(item => (
            <li key={item.text} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              fontSize: 13, color: 'rgba(255,255,255,0.75)',
            }}>
              <span style={{
                color: item.positive ? 'var(--green-400, #30D158)' : 'var(--red-400, #FF453A)',
                flexShrink: 0, marginTop: 1,
              }}>
                {item.positive ? '✓' : '✕'}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '10px', borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'transparent', color: 'var(--text-secondary)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 2, padding: '10px', borderRadius: 9, border: 'none',
            background: 'var(--red-400, #FF453A)', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Sim, {isCard ? 'excluir' : 'desativar'}
        </button>
      </div>

      {label && (
        <p style={{ fontSize: 11, color: 'var(--text-muted, rgba(255,255,255,0.35))', textAlign: 'center', margin: 0 }}>
          &ldquo;{label}&rdquo; será {isCard ? 'excluído permanentemente' : 'desativada'}.
        </p>
      )}
    </div>
  );
}

// ── StepLoading ───────────────────────────────────────────────────────────────

function StepLoading({ confirmType }: { confirmType: ConfirmType | null }) {
  const label = confirmType === 'cartao' ? 'cartão' : 'conta';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: '32px 0 24px',
    }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid rgba(255,255,255,0.10)',
        borderTopColor: 'var(--blue-400, #0A84FF)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
        Processando {label}...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── StepDone ──────────────────────────────────────────────────────────────────

function StepDone({ reason, confirmType, onClose }: {
  reason:      DoneReason;
  confirmType: ConfirmType | null;
  onClose:     () => void;
}) {
  const isCard = confirmType === 'cartao';

  const title = reason === 'updated'
    ? 'Conta atualizada com sucesso'
    : isCard
      ? 'Crédito excluído'
      : 'Conta excluída';

  const subtitle = reason === 'updated'
    ? 'As alterações foram salvas.'
    : 'Os dados foram removidos com sucesso.';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', textAlign: 'center',
      gap: 12, padding: '24px 0 16px',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: 'rgba(48,209,88,0.10)',
        border: '2px solid rgba(48,209,88,0.30)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
          stroke="var(--green-400, #30D158)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <div>
        <div style={{
          fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em',
          color: 'var(--green-400, #30D158)', marginBottom: 6,
        }}>
          {title}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          {subtitle}
        </p>
      </div>

      <button
        onClick={onClose}
        style={{
          width: '100%', marginTop: 8, padding: '12px', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Fechar
      </button>
    </div>
  );
}

// ── StepError ─────────────────────────────────────────────────────────────────

function StepError({ msg, onRetry, onClose }: {
  msg:     string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', textAlign: 'center',
      gap: 12, padding: '24px 0 16px',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'rgba(255,69,58,0.12)',
        border: '1.5px solid rgba(255,69,58,0.30)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        ✕
      </div>

      <div>
        <div style={{
          fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em',
          color: 'var(--red-400, #FF453A)', marginBottom: 6,
        }}>
          Algo deu errado
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          {msg || 'Não foi possível completar a ação.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1, padding: '10px', borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'transparent', color: 'var(--text-secondary)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onRetry}
          style={{
            flex: 2, padding: '10px', borderRadius: 9, border: 'none',
            background: 'var(--surface-2)', color: 'var(--text-primary)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
