'use client';

/**
 * UploadReview — Redesign da tela de revisão de lançamentos
 *
 * Destino: src/components/Upload/UploadPreview.tsx (substituição direta)
 * Protótipo: Screen - Revisar Lançamentos.html
 *
 * Props idênticas ao UploadPreview.tsx anterior — sem alterações em upload/page.tsx.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  importTransactions,
  type UploadResponse,
  type PreviewTransaction,
  type Category,
  type CreditCardConfig,
  type BankAccountConfig,
  type ImportKind,
  type InvoiceCreate,
} from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/useIsMobile';

// ─── Types ────────────────────────────────────────────────────────────────────

type TxFilter = 'todos' | 'entradas' | 'saidas' | 'transferencias';
type TxType   = 'income' | 'expense';

/** Versão local enriquecida de PreviewTransaction para o estado de revisão */
interface ReviewTx extends PreviewTransaction {
  _id:         number;
  selected:    boolean;
  editDesc:    string;
  editAmount:  number;
  editType:    TxType;
  editCatId:   number | null;
  editNote:    string;
}

interface Props {
  result:       UploadResponse;
  card?:        CreditCardConfig | null;
  cards?:       CreditCardConfig[];
  categories?:  Category[];
  uploadType?:  string | null;
  importKind?:  ImportKind | null;
  bankAccount?: BankAccountConfig | null;
  onBack:       () => void;
  onImportDone: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PARSER_LABELS: Record<string, string> = {
  nubankpf:           'Extrato Nubank PF',
  nubankpj:           'Extrato Nubank PJ',
  faturacartaonubank: 'Fatura Cartão Nubank',
  itau:               'Extrato Itaú',
  mercadopago:        'Extrato Mercado Pago',
  bank_statement_ofx: 'Extrato bancário (OFX)',
};

function fmtDate(iso: string): string {
  const d = iso.split('T')[0];
  const [, mo, dy] = d.split('-');
  return `${dy}/${mo}`;
}

function txType(t: PreviewTransaction): TxType {
  if (t.transaction_type === 'income') return 'income';
  if (t.transaction_type === 'expense') return 'expense';
  return t.amount >= 0 ? 'income' : 'expense';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TxCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onChange(); }}
      style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `1.5px solid ${checked ? 'var(--blue-400, #0A84FF)' : 'rgba(255,255,255,0.22)'}`,
        background: checked ? 'var(--blue-400, #0A84FF)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all .1s',
      }}
    >
      {checked && (
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      )}
    </div>
  );
}

function CatSelect({
  catId,
  categories,
  onChange,
}: {
  catId:      number | null;
  categories: Category[];
  onChange:   (id: number | null) => void;
}) {
  const cat = categories.find(c => c.id === catId);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
      <select
        value={catId ?? ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        style={{
          appearance: 'none',
          background: 'var(--surface-2, #2C2C2E)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: '4px 24px 4px 8px',
          fontSize: 11,
          color: cat?.color ?? 'rgba(255,255,255,0.35)',
          cursor: 'pointer',
          maxWidth: 150,
          outline: 'none',
          letterSpacing: '-0.01em',
          fontFamily: 'inherit',
        }}
      >
        <option value="">Sem categoria</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>
            {c.icon ? `${c.icon} ` : ''}{c.name}
          </option>
        ))}
      </select>
      <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: .4 }}>
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </div>
  );
}

function EditPanel({
  tx,
  categories,
  onSave,
  onCancel,
}: {
  tx:         ReviewTx;
  categories: Category[];
  onSave:     (ch: Partial<ReviewTx>) => void;
  onCancel:   () => void;
}) {
  const [desc,   setDesc]   = useState(tx.editDesc);
  const [amt,    setAmt]    = useState(String(tx.editAmount));
  const [type,   setType]   = useState<TxType>(tx.editType);
  const [catId,  setCatId]  = useState<number | null>(tx.editCatId);
  const [note,   setNote]   = useState(tx.editNote);

  const lbl: React.CSSProperties = {
    fontSize: 9, fontWeight: 600, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)',
    display: 'block', marginBottom: 5,
  };
  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 9,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'var(--surface-1, #1C1C1E)',
    color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: 'var(--surface-1, #1C1C1E)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '14px 20px 16px 52px',
        display: 'grid', gap: 12,
      }}
    >
      {/* Desc + type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <label style={lbl}>Descrição</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} style={inp}/>
        </div>
        <div>
          <label style={lbl}>Tipo</label>
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,.05)', borderRadius: 9, padding: 2 }}>
            {([['expense','Saída','var(--red-400,#FF453A)'],['income','Entrada','var(--green-400,#30D158)']] as const).map(([id,label,c]) => {
              const on = type === id;
              return (
                <button key={id} onClick={() => setType(id as TxType)} style={{
                  padding: '5px 12px', borderRadius: 7, border: 'none',
                  background: on ? c : 'transparent',
                  color: on ? '#fff' : c,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Amount + notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>Valor (R$)</label>
          <input
            value={amt}
            onChange={e => setAmt(e.target.value.replace(/[^0-9.,]/g, ''))}
            inputMode="decimal"
            style={{ ...inp, fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600 }}
          />
        </div>
        <div>
          <label style={lbl}>Observações <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,.2)' }}>(opcional)</span></label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Nota interna…" style={inp}/>
        </div>
      </div>

      {/* Category grid */}
      <div>
        <label style={lbl}>Categoria</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categories.map(c => {
            const on = catId === c.id;
            return (
              <button key={c.id} onClick={() => setCatId(on ? null : c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 18,
                border: `1.5px solid ${on ? (c.color ?? '#0A84FF') : 'rgba(255,255,255,0.09)'}`,
                background: on ? `${c.color ?? '#0A84FF'}18` : 'rgba(255,255,255,0.04)',
                color: on ? (c.color ?? '#0A84FF') : 'rgba(255,255,255,0.4)',
                fontSize: 11, fontWeight: on ? 600 : 400,
                cursor: 'pointer', transition: 'all .1s', fontFamily: 'inherit',
              }}>
                {c.icon && <span style={{ fontSize: 13, lineHeight: 1 }}>{c.icon}</span>}
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{
          padding: '7px 14px', borderRadius: 8,
          border: '1px solid rgba(255,255,255,.1)',
          background: 'transparent', color: 'rgba(255,255,255,.4)',
          fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Cancelar
        </button>
        <button onClick={() => onSave({
          editDesc: desc, editNote: note, editType: type, editCatId: catId,
          editAmount: parseFloat(amt.replace(',', '.')) || tx.editAmount,
        })} style={{
          padding: '7px 14px', borderRadius: 8, border: 'none',
          background: 'var(--blue-400, #0A84FF)', color: '#fff',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Salvar
        </button>
      </div>
    </div>
  );
}

function TxRow({
  tx,
  categories,
  expanded,
  onExpand,
  onToggle,
  onUpdate,
}: {
  tx:         ReviewTx;
  categories: Category[];
  expanded:   boolean;
  onExpand:   () => void;
  onToggle:   () => void;
  onUpdate:   (ch: Partial<ReviewTx>) => void;
}) {
  const amtColor = tx.editType === 'income'
    ? 'var(--green-400, #30D158)'
    : 'var(--red-400, #FF453A)';

  return (
    <div>
      <div
        onClick={onExpand}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 20px',
          borderBottom: expanded ? 'none' : '1px solid rgba(255,255,255,0.05)',
          background: expanded ? 'var(--surface-1, #1C1C1E)' : 'transparent',
          cursor: 'pointer', transition: 'background .1s',
          opacity: tx.selected ? 1 : 0.48,
        }}
        onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <TxCheckbox checked={tx.selected} onChange={onToggle}/>

        {/* Date */}
        <div style={{ width: 38, fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0, fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>
          {fmtDate(tx.date)}
        </div>

        {/* Type dot */}
        <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: amtColor, marginTop: 1 }}/>

        {/* Description */}
        <div style={{
          flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: tx.selected ? '#fff' : 'rgba(255,255,255,0.4)',
          letterSpacing: '-0.01em',
        }}>
          {tx.editDesc}
        </div>

        {/* Category */}
        <CatSelect catId={tx.editCatId} categories={categories} onChange={id => onUpdate({ editCatId: id })}/>

        {/* Amount */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
          color: tx.selected ? amtColor : 'rgba(255,255,255,0.25)',
          flexShrink: 0, letterSpacing: '-0.02em', minWidth: 88, textAlign: 'right',
        }}>
          {tx.editType === 'income' ? '+' : '-'}{formatCurrency(tx.editAmount)}
        </div>

        {/* Caret */}
        <div style={{ flexShrink: 0, opacity: .3, transition: 'transform .12s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>

      {expanded && (
        <EditPanel
          tx={tx}
          categories={categories}
          onSave={ch => { onUpdate(ch); onExpand(); }}
          onCancel={onExpand}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UploadPreview({
  result,
  card,
  categories = [],
  importKind,
  bankAccount,
  onBack,
  onImportDone,
}: Props) {
  const isMobile  = useIsMobile();

  const [txs, setTxs] = useState<ReviewTx[]>(() =>
    result.transactions.map((t, i) => ({
      ...t,
      _id:        i,
      selected:   !t.is_internal_transfer,
      editDesc:   t.description,
      editAmount: Math.abs(t.amount),
      editType:   txType(t),
      editCatId:  t.category_id ?? null,
      editNote:   '',
    }))
  );

  const [filter,     setFilter]     = useState<TxFilter>('todos');
  const [search,     setSearch]     = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statsOpen,  setStatsOpen]  = useState(false);
  const [importing,  setImporting]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────
  const filtered = useMemo(() => txs.filter(t => {
    if (filter === 'entradas'      && t.editType !== 'income')  return false;
    if (filter === 'saidas'        && t.editType !== 'expense') return false;
    if (filter === 'transferencias' && !t.is_internal_transfer) return false;
    if (search && !t.editDesc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [txs, filter, search]);

  const selectedCount = txs.filter(t => t.selected).length;
  const allFilteredSelected = filtered.length > 0 && filtered.every(t => t.selected);
  const totIn  = txs.reduce((s, t) => t.amount >= 0 ? s + Math.abs(t.amount) : s, 0);
  const totOut = txs.reduce((s, t) => t.amount < 0  ? s + Math.abs(t.amount) : s, 0);

  const parserLabel = PARSER_LABELS[result.parser_used] ?? result.parser_used;
  const meta = result.statement_metadata;
  const smPeriod = meta?.period_start && meta?.period_end
    ? `${meta.period_start.slice(0, 10).split('-').reverse().join('/')} — ${meta.period_end.slice(0, 10).split('-').reverse().join('/')}`
    : null;

  // ── Actions ────────────────────────────────────────────────────
  const toggleAll = useCallback(() => {
    const ids = new Set(filtered.map(t => t._id));
    const nv  = !allFilteredSelected;
    setTxs(p => p.map(t => ids.has(t._id) ? { ...t, selected: nv } : t));
  }, [filtered, allFilteredSelected]);

  const toggleTx = useCallback((id: number) => {
    setTxs(p => p.map(t => t._id === id ? { ...t, selected: !t.selected } : t));
  }, []);

  const updateTx = useCallback((id: number, ch: Partial<ReviewTx>) => {
    setTxs(p => p.map(t => t._id === id ? { ...t, ...ch } : t));
  }, []);

  const deselectTransfers = useCallback(() => {
    setTxs(p => p.map(t => t.is_internal_transfer ? { ...t, selected: false } : t));
  }, []);

  const handleConfirm = useCallback(async () => {
    const selected = txs.filter(t => t.selected);
    if (!selected.length) return;
    setImporting(true);
    setError(null);
    try {
      // Monta metadados da fatura a partir do resultado do upload (quando disponível)
      const meta = result.invoice_metadata;
      const invoiceMeta: InvoiceCreate | null =
        meta && meta.due_month
          ? {
              due_month:        meta.due_month,
              due_date:         meta.due_date ?? null,
              cycle_start_date: meta.cycle_start_date ?? null,
              cycle_end_date:   meta.cycle_end_date ?? null,
              issue_date:       meta.issue_date ?? null,
              closing_date:     meta.closing_date ?? null,
              total_amount:     meta.total_amount ?? null,
              source:           meta.source ?? 'nubank_pdf',
              raw_reference_month: meta.due_month,
            }
          : null;

      const payload = {
        source_file:      result.source_file,
        parser_used:      result.parser_used,
        import_kind:      importKind ?? result.import_kind ?? null,
        card_id:          card?.id ?? null,
        bank_account_id:  bankAccount?.id ?? null,
        file_hash:        result.file_hash ?? null,
        reference_month:  result.detected_reference_month ?? result.invoice_metadata?.due_month ?? null,
        invoice:          invoiceMeta,
        transactions:    selected.map(t => ({
          ...t,
          description:      t.editDesc,
          amount:           t.editType === 'income' ? t.editAmount : -t.editAmount,
          transaction_type: t.editType === 'income' ? 'income' : 'expense',
          category_id:      t.editCatId,
        })),
      };
      await importTransactions(payload as never);
      onImportDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao importar. Tente novamente.');
    } finally {
      setImporting(false);
    }
  }, [txs, result, importKind, card, bankAccount, onImportDone]);

  // ── Styles helpers ─────────────────────────────────────────────
  const lbl9: React.CSSProperties = {
    fontSize: 9, fontWeight: 600, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
  };

  const filterTabs: { id: TxFilter; label: string }[] = [
    { id: 'todos',          label: `Todos (${txs.length})` },
    { id: 'entradas',       label: `Entradas (${txs.filter(t => t.editType === 'income').length})` },
    { id: 'saidas',         label: `Saídas (${txs.filter(t => t.editType === 'expense').length})` },
    { id: 'transferencias', label: `Transferências (${txs.filter(t => t.is_internal_transfer).length})` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#000' }}>

      {/* ══ HEADER ═══════════════════════════════════════════════ */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '12px 16px 10px' : '14px 28px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ minWidth: 0 }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: 'var(--blue-400, #0A84FF)', fontSize: 13,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 6,
            fontFamily: 'inherit',
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Voltar
          </button>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: '-0.022em', marginBottom: 4 }}>
            Revisar lançamentos
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.25)',
              borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600,
              color: 'var(--blue-400, #0A84FF)',
            }}>
              {parserLabel}
            </span>
            {!isMobile && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                {result.source_file}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {txs.length} lançamentos
            </span>
          </div>
        </div>

        {!isMobile && (
          <button onClick={() => void handleConfirm()} disabled={importing || selectedCount === 0}
            style={{
              flexShrink: 0, padding: '10px 20px', borderRadius: 10, border: 'none',
              background: selectedCount > 0 && !importing ? 'var(--blue-400, #0A84FF)' : 'rgba(255,255,255,0.06)',
              color: selectedCount > 0 && !importing ? '#fff' : 'rgba(255,255,255,0.25)',
              fontSize: 14, fontWeight: 700, cursor: selectedCount > 0 && !importing ? 'pointer' : 'not-allowed',
              transition: 'all .15s', fontFamily: 'inherit',
              boxShadow: selectedCount > 0 && !importing ? '0 4px 16px rgba(10,132,255,0.3)' : 'none',
            }}
          >
            {importing ? 'Importando…' : `Confirmar ${selectedCount} selecionados`}
          </button>
        )}
      </div>

      {/* ══ STATS BAR (colapsável) ════════════════════════════════ */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#000' }}>
        <button onClick={() => setStatsOpen(v => !v)} style={{
          width: '100%', padding: isMobile ? '8px 16px' : '9px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={lbl9}>EXTRATO</span>
            {meta?.institution && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{meta.institution}</span>}
            {smPeriod && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{smPeriod}</span>}
            <span style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--green-400,#30D158)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(totIn)}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>↑</span>
              <span style={{ color: 'var(--red-400,#FF453A)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(totOut)}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>↓</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.35)', fontSize: 11, flexShrink: 0 }}>
            {statsOpen ? 'Ocultar' : 'Detalhes'}
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: statsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </button>

        {statsOpen && (
          <div style={{ padding: '4px 28px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px 24px' }}>
            {[
              meta?.institution  && ['Instituição', meta.institution],
              meta?.account_id   && ['ID conta', meta.account_id],
              smPeriod           && ['Período', smPeriod],
              bankAccount?.name  && ['Conta destino', bankAccount.name],
              card?.name         && ['Cartão', card.name],
              ['Lançamentos', String(txs.length)],
            ].filter((x): x is string[] => Boolean(x)).map(([k, v]) => (
              <div key={String(k)}>
                <div style={{ ...lbl9, marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ ERROR BANNER ══════════════════════════════════════════ */}
      {error && (
        <div style={{
          flexShrink: 0, padding: '10px 28px',
          background: 'rgba(255,69,58,0.1)', borderBottom: '1px solid rgba(255,69,58,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: 'var(--red-400,#FF453A)' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* ══ FILTER + SEARCH ══════════════════════════════════════ */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '8px 16px' : '10px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: '#000', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 3, background: 'var(--surface-2,#2C2C2E)', borderRadius: 9, padding: 3 }}>
          {filterTabs.map(tab => {
            const on = filter === tab.id;
            return (
              <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
                padding: '5px 11px', borderRadius: 7, border: 'none',
                background: on ? '#000' : 'transparent',
                color: on ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 11, fontWeight: on ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .1s',
                boxShadow: on ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                fontFamily: 'inherit',
              }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, maxWidth: 340, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: .4 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por descrição…"
            style={{
              width: '100%', paddingLeft: 30, paddingRight: search ? 28 : 10,
              paddingTop: 7, paddingBottom: 7, borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'var(--surface-1,#1C1C1E)', color: '#fff',
              fontSize: 12, outline: 'none', fontFamily: 'inherit',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
          )}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
          {selectedCount} de {txs.length} selecionados
        </div>
      </div>

      {/* ══ COLUMN HEADER ════════════════════════════════════════ */}
      {!isMobile && (
        <div style={{
          flexShrink: 0, padding: '7px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'var(--surface-1,#1C1C1E)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <TxCheckbox checked={allFilteredSelected} onChange={toggleAll}/>
          <div style={{ width: 38 }}><span style={lbl9}>Data</span></div>
          <div style={{ width: 6 }}/>
          <div style={{ flex: 1 }}><span style={lbl9}>Descrição</span></div>
          <div style={{ width: 150 }}><span style={lbl9}>Categoria</span></div>
          <div style={{ width: 88, textAlign: 'right' }}><span style={lbl9}>Valor</span></div>
          <div style={{ width: 20 }}/>
        </div>
      )}

      {/* ══ TRANSACTION LIST (scroll aqui) ═══════════════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#000' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, opacity: .3, gap: 8 }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <span style={{ fontSize: 13 }}>Nenhum lançamento encontrado</span>
          </div>
        ) : (
          filtered.map(tx => (
            <TxRow
              key={tx._id}
              tx={tx}
              categories={categories}
              expanded={expandedId === tx._id}
              onExpand={() => setExpandedId(expandedId === tx._id ? null : tx._id)}
              onToggle={() => toggleTx(tx._id)}
              onUpdate={ch => updateTx(tx._id, ch)}
            />
          ))
        )}
        <div style={{ height: 40 }}/>
      </div>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '10px 16px' : '10px 28px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            {selectedCount} selecionados · {txs.length - selectedCount} ignorados
          </span>
          <button onClick={deselectTransfers} style={{
            background: 'none', border: 'none',
            color: 'var(--blue-400,#0A84FF)', fontSize: 12, cursor: 'pointer',
            padding: 0, fontFamily: 'inherit',
          }}>
            Desmarcar transferências internas
          </button>
        </div>

        <button
          onClick={() => void handleConfirm()}
          disabled={importing || selectedCount === 0}
          style={{
            flexShrink: 0, padding: '9px 18px', borderRadius: 9, border: 'none',
            background: selectedCount > 0 && !importing ? 'var(--blue-400,#0A84FF)' : 'rgba(255,255,255,0.06)',
            color: selectedCount > 0 && !importing ? '#fff' : 'rgba(255,255,255,0.25)',
            fontSize: 13, fontWeight: 700, cursor: selectedCount > 0 && !importing ? 'pointer' : 'not-allowed',
            transition: 'all .15s', fontFamily: 'inherit',
          }}
        >
          {importing ? 'Importando…' : `Confirmar ${selectedCount} selecionados →`}
        </button>
      </div>
    </div>
  );
}
