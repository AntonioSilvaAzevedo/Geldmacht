/**
 * ManageProductModal
 *
 * Modal de gerenciamento de conta bancária ou cartão de crédito.
 * Renderizado via portal (position: fixed) sobre qualquer conteúdo.
 *
 * Uso:
 *   <ManageProductModal
 *     inst={{ name: 'Nubank', abbr: 'N', color: '#820AD1' }}
 *     product={{ kind: 'conta', data: account }}
 *     onClose={() => setManaging(null)}
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

export type ManagedProduct =
  | { kind: 'conta';  data: BankAccountConfig }
  | { kind: 'cartao'; data: CreditCardConfig };

type Step = 'main' | 'edit' | 'confirm' | 'loading' | 'done' | 'error';
type DoneReason = 'deleted' | 'updated';

interface Props {
  inst:      { name: string; abbr: string; color: string };
  product:   ManagedProduct;
  onClose:   () => void;
  /** Chamado após qualquer conclusão bem-sucedida — use para recarregar a lista */
  onDeleted: () => void;
  /** Se definido e kind === 'cartao', exibe botão "Adicionar novo cartão" no step done */
  onAddNew?: () => void;
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function ManageProductModal({
  inst,
  product,
  onClose,
  onDeleted,
  onAddNew,
}: Props) {
  const [step,       setStep]       = useState<Step>('main');
  const [errorMsg,   setErrorMsg]   = useState('');
  const [doneReason, setDoneReason] = useState<DoneReason>('deleted');

  const isCartao  = product.kind === 'cartao';
  const typeLabel = isCartao ? 'cartão' : 'conta';

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    setStep('loading');
    try {
      if (isCartao) await api.deleteCard(product.data.id);
      else          await api.deactivateBankAccount(product.data.id);
      setDoneReason('deleted');
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado.');
      setStep('error');
    }
  }

  async function handleUpdate(payload: Record<string, unknown>) {
    setStep('loading');
    try {
      if (isCartao) {
        await api.updateCard(product.data.id, payload as Parameters<typeof api.updateCard>[1]);
      } else {
        await api.updateBankAccount(product.data.id, payload as Parameters<typeof api.updateBankAccount>[1]);
      }
      setDoneReason('updated');
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado.');
      setStep('error');
    }
  }

  // Chamado pelo botão "Fechar" no step done
  function handleClose() {
    onDeleted();
    onClose();
  }

  // Chamado pelo botão "Adicionar novo cartão" no step done
  function handleAddNew() {
    onDeleted();
    onAddNew?.();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:   'var(--surface-1)',
          border:       '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          padding:      22,
          width:        '100%',
          maxWidth:     420,
          boxShadow:    '0 32px 80px rgba(0,0,0,0.75)',
          animation:    'gm-fade-up 0.18s ease both',
        }}
      >
        {/* ── Header com avatar + nome da instituição ── */}
        <ModalHeader
          inst={inst}
          product={product}
          onClose={onClose}
          hidden={step === 'loading' || step === 'done' || step === 'error'}
        />

        {step === 'main' && (
          <StepMain
            product={product}
            isCartao={isCartao}
            onEdit={() => setStep('edit')}
            onDelete={() => setStep('confirm')}
          />
        )}
        {step === 'edit' && (
          <StepEdit
            product={product}
            isCartao={isCartao}
            onCancel={() => setStep('main')}
            onSave={handleUpdate}
          />
        )}
        {step === 'confirm' && (
          <StepConfirm
            product={product}
            isCartao={isCartao}
            onCancel={() => setStep('main')}
            onConfirm={handleDelete}
          />
        )}
        {step === 'loading' && (
          <StepLoading typeLabel={typeLabel} />
        )}
        {step === 'done' && (
          <StepDone
            reason={doneReason}
            isCartao={isCartao}
            onClose={handleClose}
            onAddNew={isCartao && doneReason === 'deleted' && onAddNew ? handleAddNew : undefined}
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
  product,
  onClose,
  hidden,
}: {
  inst:    { name: string; abbr: string; color: string };
  product: ManagedProduct;
  onClose: () => void;
  hidden:  boolean;
}) {
  if (hidden) return null;

  const isCartao  = product.kind === 'cartao';
  const typeLabel = isCartao
    ? 'Cartão de crédito'
    : product.kind === 'conta'
      ? (ACCOUNT_TYPE_LABELS[product.data.account_type] ?? 'Conta bancária')
      : 'Conta bancária';

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
          {product.data.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          {inst.name} · {typeLabel}
        </div>
      </div>

      {/* Botão fechar */}
      <button
        onClick={onClose}
        style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.45)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontFamily: 'inherit',
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── StepMain ──────────────────────────────────────────────────────────────────

function StepMain({ product, isCartao, onEdit, onDelete }: {
  product:  ManagedProduct;
  isCartao: boolean;
  onEdit:   () => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Pagar fatura — apenas cartão, em breve */}
      {isCartao && (
        <ActionButton
          icon="💳"
          label="Pagar fatura"
          description="Registrar pagamento da fatura atual (em breve)"
          onClick={() => {/* future */}}
          variant="disabled"
        />
      )}

      {/* Editar dados */}
      <ActionButton
        icon="✏️"
        label="Editar dados"
        description={`Renomear ou ajustar informações ${isCartao ? 'do cartão' : 'da conta'}`}
        onClick={onEdit}
        variant="default"
      />

      {/* Excluir / Desativar */}
      <ActionButton
        icon="🗑"
        label={isCartao ? 'Excluir cartão' : 'Desativar conta'}
        description={isCartao
          ? 'Remove o cartão e todos os dados vinculados'
          : 'Oculta a conta da interface (dados preservados)'}
        onClick={onDelete}
        variant="danger"
      />

      {/* Info sobre conta inativa */}
      {!isCartao && product.kind === 'conta' && !product.data.is_active && (
        <div style={{
          marginTop: 4, padding: '8px 12px', borderRadius: 9,
          background: 'rgba(255,159,10,0.08)',
          border: '1px solid rgba(255,159,10,0.20)',
          fontSize: 12, color: 'var(--amber-400, #FF9F0A)',
        }}>
          Esta conta já está desativada.
        </div>
      )}
    </div>
  );
}

// ── ActionButton ──────────────────────────────────────────────────────────────

function ActionButton({ icon, label, description, onClick, variant }: {
  icon:        string;
  label:       string;
  description: string;
  onClick:     () => void;
  variant:     'default' | 'danger' | 'disabled';
}) {
  const isDisabled = variant === 'disabled';
  const isDanger   = variant === 'danger';

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 12,
        border: isDanger
          ? '1px solid rgba(255,69,58,0.20)'
          : '1px solid rgba(255,255,255,0.08)',
        background: isDanger
          ? 'rgba(255,69,58,0.06)'
          : 'var(--surface-2)',
        color: isDanger
          ? 'var(--red-400, #FF453A)'
          : isDisabled
            ? 'rgba(255,255,255,0.25)'
            : 'var(--text-primary)',
        textAlign: 'left', cursor: isDisabled ? 'not-allowed' : 'pointer',
        width: '100%', fontFamily: 'inherit',
        transition: 'background 0.12s, border-color 0.12s',
        opacity: isDisabled ? 0.55 : 1,
      }}
      onMouseEnter={e => {
        if (isDisabled) return;
        e.currentTarget.style.background = isDanger
          ? 'rgba(255,69,58,0.12)'
          : 'rgba(255,255,255,0.10)';
        e.currentTarget.style.borderColor = isDanger
          ? 'rgba(255,69,58,0.35)'
          : 'rgba(255,255,255,0.14)';
      }}
      onMouseLeave={e => {
        if (isDisabled) return;
        e.currentTarget.style.background = isDanger
          ? 'rgba(255,69,58,0.06)'
          : 'var(--surface-2)';
        e.currentTarget.style.borderColor = isDanger
          ? 'rgba(255,69,58,0.20)'
          : 'rgba(255,255,255,0.08)';
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{label}</div>
        <div style={{
          fontSize: 12,
          color: isDanger ? 'rgba(255,69,58,0.7)' : 'var(--text-secondary)',
          marginTop: 2,
        }}>
          {description}
        </div>
      </div>
      {!isDisabled && (
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>›</span>
      )}
    </button>
  );
}

// ── StepEdit ──────────────────────────────────────────────────────────────────

function StepEdit({ product, isCartao, onCancel, onSave }: {
  product:  ManagedProduct;
  isCartao: boolean;
  onCancel: () => void;
  onSave:   (payload: Record<string, unknown>) => Promise<void>;
}) {
  const acc  = product.kind === 'conta'  ? product.data : null;
  const card = product.kind === 'cartao' ? product.data : null;

  const [name,        setName]        = useState(product.data.name);
  const [institution, setInstitution] = useState(product.data.institution ?? '');
  const [accountType, setAccountType] = useState<BankAccountType>(acc?.account_type ?? 'checking');
  const [closingDay,  setClosingDay]  = useState(String(card?.closing_day ?? ''));
  const [dueDay,      setDueDay]      = useState(String(card?.due_day ?? ''));
  const [creditLimit, setCreditLimit] = useState(
    card?.credit_limit != null ? String(card.credit_limit) : '',
  );
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 8,
    border: '1px solid var(--border-default)',
    background: 'var(--surface-panel, var(--surface-2))',
    color: 'var(--text-primary)', fontSize: 14,
    fontFamily: 'inherit', boxSizing: 'border-box',
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 5,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
    textTransform: 'uppercase', color: 'var(--text-secondary)',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr('Informe o nome.'); return; }
    setSaving(true);
    setErr('');
    try {
      if (isCartao) {
        const payload: Record<string, unknown> = {
          name: name.trim(),
          institution: institution.trim() || null,
          closing_day: Number(closingDay),
          due_day:     Number(dueDay),
        };
        if (creditLimit.trim() !== '') {
          payload.credit_limit = creditLimit.trim() === '0' ? 0 : Number(creditLimit);
        }
        await onSave(payload);
      } else {
        await onSave({
          name:         name.trim(),
          institution:  institution.trim() || null,
          account_type: accountType,
        });
      }
    } catch {
      setErr('Erro ao salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={e => { void handleSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Nome */}
      <label style={labelStyle}>
        Nome
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
          autoFocus
        />
      </label>

      {/* Instituição */}
      <label style={labelStyle}>
        Instituição
        <input
          value={institution}
          onChange={e => setInstitution(e.target.value)}
          placeholder="Ex: Nubank"
          style={inputStyle}
        />
      </label>

      {/* Conta: tipo */}
      {!isCartao && (
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
      )}

      {/* Cartão: dias */}
      {isCartao && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            Dia fechamento
            <input
              type="number" min={1} max={31}
              value={closingDay}
              onChange={e => setClosingDay(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Dia vencimento
            <input
              type="number" min={1} max={31}
              value={dueDay}
              onChange={e => setDueDay(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>
      )}

      {/* Cartão: limite */}
      {isCartao && (
        <label style={labelStyle}>
          Limite (R$) <span style={{ fontWeight: 400, letterSpacing: 0 }}>— opcional</span>
          <input
            type="number" min={0} step={0.01}
            value={creditLimit}
            onChange={e => setCreditLimit(e.target.value)}
            placeholder="Ex: 5000.00"
            style={inputStyle}
          />
        </label>
      )}

      {err && (
        <p style={{ fontSize: 12, color: 'var(--red-400)', margin: 0 }}>{err}</p>
      )}

      {/* Botões */}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, padding: '10px', borderRadius: 9,
            border: '1px solid var(--border-default)',
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
            background: saving
              ? 'var(--surface-2)'
              : 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
            color: saving ? 'var(--text-muted)' : '#fff',
            fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}

// ── StepConfirm ───────────────────────────────────────────────────────────────

function StepConfirm({ product, isCartao, onCancel, onConfirm }: {
  product:   ManagedProduct;
  isCartao:  boolean;
  onCancel:  () => void;
  onConfirm: () => void;
}) {
  const title         = isCartao ? 'Excluir cartão?' : 'Desativar conta?';
  const warningHeader = isCartao
    ? 'Todos os dados serão perdidos permanentemente'
    : 'A conta ficará oculta na interface';

  type Item = { text: string; positive: boolean };
  const items: Item[] = isCartao
    ? [
        { text: 'Todo o histórico de transações',          positive: false },
        { text: 'Faturas e lançamentos do cartão',         positive: false },
        { text: 'Categorias e notas associadas',           positive: false },
        { text: 'Esta operação não pode ser desfeita',     positive: false },
      ]
    : [
        { text: 'A conta sumirá da Carteira e de todas as telas',              positive: false },
        { text: 'Os lançamentos e extratos são preservados',                    positive: true  },
        { text: 'Pode ser reativada nas configurações a qualquer momento',      positive: true  },
      ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Título */}
      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em' }}>
        {title}
      </div>

      {/* Aviso */}
      <div style={{
        padding: '14px 16px', borderRadius: 12,
        background: 'rgba(255,69,58,0.08)',
        border: '1px solid rgba(255,69,58,0.25)',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
          color: 'var(--red-400, #FF453A)', marginBottom: 10,
          textTransform: 'uppercase',
        }}>
          ⚠️ {warningHeader}
        </div>
        <ul style={{
          listStyle: 'none', padding: 0, margin: 0,
          display: 'flex', flexDirection: 'column', gap: 7,
        }}>
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

      {/* Botões */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '10px', borderRadius: 9,
            border: '1px solid var(--border-default)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 2, padding: '10px', borderRadius: 9, border: 'none',
            background: 'var(--red-400, #FF453A)',
            color: '#fff',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Sim, {isCartao ? 'excluir' : 'desativar'}
        </button>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
        {isCartao
          ? `"${product.data.name}" será excluído permanentemente.`
          : `"${product.data.name}" será desativada.`}
      </p>
    </div>
  );
}

// ── StepLoading ───────────────────────────────────────────────────────────────

function StepLoading({ typeLabel }: { typeLabel: string }) {
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
        Processando {typeLabel}...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── StepDone ──────────────────────────────────────────────────────────────────

function StepDone({ reason, isCartao, onClose, onAddNew }: {
  reason:    DoneReason;
  isCartao:  boolean;
  onClose:   () => void;
  onAddNew?: () => void;
}) {
  const title = reason === 'updated'
    ? (isCartao ? 'Cartão atualizado com sucesso' : 'Conta atualizada com sucesso')
    : isCartao
      ? 'Cartão excluído com sucesso'
      : 'Conta desativada';

  const subtitle = reason === 'updated'
    ? 'As alterações foram salvas.'
    : isCartao
      ? 'O cartão e suas transações foram removidos.'
      : 'Os dados foram preservados. A conta foi removida da interface.';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', textAlign: 'center',
      gap: 12, padding: '24px 0 16px',
    }}>
      {/* Ícone de sucesso */}
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

      {/* Botões */}
      <div style={{ width: '100%', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {onAddNew && (
          <button
            onClick={onAddNew}
            style={{
              width: '100%', padding: '13px', borderRadius: 11, border: 'none',
              background: 'var(--blue-400, #0A84FF)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Adicionar novo cartão
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '11px', borderRadius: 10,
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
      {/* Ícone de erro */}
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
            border: '1px solid var(--border-default)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onRetry}
          style={{
            flex: 2, padding: '10px', borderRadius: 9, border: 'none',
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
