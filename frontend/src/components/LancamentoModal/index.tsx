'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { api, type BankAccountConfig, type Category, type ManualTransactionPayload } from '@/lib/api';
import { ModalOverlay } from '@/components/ModalOverlay';
import AmountInput from '@/components/AmountInput';
import { parseCurrencyDigits } from '@/lib/formatters';

// ── Types ─────────────────────────────────────────────────────────────────────

type TxType = 'income' | 'expense';

interface QueueEntry {
  id: number;
  type: TxType;
  amount: number;
  description: string;
  bankAccountId: number;
  bankAccountLabel: string;
  categoryId: number | null;
  categoryLabel: string | null;
  categoryIcon: string | null;
  date: string;
}

interface ModalOpenOptions {
  bankAccountId?: number;
}

// ── Context ───────────────────────────────────────────────────────────────────

interface LancamentoModalCtx {
  openModal: (opts?: ModalOpenOptions) => void;
  closeModal: () => void;
}

const LancamentoModalContext = createContext<LancamentoModalCtx>({
  openModal: () => {},
  closeModal: () => {},
});

export function useLancamentoModal(): LancamentoModalCtx {
  return useContext(LancamentoModalContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function LancamentoModalProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ModalOpenOptions | null>(null);

  const openModal  = useCallback((o?: ModalOpenOptions) => setOpts(o ?? {}), []);
  const closeModal = useCallback(() => setOpts(null), []);

  return (
    <LancamentoModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {opts !== null && (
        <LancamentoModal
          defaultBankAccountId={opts.bankAccountId}
          onClose={closeModal}
        />
      )}
    </LancamentoModalContext.Provider>
  );
}

// ── CategorySelector ──────────────────────────────────────────────────────────

function CategorySelector({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
      {categories.map(cat => {
        const on = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(on ? null : cat.id)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 5,
              padding: '9px 6px', borderRadius: 11,
              border: `1.5px solid ${on ? (cat.color ?? '#0A84FF') : 'rgba(255,255,255,.08)'}`,
              background: on ? `${cat.color ?? '#0A84FF'}18` : 'var(--surface-2, #2C2C2E)',
              color: on ? (cat.color ?? '#0A84FF') : 'rgba(255,255,255,.55)',
              cursor: 'pointer', transition: 'all .12s', fontFamily: 'inherit',
            }}
          >
            {cat.icon && <span style={{ fontSize: 17, lineHeight: 1 }}>{cat.icon}</span>}
            <span style={{
              fontSize: 9, textAlign: 'center', lineHeight: 1.3,
              fontWeight: on ? 600 : 400, letterSpacing: '-0.01em',
            }}>
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── BatchQueue ────────────────────────────────────────────────────────────────

function BatchQueue({
  entries,
  onRemove,
  onConfirm,
  confirming,
}: {
  entries: QueueEntry[];
  onRemove: (id: number) => void;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const totalIn  = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const saldo    = totalIn - totalOut;
  const fmtBRL   = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (entries.length === 0) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '36px 20px', opacity: .3, gap: 8, textAlign: 'center',
    }}>
      <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Fila vazia</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', maxWidth: 200, lineHeight: 1.5 }}>
        Use "+ Outro" para enfileirar múltiplos lançamentos e salvar tudo de uma vez.
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>
          {entries.length} lançamento{entries.length !== 1 ? 's' : ''} na fila
        </span>
        <button
          onClick={onConfirm}
          disabled={confirming}
          style={{
            padding: '7px 16px', borderRadius: 9, border: 'none',
            background: confirming ? 'rgba(48,209,88,.35)' : 'var(--green, #30D158)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            cursor: confirming ? 'not-allowed' : 'pointer',
            boxShadow: '0 3px 10px rgba(48,209,88,.25)',
          }}
        >
          {confirming ? 'Salvando…' : 'Confirmar todos ✓'}
        </button>
      </div>

      {entries.map((e, i) => (
        <div
          key={e.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 13px', borderRadius: 11,
            background: 'var(--surface-1, #1C1C1E)',
            border: '1px solid rgba(255,255,255,.07)',
            animationDelay: `${i * .04}s`,
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            fontSize: 15, background: 'rgba(255,255,255,.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {e.categoryIcon ?? '📋'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {e.description || e.categoryLabel || 'Sem descrição'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>
              {e.bankAccountLabel} · {e.date.split('-').reverse().slice(0, 2).join('/')}
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
            color: e.type === 'income' ? 'var(--green, #30D158)' : 'var(--red, #FF453A)',
          }}>
            {e.type === 'income' ? '+' : '−'}{fmtBRL(e.amount)}
          </div>
          <button
            onClick={() => onRemove(e.id)}
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(255,69,58,.1)', color: 'var(--red, #FF453A)',
              fontSize: 14, border: 'none', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      ))}

      <div style={{
        background: 'var(--surface-2, #2C2C2E)',
        borderRadius: 11, padding: '11px 15px',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
      }}>
        {[
          { l: 'Entradas', v: totalIn,  c: 'var(--green, #30D158)' },
          { l: 'Saídas',   v: totalOut, c: 'var(--red, #FF453A)'   },
          { l: 'Saldo',    v: saldo,    c: saldo >= 0 ? 'var(--green, #30D158)' : 'var(--red, #FF453A)' },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 3 }}>
              {s.l}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: s.c }}>
              {fmtBRL(s.v)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LancamentoForm ────────────────────────────────────────────────────────────

let _uid = 0;

interface LancamentoFormProps {
  defaultBankAccountId?: number;
  onSaved: () => void;
  onQueued: (entry: QueueEntry) => void;
  onClose: () => void;
}

function LancamentoForm({ defaultBankAccountId, onSaved, onQueued, onClose }: LancamentoFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [type,    setType]    = useState<TxType>('expense');
  const [digits,  setDigits]  = useState('');      // raw digits, e.g. "123456"
  const [date,    setDate]    = useState(today);
  const [bankId,  setBankId]  = useState<number | null>(defaultBankAccountId ?? null);
  const [catId,   setCatId]   = useState<number | null>(null);
  const [desc,    setDesc]    = useState('');
  const [notes,   setNotes]   = useState('');

  const [banks,   setBanks]   = useState<BankAccountConfig[]>([]);
  const [cats,    setCats]    = useState<Category[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [flash,   setFlash]   = useState(false);

  const colour  = type === 'income' ? 'var(--green, #30D158)' : 'var(--red, #FF453A)';
  const parsedAmount = parseCurrencyDigits(digits);
  const ready   = parsedAmount > 0 && bankId !== null;

  const lbl: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,.38)',
    display: 'block', marginBottom: 6,
  };
  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 13px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,.1)',
    background: 'var(--surface-2, #2C2C2E)',
    color: '#fff', fontSize: 14, outline: 'none',
    transition: 'border-color .15s', fontFamily: 'inherit',
  };

  useEffect(() => {
    void Promise.all([
      api.listBankAccounts(false),
      api.listCategories('bank'),
    ]).then(([accs, cs]) => {
      setBanks(accs);
      setCats(cs.filter(c => c.parent_id === null));
      if (!defaultBankAccountId && accs.length > 0) {
        setBankId(accs[0].id);
      }
    });
  }, [defaultBankAccountId]);

  function reset() {
    setDigits(''); setCatId(null); setDesc(''); setNotes(''); setError(null);
  }

  function buildPayload(): ManualTransactionPayload | null {
    if (!ready || !bankId) return null;
    return {
      transaction_type:  type,
      amount:            parsedAmount,
      transaction_date:  date,
      description:       desc.trim() || (cats.find(c => c.id === catId)?.name ?? ''),
      bank_account_id:   bankId,
      category_id:       catId,
      notes:             notes.trim() || null,
    };
  }

  async function save(andQueue = false) {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    setError(null);
    try {
      if (andQueue) {
        const bank = banks.find(b => b.id === bankId);
        const cat  = cats.find(c => c.id === catId);
        onQueued({
          id:               ++_uid,
          type,
          amount:           payload.amount,
          description:      payload.description,
          bankAccountId:    bankId!,
          bankAccountLabel: bank?.name ?? '',
          categoryId:       catId,
          categoryLabel:    cat?.name ?? null,
          categoryIcon:     cat?.icon ?? null,
          date,
        });
        reset();
      } else {
        await api.createManualTransaction(payload);
        setFlash(true);
        setTimeout(() => { setFlash(false); onSaved(); }, 800);
        reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* TypeToggle */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'rgba(255,255,255,.05)',
        borderRadius: 13, padding: 3,
      }}>
        {([
          { id: 'expense', label: 'Saída',   c: 'var(--red, #FF453A)'   },
          { id: 'income',  label: 'Entrada', c: 'var(--green, #30D158)' },
        ] as const).map(t => {
          const on = type === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setType(t.id); setCatId(null); }}
              style={{
                flex: 1, padding: '10px', borderRadius: 10,
                fontSize: 14, fontWeight: 700, border: 'none',
                background: on ? t.c : 'transparent',
                color: on ? '#fff' : t.c,
                cursor: 'pointer', transition: 'all .15s',
                fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Valor */}
      <div>
        <label style={lbl}>Valor</label>
        <AmountInput
          value={digits}
          onChange={setDigits}
          type={type === 'income' ? 'entrada' : 'saida'}
          autoFocus
          onEnter={() => void save(false)}
        />
      </div>

      {/* Conta + Data */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>Conta bancária</label>
          <select
            value={bankId ?? ''}
            onChange={e => setBankId(Number(e.target.value))}
            style={{ ...inp, appearance: 'none', cursor: 'pointer' }}
          >
            {banks.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}{b.institution ? ` · ${b.institution}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Data</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={inp}
          />
        </div>
      </div>

      {/* Categoria */}
      {cats.length > 0 && (
        <div>
          <label style={lbl}>
            Categoria{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,.25)' }}>
              (opcional)
            </span>
          </label>
          <CategorySelector
            categories={cats}
            selected={catId}
            onSelect={setCatId}
          />
        </div>
      )}

      {/* Descrição */}
      <div>
        <label style={lbl}>Descrição</label>
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Ex: Mercado Extra, Spotify, iFood…"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void save(false); } }}
          style={inp}
        />
      </div>

      {/* Observações */}
      <div>
        <label style={lbl}>
          Observações{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,.25)' }}>
            (opcional)
          </span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Notas internas…"
          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {/* Feedback */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(255,69,58,.1)', border: '1px solid rgba(255,69,58,.25)',
          color: 'var(--red, #FF453A)', fontSize: 13,
        }}>
          {error}
        </div>
      )}
      {flash && (
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(48,209,88,.1)', border: '1px solid rgba(48,209,88,.25)',
          textAlign: 'center', color: 'var(--green, #30D158)',
          fontSize: 13, fontWeight: 600,
        }}>
          ✓ Lançamento salvo!
        </div>
      )}

      {/* Ações */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => void save(true)}
          disabled={!ready || saving}
          style={{
            flex: 1, padding: '11px', borderRadius: 11,
            border: '1px solid rgba(255,255,255,.1)',
            background: 'transparent',
            color: ready ? '#fff' : 'rgba(255,255,255,.25)',
            fontSize: 13, fontWeight: 600,
            cursor: ready ? 'pointer' : 'not-allowed',
            transition: 'all .15s', fontFamily: 'inherit',
          }}
        >
          + Outro
        </button>
        <button
          onClick={() => void save(false)}
          disabled={!ready || saving}
          style={{
            flex: 2, padding: '11px', borderRadius: 11, border: 'none',
            background: ready ? colour : 'rgba(255,255,255,.06)',
            color: ready ? '#fff' : 'rgba(255,255,255,.25)',
            fontSize: 14, fontWeight: 700,
            cursor: ready ? 'pointer' : 'not-allowed',
            transition: 'all .15s', fontFamily: 'inherit',
            boxShadow: ready
              ? `0 4px 18px ${type === 'expense' ? 'rgba(255,69,58,.25)' : 'rgba(48,209,88,.25)'}`
              : 'none',
          }}
        >
          {saving ? 'Salvando…' : 'Salvar lançamento'}
        </button>
      </div>

      {/* Atalhos de teclado */}
      <div style={{
        display: 'flex', gap: 14, flexWrap: 'wrap',
        padding: '8px 12px',
        background: 'rgba(255,255,255,.03)', borderRadius: 9,
      }}>
        {[
          { keys: ['↵'],   label: 'Salvar' },
          { keys: ['Tab'], label: 'Próximo campo' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {s.keys.map(k => (
              <kbd key={k} style={{
                background: 'var(--surface-2, #2C2C2E)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 5, padding: '2px 6px',
                fontSize: 10, fontFamily: 'var(--font-mono)',
                color: 'rgba(255,255,255,.4)', lineHeight: '16px',
              }}>
                {k}
              </kbd>
            ))}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Link de importação */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, textAlign: 'center' }}>
        <Link
          href="/upload"
          onClick={onClose}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'rgba(255,255,255,0.38)',
            textDecoration: 'none', transition: 'color .12s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.38)')}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Importar extrato ou fatura (OFX · PDF)
        </Link>
      </div>
    </div>
  );
}

// ── LancamentoModal ───────────────────────────────────────────────────────────

interface LancamentoModalProps {
  defaultBankAccountId?: number;
  onClose: () => void;
}

export function LancamentoModal({ defaultBankAccountId, onClose }: LancamentoModalProps) {
  const [queue,      setQueue]      = useState<QueueEntry[]>([]);
  const [view,       setView]       = useState<'form' | 'queue'>('form');
  const [confirming, setConfirming] = useState(false);

  async function confirmQueue() {
    setConfirming(true);
    try {
      const payloads: ManualTransactionPayload[] = queue.map(e => ({
        transaction_type: e.type,
        amount:           e.amount,
        transaction_date: e.date,
        description:      e.description,
        bank_account_id:  e.bankAccountId,
        category_id:      e.categoryId,
        notes:            null,
      }));
      await api.createManualTransactionBatch(payloads);
      setQueue([]);
      onClose();
    } catch (err) {
      console.error('Erro ao confirmar fila:', err);
    } finally {
      setConfirming(false);
    }
  }

  const queueBadge = queue.length > 0 ? (
    <button
      onClick={() => setView(v => v === 'queue' ? 'form' : 'queue')}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 11px', borderRadius: 8,
        border: '1px solid rgba(48,209,88,.3)',
        background: view === 'queue' ? 'rgba(48,209,88,.18)' : 'rgba(48,209,88,.08)',
        color: 'var(--green, #30D158)',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}
    >
      {view === 'queue' ? '← Voltar' : `Fila · ${queue.length}`}
    </button>
  ) : undefined;

  return (
    <ModalOverlay
      isOpen
      onClose={onClose}
      title="Novo lançamento"
      width={490}
      rightActions={queueBadge}
    >
      <div style={{ padding: '20px 24px 32px' }}>
        {view === 'form' ? (
          <LancamentoForm
            defaultBankAccountId={defaultBankAccountId}
            onSaved={onClose}
            onQueued={entry => setQueue(q => [entry, ...q])}
            onClose={onClose}
          />
        ) : (
          <BatchQueue
            entries={queue}
            onRemove={id => setQueue(q => q.filter(e => e.id !== id))}
            onConfirm={() => void confirmQueue()}
            confirming={confirming}
          />
        )}
      </div>
    </ModalOverlay>
  );
}
