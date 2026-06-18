'use client';

/**
 * UploadPreview — Etapa 2.3 Passo 3
 * Exibe os lançamentos extraídos com checkboxes para seleção antes de importar.
 *
 * Este componente é o núcleo do fluxo de importação:
 *   upload → preview → selecionar → importar → dashboard
 *
 * Implementado no Passo 3 desta etapa.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { InvoiceSummaryCards } from '@/components/Upload/InvoiceSummaryCards';
import { ReviewFooter } from '@/components/Upload/ReviewFooter';
import { ReviewFilters, type Filter as TxFilter } from '@/components/Upload/ReviewFilters';
import { ReviewTransactionList } from '@/components/Upload/ReviewTransactionList';
import {
  type UploadResponse,
  type PreviewTransaction,
  type InvoiceCreate,
  type Category,
  type CreditCardConfig,
  type BankAccountConfig,
  type ImportResponse,
  type ImportKind,
  importTransactions,
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Labels amigáveis por parser ───────────────────────────────────────────────
const PARSER_LABELS: Record<string, string> = {
  nubankpf:            'Extrato Nubank PF',
  nubankpj:            'Extrato Nubank PJ',
  faturacartaonubank:  'Fatura Cartão Nubank',
  itau:                'Extrato Itaú Uniclass',
  mercadopago:         'Extrato Mercado Pago',
  bank_statement_ofx:  'Extrato bancário (OFX)',
};

interface Props {
  result: UploadResponse;
  card?: CreditCardConfig | null;
  cards?: CreditCardConfig[];
  categories?: Category[];
  uploadType?: string | null;
  /** Explicita o tipo de importação (Fase 1). Omitir no fluxo antigo só se não for cartão. */
  importKind?: ImportKind | null;
  /** Conta bancária selecionada no fluxo `?type=bank_statement`. */
  bankAccount?: BankAccountConfig | null;
  onBack: () => void;
  onImportDone: () => void;
}

export default function UploadPreview({ result, card, cards = [], categories = [], uploadType, importKind, bankAccount, onBack, onImportDone }: Props) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { transactions, parser_used, source_file, summary, statement_metadata } = result;
  const isCreditCardType = uploadType === 'credit_card';
  const isBankStatement =
    uploadType === 'bank_statement' ||
    result.import_kind === 'bank_statement' ||
    parser_used === 'bank_statement_ofx';
  const [selectedCard, setSelectedCard] = useState<CreditCardConfig | null>(card ?? null);
  const isCreditCardImport = isCreditCardType && !!selectedCard && !isBankStatement;

  // ── Metadados editáveis da fatura ────────────────────────────────────────────
  const [invoiceData, setInvoiceData] = useState<InvoiceCreate>(() => {
    const meta = result.invoice_metadata;
    return {
      due_month: meta?.due_month ?? result.detected_reference_month ?? '',
      due_date: meta?.due_date ?? null,
      cycle_start_date: meta?.cycle_start_date ?? null,
      cycle_end_date: meta?.cycle_end_date ?? null,
      issue_date: meta?.issue_date ?? null,
      closing_date: meta?.closing_date ?? null,
      total_amount: meta?.total_amount ?? null,
      source: meta?.source ?? null,
      raw_reference_month: meta?.due_month ?? result.detected_reference_month ?? null,
    };
  });

  const updateInvoice = (patch: Partial<InvoiceCreate>) =>
    setInvoiceData(prev => ({ ...prev, ...patch }));

  // ── Estado de seleção ───────────────────────────────────────────────────────
  // Transferências internas começam desmarcadas por padrão
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(
      transactions
        .map((_, i) => i)
        .filter(i => !transactions[i].is_internal_transfer)
    )
  );

  // ── Edição inline de descrição (local, antes de importar) ───────────────────
  const [descriptions, setDescriptions] = useState<Record<number, string>>(
    () => Object.fromEntries(transactions.map((tx, i) => [i, tx.description]))
  );

  // ── Edição inline de categoria ──────────────────────────────────────────────
  const [categoryIds, setCategoryIds] = useState<Record<number, number | null>>(
    () => Object.fromEntries(transactions.map((tx, i) => [i, tx.category_id ?? null]))
  );

  // ── Filtros ─────────────────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<TxFilter>('todos');
  const [search, setSearch] = useState('');

  // ── Import state ────────────────────────────────────────────────────────────
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  // ── Opções de categoria válidas para o cartão selecionado ──────────────────
  // Inclui categorias globais (card_id=null) + específicas do cartão atual.
  // Sub aparece com label hierárquico "Pai / Sub". Ordena por label.
  const categoryOptions = useMemo(() => {
    if (isBankStatement) {
      const valid = categories.filter(c => c.scope === 'bank');
      const byId = new Map(valid.map(c => [c.id, c] as const));
      return valid
        .map(c => {
          const parent = c.parent_id != null ? byId.get(c.parent_id) : null;
          const label = parent ? `${parent.name} / ${c.name}` : c.name;
          return { id: c.id, label, icon: c.icon ?? null, isSub: !!parent };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    const cardId = selectedCard?.id;
    const valid = categories.filter(c => {
      if (c.scope !== 'credit_card') return false;
      if (c.card_id == null) return true;
      return cardId != null && c.card_id === cardId;
    });
    const byId = new Map(valid.map(c => [c.id, c] as const));
    return valid
      .map(c => {
        const parent = c.parent_id != null ? byId.get(c.parent_id) : null;
        const label = parent ? `${parent.name} / ${c.name}` : c.name;
        return { id: c.id, label, icon: c.icon ?? null, isSub: !!parent };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories, selectedCard, isBankStatement]);

  useEffect(() => {
    if (isBankStatement && activeFilter === 'transferencias') setActiveFilter('todos');
  }, [isBankStatement, activeFilter]);

  // Limpa categoryIds que ficaram inválidos quando cartão / escopo de categorias muda
  useEffect(() => {
    const validIds = new Set(categoryOptions.map(o => o.id));
    setCategoryIds(prev => {
      let changed = false;
      const next: Record<number, number | null> = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (v === null || validIds.has(v)) next[Number(k)] = v;
        else { next[Number(k)] = null; changed = true; }
      });
      return changed ? next : prev;
    });
  }, [categoryOptions]);

  // ── Transações filtradas ────────────────────────────────────────────────────
  const filteredIndices = useMemo(() => {
    return transactions
      .map((tx, i) => ({ tx, i }))
      .filter(({ tx }) => {
        if (activeFilter === 'entradas' && tx.amount <= 0) return false;
        if (activeFilter === 'saidas' && tx.amount >= 0) return false;
        if (activeFilter === 'transferencias' && !tx.is_internal_transfer) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!tx.description.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .map(({ i }) => i);
  }, [transactions, activeFilter, search]);

  // ── Contagens ────────────────────────────────────────────────────────────────
  const selectedCount = selected.size;
  const filteredSelected = filteredIndices.filter(i => selected.has(i)).length;
  const filteredTotal = filteredIndices.length;
  const allFilteredSelected = filteredTotal > 0 && filteredSelected === filteredTotal;

  // ── Toggle individual ───────────────────────────────────────────────────────
  const toggle = useCallback((i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  // ── Selecionar / desmarcar todos os filtrados ───────────────────────────────
  const toggleAllFiltered = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIndices.forEach(i => next.delete(i));
      } else {
        filteredIndices.forEach(i => next.add(i));
      }
      return next;
    });
  };

  // ── Importar ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (selected.size === 0) return;
    if (!isBankStatement && isCreditCardType && !selectedCard) return;
    if (isBankStatement && !bankAccount) return;
    setImporting(true);

    const toImport: PreviewTransaction[] = Array.from(selected).map(i => {
      const tx = transactions[i];
      const isInstallment =
        tx.installment_current != null &&
        tx.installment_total != null &&
        tx.installment_total > 1;
      const isPayment = !!tx.is_payment;
      const isSystemic = isInstallment || isPayment;
      const catId = isSystemic ? null : (categoryIds[i] ?? null);
      return {
        ...tx,
        description: descriptions[i] ?? tx.description,
        raw_description: tx.raw_description ?? null,
        category_id: catId,
        category: isSystemic ? null : (categories.find(cat => cat.id === catId)?.name ?? null),
      };
    });

    try {
      const resolvedImportKind: ImportKind | undefined =
        importKind !== undefined && importKind !== null
          ? importKind
          : (isCreditCardImport ? 'credit_card_invoice' : undefined);

      const res = await importTransactions({
        source_file,
        parser_used,
        transactions: toImport,
        ...(isBankStatement && bankAccount
          ? {
              import_kind: 'bank_statement',
              bank_account_id: bankAccount.id,
              file_hash: result.file_hash ?? undefined,
              period_start: result.statement_metadata?.period_start ?? undefined,
              period_end: result.statement_metadata?.period_end ?? undefined,
              card_id: null,
              reference_month: null,
            }
          : {
              card_id: selectedCard?.id ?? null,
              reference_month: isCreditCardImport ? (invoiceData.due_month || null) : null,
              invoice: isCreditCardImport && invoiceData.due_month ? invoiceData : undefined,
              ...(resolvedImportKind ? { import_kind: resolvedImportKind } : {}),
            }),
      });
      if (isBankStatement && bankAccount) {
        router.push('/home/carteira');
        return;
      }
      setImportResult(res);
      if (isCreditCardImport && selectedCard) {
        const slug = selectedCard.institution_id != null ? String(selectedCard.institution_id) : null;
        if (slug && res.invoice_id) {
          router.push(`/home/carteira/${slug}/cartao/faturas/${res.invoice_id}`);
        } else if (slug) {
          router.push(`/home/carteira/${slug}/cartao/faturas`);
        } else {
          router.push('/home/carteira');
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao importar. Tente novamente.');
    } finally {
      setImporting(false);
    }
  };

  // ── Resultado da importação ───────────────────────────────────────────────────
  if (importResult) {
    return (
      <div style={{ padding: '48px 40px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'rgba(56,161,105,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <CheckCircle2 size={36} color="var(--green-400)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Importação concluída!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
          <strong style={{ color: 'var(--green-400)' }}>{importResult.imported}</strong> lançamentos importados
          {importResult.skipped > 0 && (
            <>, <strong style={{ color: 'var(--amber-400)' }}>{importResult.skipped}</strong> duplicatas ignoradas</>
          )}
        </p>
        {importResult.summary && (
          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <InvoiceSummaryCards summary={importResult.summary} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
          <Button type="button" variant="outline" onClick={onImportDone}>
            Importar outro arquivo
          </Button>
          <Link
            href={
              importResult.bank_account_id
                ? '/home/carteira'
                : selectedCard?.institution_id != null && importResult.invoice_id
                  ? `/home/carteira/${selectedCard.institution_id}/cartao/faturas/${importResult.invoice_id}`
                  : selectedCard?.institution_id != null
                    ? `/home/carteira/${selectedCard.institution_id}/cartao/faturas`
                    : '/home/carteira'
            }
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--primary-gradient)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {importResult.bank_account_id
              ? 'Ver movimentações da conta'
              : (importResult.card_id && (importResult.invoice_id || importResult.due_month))
                ? 'Ver fatura'
                : 'Ver no Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  // ── Render principal ────────────────────────────────────────────────────────
  return (
    <div
      className={isMobile ? 'has-mobile-actionbar' : undefined}
      style={{
        padding: isMobile ? '20px 14px 16px' : '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        ...(isMobile ? { height: 'auto' } : { flex: 1 }),
      }}
    >

      {/* Header */}
      <div style={{ marginBottom: isMobile ? 14 : 20, flexShrink: 0 }}>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mb-2 h-auto p-0"
          onClick={onBack}
        >
          <ArrowLeft className="size-3.5 shrink-0" aria-hidden /> Trocar arquivo
        </Button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Revisar lançamentos
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Badge tipo detectado */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            background: 'rgba(49,130,206,0.12)',
            border: '1px solid rgba(49,130,206,0.25)',
            color: 'var(--blue-400)',
          }}>
            🏷️ {PARSER_LABELS[parser_used] ?? parser_used}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            📄 {source_file}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            🔢 {transactions.length} lançamentos
          </span>
        </div>
      </div>

      {isCreditCardType && !isBankStatement && (
        <div style={{
          background: 'var(--surface-card)',
          border: `1px solid ${!selectedCard ? 'rgba(229,62,62,0.4)' : 'var(--border-subtle)'}`,
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 14,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Dados da fatura
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px 16px',
          }}>

            {/* Cartão — obrigatório */}
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: selectedCard ? 'var(--text-secondary)' : 'var(--red-400)' }}>
                Cartão {!selectedCard && '— obrigatório'}
              </span>
              <select
                value={selectedCard?.id ?? ''}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  setSelectedCard(cards.find(c => c.id === id) ?? null);
                }}
                style={{
                  padding: '6px 9px',
                  borderRadius: 6,
                  border: `1px solid ${!selectedCard ? 'rgba(229,62,62,0.5)' : 'var(--border-default)'}`,
                  background: 'var(--surface-panel)',
                  color: selectedCard ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 12,
                }}
              >
                <option value="">Selecione um cartão</option>
                {cards.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.institution ? ` — ${c.institution}` : ''}</option>
                ))}
              </select>
              {!selectedCard && (
                <span style={{ color: 'var(--red-400)', fontSize: 11 }}>Obrigatório para importar.</span>
              )}
            </label>

            {/* Vencimento */}
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Vencimento</span>
              <Input
                type="date"
                size="sm"
                value={invoiceData.due_date ?? ''}
                onChange={e => {
                  const v = e.target.value;
                  updateInvoice({ due_date: v || null, due_month: v ? v.slice(0, 7) : invoiceData.due_month });
                }}
              />
            </label>

            {/* Mês de pagamento */}
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Mês de pagamento</span>
              <Input
                type="month"
                size="sm"
                value={invoiceData.due_month ?? ''}
                onChange={e => updateInvoice({ due_month: e.target.value })}
              />
            </label>

            {/* Período — início */}
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Início do período</span>
              <Input
                type="date"
                size="sm"
                value={invoiceData.cycle_start_date ?? ''}
                onChange={e => updateInvoice({ cycle_start_date: e.target.value || null })}
              />
            </label>

            {/* Período — fim */}
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Fim do período</span>
              <Input
                type="date"
                size="sm"
                value={invoiceData.cycle_end_date ?? ''}
                onChange={e => updateInvoice({ cycle_end_date: e.target.value || null })}
              />
            </label>

            {/* Total da fatura */}
            <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total da fatura</span>
              <Input
                type="number"
                size="sm"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={invoiceData.total_amount ?? ''}
                onChange={e => updateInvoice({ total_amount: e.target.value ? Number(e.target.value) : null })}
              />
            </label>
          </div>

          {/* Resumo visual da fatura */}
          {selectedCard && (invoiceData.due_date || invoiceData.due_month) && (
            <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(49,130,206,0.07)', borderRadius: 7, fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {invoiceData.due_date && (
                <span>Vence em <strong style={{ color: 'var(--blue-400)' }}>{formatDate(invoiceData.due_date)}</strong></span>
              )}
              {invoiceData.cycle_start_date && invoiceData.cycle_end_date && (
                <span>Período: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(invoiceData.cycle_start_date)} a {formatDate(invoiceData.cycle_end_date)}</strong></span>
              )}
              {invoiceData.total_amount != null && (
                <span>Total: <strong style={{ color: 'var(--red-400)' }}>{formatCurrency(invoiceData.total_amount)}</strong></span>
              )}
            </div>
          )}
        </div>
      )}

      {isBankStatement && (
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 14,
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
          }}>
            Dados do extrato
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, display: 'grid', gap: 6 }}>
            {bankAccount && (
              <div><strong style={{ color: 'var(--text-primary)' }}>Conta:</strong>{' '}{bankAccount.name}{bankAccount.institution ? ` — ${bankAccount.institution}` : ''}</div>
            )}
            {statement_metadata?.institution != null && statement_metadata.institution !== '' && (
              <div><strong style={{ color: 'var(--text-primary)' }}>Instituição (arquivo):</strong>{' '}{statement_metadata.institution}</div>
            )}
            {statement_metadata?.account_id != null && statement_metadata.account_id !== '' && (
              <div><strong style={{ color: 'var(--text-primary)' }}>ID conta (OFX):</strong>{' '}{statement_metadata.account_id}</div>
            )}
            {(statement_metadata?.period_start || statement_metadata?.period_end) && (
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Período:</strong>{' '}
                {statement_metadata.period_start ? formatDate(statement_metadata.period_start) : '—'}
                {' — '}
                {statement_metadata.period_end ? formatDate(statement_metadata.period_end) : '—'}
              </div>
            )}
            {statement_metadata?.ledger_balance != null && (
              <div><strong style={{ color: 'var(--text-primary)' }}>Saldo (extrato):</strong>{' '}{formatCurrency(statement_metadata.ledger_balance)}</div>
            )}
            {(statement_metadata?.total_inflows != null || statement_metadata?.total_outflows != null) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                {statement_metadata.total_inflows != null && (
                  <span><strong style={{ color: 'var(--green-400)' }}>Entradas:</strong>{' '}{formatCurrency(statement_metadata.total_inflows)}</span>
                )}
                {statement_metadata.total_outflows != null && (
                  <span><strong style={{ color: 'var(--red-400)' }}>Saídas:</strong>{' '}{formatCurrency(statement_metadata.total_outflows)}</span>
                )}
              </div>
            )}
            <div><strong style={{ color: 'var(--text-primary)' }}>Lançamentos:</strong>{' '}{transactions.length}</div>
          </div>
        </div>
      )}

      {summary && !isBankStatement && <InvoiceSummaryCards summary={summary} />}

      {isBankStatement && categoryOptions.length === 0 && (
        <div style={{
          marginBottom: 12,
          padding: '10px 12px',
          borderRadius: 9,
          background: 'rgba(49,130,206,0.07)',
          border: '1px solid rgba(49,130,206,0.2)',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          Você ainda não tem categorias para conta bancária. Você pode importar sem categoria ou{' '}
          <Link href="/home/categorias" style={{ color: 'var(--blue-400)', fontWeight: 600 }}>criar categorias</Link>
          {' '}depois.
        </div>
      )}

      <ReviewFilters
        isBankStatement={isBankStatement}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalCount={transactions.length}
        search={search}
        onSearchChange={setSearch}
      />

      <ReviewTransactionList
        isMobile={isMobile}
        isBankStatement={isBankStatement}
        transactions={transactions}
        filteredIndices={filteredIndices}
        selected={selected}
        onToggle={toggle}
        allFilteredSelected={allFilteredSelected}
        onToggleAll={toggleAllFiltered}
        descriptions={descriptions}
        onDescriptionChange={(i, val) => setDescriptions(prev => ({ ...prev, [i]: val }))}
        categoryIds={categoryIds}
        onCategoryChange={(i, id) => setCategoryIds(prev => ({ ...prev, [i]: id }))}
        categoryOptions={categoryOptions}
      />

      <ReviewFooter
        isMobile={isMobile}
        selectedCount={selectedCount}
        filteredTotal={filteredTotal}
        transactionsTotal={transactions.length}
        isBankStatement={isBankStatement}
        isCreditCardType={isCreditCardType}
        hasBankAccount={bankAccount != null}
        hasSelectedCard={selectedCard != null}
        importing={importing}
        onBack={onBack}
        onImport={handleImport}
      />

    </div>
  );
}
