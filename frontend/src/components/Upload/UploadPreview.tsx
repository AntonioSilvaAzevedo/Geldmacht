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
import { ReviewFooter } from '@/components/Upload/ReviewFooter';
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
import { cn } from '@/lib/utils';

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
  const { transactions, parser_used, source_file } = result;
  const isCreditCardType = uploadType === 'credit_card';
  const isBankStatement =
    uploadType === 'bank_statement' ||
    result.import_kind === 'bank_statement' ||
    parser_used === 'bank_statement_ofx';
  const [selectedCard, setSelectedCard] = useState<CreditCardConfig | null>(card ?? null);
  const isCreditCardImport = isCreditCardType && !!selectedCard && !isBankStatement;

  // ── Metadados editáveis da fatura ────────────────────────────────────────────
  const [invoiceData] = useState<InvoiceCreate>(() => {
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

  // ── Índices visíveis (todos os lançamentos) ─────────────────────────────────
  const allIndices = useMemo(() => transactions.map((_, i) => i), [transactions]);

  // ── Contagens ────────────────────────────────────────────────────────────────
  const selectedCount = selected.size;
  const allSelected = allIndices.length > 0 && selectedCount === allIndices.length;

  // ── Toggle individual ───────────────────────────────────────────────────────
  const toggle = useCallback((i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  // ── Selecionar / desmarcar todos ────────────────────────────────────────────
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allIndices.forEach(i => next.delete(i));
      } else {
        allIndices.forEach(i => next.add(i));
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
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        isMobile
          ? 'px-3.5 pt-5 pb-[calc(56px+env(safe-area-inset-bottom))]'
          : 'px-8 py-7',
      )}
    >
      <div className={cn('shrink-0', isMobile ? 'mb-3.5' : 'mb-5')}>
        <h1 className="text-[20px] font-bold text-[var(--text-primary)]">
          Revisar lançamentos
        </h1>
        <span className="mt-1 block truncate text-[12px] text-[var(--text-muted)]">
          {source_file}
        </span>
      </div>

      {isCreditCardType && !isBankStatement && (
        <CreditCardInvoiceForm
          selectedCard={selectedCard}
          cards={cards}
          onSelectCard={setSelectedCard}
        />
      )}

      {isBankStatement && <BankStatementInfo bankAccount={bankAccount} />}

      {isBankStatement && categoryOptions.length === 0 && (
        <div className="mb-3 rounded-[9px] border border-[rgba(49,130,206,0.2)] bg-[rgba(49,130,206,0.07)] px-3 py-2.5 text-[12.5px] leading-normal text-[var(--text-secondary)]">
          Você ainda não tem categorias para conta bancária. Você pode importar sem categoria ou{' '}
          <Link href="/home/categorias" className="font-semibold text-[var(--blue-400)]">criar categorias</Link>
          {' '}depois.
        </div>
      )}

      <ReviewTransactionList
        isMobile={isMobile}
        isBankStatement={isBankStatement}
        transactions={transactions}
        filteredIndices={allIndices}
        selected={selected}
        onToggle={toggle}
        allFilteredSelected={allSelected}
        onToggleAll={toggleAll}
        descriptions={descriptions}
        onDescriptionChange={(i, val) => setDescriptions(prev => ({ ...prev, [i]: val }))}
        categoryIds={categoryIds}
        onCategoryChange={(i, id) => setCategoryIds(prev => ({ ...prev, [i]: id }))}
        categoryOptions={categoryOptions}
      />

      <ReviewFooter
        isMobile={isMobile}
        selectedCount={selectedCount}
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
