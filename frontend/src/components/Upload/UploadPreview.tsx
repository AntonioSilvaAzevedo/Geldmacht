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
import { ArrowLeft } from 'lucide-react';
import { InvoiceSummaryCards } from '@/components/Upload/InvoiceSummaryCards';
import { ReviewFooter } from '@/components/Upload/ReviewFooter';
import { ReviewFilters, type Filter as TxFilter } from '@/components/Upload/ReviewFilters';
import { ReviewTransactionList } from '@/components/Upload/ReviewTransactionList';
import { ImportResultView } from '@/components/Upload/ImportResultView';
import { CreditCardInvoiceForm } from '@/components/Upload/CreditCardInvoiceForm';
import { BankStatementInfo } from '@/components/Upload/BankStatementInfo';
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
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button } from '@/components/ui/button';

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

  if (importResult) {
    return (
      <ImportResultView
        importResult={importResult}
        selectedCard={selectedCard}
        onImportDone={onImportDone}
      />
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
        <CreditCardInvoiceForm
          isMobile={isMobile}
          selectedCard={selectedCard}
          cards={cards}
          onSelectCard={setSelectedCard}
          invoiceData={invoiceData}
          onUpdateInvoice={updateInvoice}
        />
      )}

      {isBankStatement && (
        <BankStatementInfo
          bankAccount={bankAccount}
          statementMetadata={statement_metadata}
          transactionsCount={transactions.length}
        />
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
