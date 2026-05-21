'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, FileUp, Landmark, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHeader from '@/components/Layout/PageHeader';
import TypeToggle, { type TransactionTipo } from '@/components/TypeToggle';
import AmountInput from '@/components/AmountInput';
import CategorySelector, { type CategoryItem } from '@/components/CategorySelector';
import BatchQueue, { type QueueEntry } from '@/components/BatchQueue';
import { api, type BankAccountConfig, type Category } from '@/lib/api';
import { parseCurrencyDigits } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/useIsMobile';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseValorStr(digits: string): number | null {
  const n = parseCurrencyDigits(digits);
  return n > 0 ? n : null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(iso: string): string {
  const today = todayIso();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return 'Hoje';
  if (iso === yesterday) return 'Ontem';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function buildCategoryItems(categories: Category[]): CategoryItem[] {
  return categories.map(c => ({
    id:    String(c.id),
    label: c.name,
    icon:  c.icon  ?? '···',
    color: c.color ?? 'rgba(255,255,255,.3)',
  }));
}

// ── Field label ───────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
      {children}
    </span>
  );
}

// ── Choose step ───────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--surface-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 12,
  padding: '18px 20px',
};

function ChooseStep({ onManual }: { onManual: () => void }) {
  return (
    <main style={{ padding: '24px 32px', flex: 1, maxWidth: 560, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <button
          type="button"
          onClick={onManual}
          style={{ ...cardStyle, textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(10,132,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={22} color="var(--blue)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Lançamento manual</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>Registrar entrada ou saída em conta bancária.</div>
            </div>
          </div>
        </button>

        <Link href="/upload?type=credit_card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ ...cardStyle, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(48,209,88,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={22} color="var(--green)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Importar fatura</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>Enviar PDF da fatura do cartão.</div>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/upload?type=bank_statement" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ ...cardStyle, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(10,132,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileUp size={22} color="var(--blue)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Importar extrato (OFX)</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>Vincule à sua conta bancária e revise antes de salvar.</div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}

// ── Manual form ───────────────────────────────────────────────────────────────

export default function LancamentoNovoPage() {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<'choose' | 'manual'>('choose');

  // Ref data
  const [banks, setBanks]           = useState<BankAccountConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState<string | null>(null);

  // Form fields
  const [tipo,      setTipo]      = useState<TransactionTipo>('saida');
  const [valorStr,  setValorStr]  = useState('');
  const [data,      setData]      = useState(todayIso);
  const [bankId,    setBankId]    = useState<number | null>(null);
  const [catId,     setCatId]     = useState<string | null>(null);
  const [descricao, setDescricao] = useState('');

  // Queue
  const [queue,       setQueue]       = useState<QueueEntry[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [committing,  setCommitting]  = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    void Promise.all([api.listBankAccounts(false), api.listCategories('bank')])
      .then(([b, c]) => {
        if (cancel) return;
        setBanks(b.filter(x => x.is_active));
        setCategories(c);
        if (b.length > 0) setBankId(b.filter(x => x.is_active)[0]?.id ?? null);
      })
      .catch(err => { if (!cancel) setLoadError(err instanceof Error ? err.message : 'Erro.'); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, []);

  // When tipo changes, clear category (scope may differ by intent)
  const handleTipoChange = useCallback((t: TransactionTipo) => {
    setTipo(t);
    setCatId(null);
  }, []);

  const catItems: CategoryItem[] = buildCategoryItems(categories);

  function buildEntry(): { entry: QueueEntry; payload: ReturnType<typeof buildPayload> } | null {
    const amount = parseValorStr(valorStr);
    if (!bankId) { setFormError('Selecione a conta bancária.'); return null; }
    if (!amount) { setFormError('Informe um valor válido (maior que zero).'); return null; }
    if (!descricao.trim()) { setFormError('Informe a descrição.'); return null; }

    const bank    = banks.find(b => b.id === bankId)!;
    const cat     = catId ? categories.find(c => String(c.id) === catId) : null;
    const txType  = tipo === 'entrada' ? 'income' : 'expense';
    const apiAmt  = tipo === 'entrada' ? amount : -amount;

    const entry: QueueEntry = {
      id:              crypto.randomUUID(),
      tipo,
      amount,
      desc:            descricao.trim(),
      catLabel:        cat?.name ?? 'Sem categoria',
      catIcon:         cat?.icon ?? '📋',
      accLabel:        bank.name,
      dateLabel:       formatDateLabel(data),
      bankAccountId:   bankId,
      categoryId:      catId ? Number(catId) : null,
      transactionDate: data,
      transactionType: txType,
      notes:           '',
    };

    const payload = {
      transaction_type: txType as 'income' | 'expense',
      amount:           apiAmt,
      transaction_date: data,
      description:      descricao.trim(),
      bank_account_id:  bankId,
      category_id:      catId ? Number(catId) : null,
      notes:            null,
    };

    return { entry, payload };
  }

  function buildPayload(entry: QueueEntry) {
    return {
      transaction_type: entry.transactionType,
      amount:           entry.tipo === 'entrada' ? entry.amount : -entry.amount,
      transaction_date: entry.transactionDate,
      description:      entry.desc,
      bank_account_id:  entry.bankAccountId,
      category_id:      entry.categoryId,
      notes:            entry.notes || null,
    };
  }

  function resetForm() {
    setValorStr('');
    setDescricao('');
    setCatId(null);
    setFormError(null);
  }

  function handleAddToQueue() {
    setFormError(null);
    setSuccessMsg(null);
    const result = buildEntry();
    if (!result) return;
    setQueue(q => [...q, result.entry]);
    resetForm();
  }

  async function handleSaveDirect() {
    setFormError(null);
    setSuccessMsg(null);
    const result = buildEntry();
    if (!result) return;
    setSaving(true);
    try {
      await api.createManualTransaction(buildPayload(result.entry));
      setSuccessMsg('Lançamento salvo!');
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCommitAll() {
    if (!queue.length) return;
    setCommitting(true);
    setFormError(null);
    try {
      await api.createManualTransactionBatch(queue.map(buildPayload));
      setQueue([]);
      setSuccessMsg(`${queue.length} lançamento${queue.length !== 1 ? 's' : ''} confirmado${queue.length !== 1 ? 's' : ''}!`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao confirmar lote.');
    } finally {
      setCommitting(false);
    }
  }

  if (step === 'choose') {
    return (
      <>
        <PageHeader title="Novo lançamento" crumbs={[]} />
        <ChooseStep onManual={() => setStep('manual')} />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Lançamento manual" crumbs={[{ href: '/lancamentos/novo', label: 'Novo lançamento' }]} />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </main>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <PageHeader title="Lançamento manual" crumbs={[{ href: '/lancamentos/novo', label: 'Novo lançamento' }]} />
        <main style={{ padding: '24px 32px', flex: 1 }}>
          <p style={{ color: 'var(--red)', fontSize: 13 }}>{loadError}</p>
        </main>
      </>
    );
  }

  if (banks.length === 0) {
    return (
      <>
        <PageHeader title="Lançamento manual" crumbs={[{ href: '/lancamentos/novo', label: 'Novo lançamento' }]} />
        <main style={{ padding: '24px 32px', flex: 1, maxWidth: 520, margin: '0 auto', width: '100%' }}>
          <div style={{ ...cardStyle, textAlign: 'center', padding: '28px 20px' }}>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Cadastre uma conta bancária antes de registrar lançamentos.
            </p>
            <Link href="/contas" style={{ padding: '9px 18px', borderRadius: 9, background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Ir para contas
            </Link>
          </div>
        </main>
      </>
    );
  }

  const px = isMobile ? 16 : 32;

  return (
    <>
      <PageHeader
        title="Lançamento manual"
        crumbs={[{ href: '/lancamentos/novo', label: 'Novo lançamento' }]}
        px={px}
      />

      {/* Mobile queue bar */}
      {isMobile && (
        <BatchQueue
          entries={queue}
          onRemove={id => setQueue(q => q.filter(e => e.id !== id))}
          onCommit={() => void handleCommitAll()}
          committing={committing}
          variant="mobile"
        />
      )}

      <main style={{ padding: isMobile ? '20px 16px 40px' : '24px 32px 40px', flex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
          gap: isMobile ? 24 : 32,
          maxWidth: 900, margin: '0 auto',
          alignItems: 'flex-start',
        }}>

          {/* ── Form panel ── */}
          <div style={{ display: 'grid', gap: 16 }}>

            {/* TypeToggle */}
            <TypeToggle value={tipo} onChange={handleTipoChange} size={isMobile ? 'sm' : 'md'} />

            {/* Amount */}
            <div>
              <FieldLabel>Valor</FieldLabel>
              <AmountInput
                value={valorStr}
                onChange={setValorStr}
                type={tipo}
                autoFocus={!isMobile}
                onEnter={handleAddToQueue}
              />
            </div>

            {/* Date + Account */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <FieldLabel>Data</FieldLabel>
                <input
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 9, border: '1px solid rgba(255,255,255,.1)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
              <div>
                <FieldLabel>Conta</FieldLabel>
                <select
                  value={bankId ?? ''}
                  onChange={e => setBankId(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 9, border: '1px solid rgba(255,255,255,.1)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                >
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            {/* Category */}
            {catItems.length > 0 && (
              <div>
                <FieldLabel>Categoria (opcional)</FieldLabel>
                <CategorySelector
                  categories={catItems}
                  selected={catId}
                  onSelect={setCatId}
                  variant={isMobile ? 'chips' : 'grid'}
                  visibleCount={4}
                />
              </div>
            )}

            {/* Description */}
            <div>
              <FieldLabel>Descrição</FieldLabel>
              <input
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex.: Supermercado Pão de Açúcar"
                style={{ width: '100%', padding: '9px 11px', borderRadius: 9, border: '1px solid rgba(255,255,255,.1)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              />
            </div>

            {/* Errors / success */}
            {formError && (
              <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'rgba(255,69,58,.08)', borderRadius: 8, border: '1px solid rgba(255,69,58,.2)' }}>
                {formError}
              </div>
            )}
            {successMsg && (
              <div style={{ fontSize: 12, color: 'var(--green)', padding: '8px 12px', background: 'rgba(48,209,88,.08)', borderRadius: 8, border: '1px solid rgba(48,209,88,.2)' }}>
                {successMsg}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleAddToQueue}
                style={{
                  flex: 1, padding: '11px', borderRadius: 9,
                  border: '1.5px solid rgba(10,132,255,.4)',
                  background: 'rgba(10,132,255,.08)',
                  color: 'var(--blue)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                + Adicionar à fila
              </button>
              <button
                type="button"
                onClick={() => void handleSaveDirect()}
                disabled={saving}
                style={{
                  flex: 1, padding: '11px', borderRadius: 9, border: 'none',
                  background: saving ? 'rgba(10,132,255,.4)' : 'var(--blue)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer', transition: 'all .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {saving ? <><Loader2 size={15} /> Salvando…</> : 'Salvar direto →'}
              </button>
            </div>
          </div>

          {/* ── BatchQueue sidebar (web only) ── */}
          {!isMobile && (
            <div style={{ position: 'sticky', top: 24 }}>
              <BatchQueue
                entries={queue}
                onRemove={id => setQueue(q => q.filter(e => e.id !== id))}
                onCommit={() => void handleCommitAll()}
                committing={committing}
                variant="web"
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
