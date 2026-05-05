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

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckSquare, Square, ArrowLeft, Download,
  AlertTriangle, TrendingUp, TrendingDown,
  Search, Filter, Loader2, CheckCircle2,
} from 'lucide-react';
import EditableDescription from '@/components/EditableDescription';
import {
  type UploadResponse,
  type PreviewTransaction,
  type InvoiceSummary,
  importTransactions,
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';

// ── Labels amigáveis por parser ───────────────────────────────────────────────
const PARSER_LABELS: Record<string, string> = {
  nubankpf:            'Extrato Nubank PF',
  nubankpj:            'Extrato Nubank PJ',
  faturacartaonubank:  'Fatura Cartão Nubank',
  itau:                'Extrato Itaú Uniclass',
  mercadopago:         'Extrato Mercado Pago',
};

// ── Categorias disponíveis para edição inline ─────────────────────────────────
const CATEGORIES = [
  'Alimentação', 'Mercado', 'Transporte', 'Saúde', 'Lazer',
  'Educação', 'Moradia', 'Serviços', 'Vestuário', 'Assinaturas',
  'Investimentos', 'Salário', 'Freelance', 'Transferência', 'Outros',
];

type Filter = 'todos' | 'entradas' | 'saidas' | 'transferencias';

interface Props {
  result: UploadResponse;
  onBack: () => void;
  onImportDone: () => void;
}

function SummaryCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      padding: '12px 14px',
      minWidth: 0,
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 16,
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        marginTop: 4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {subtitle}
      </div>
    </div>
  );
}

function SummaryNotice({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div style={{
      background: 'rgba(56,161,105,0.12)',
      border: '1px solid rgba(56,161,105,0.25)',
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--green-400)',
          marginBottom: 4,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {description}
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--green-400)',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
    </div>
  );
}

function InvoiceSummaryCards({ summary }: { summary: InvoiceSummary }) {
  const averageExpense = summary.total_expenses > 0
    ? summary.total_invoice / summary.total_expenses
    : 0;
  const paymentAmount = summary.payment_amount ?? 0;
  const totalOtherCredits = summary.total_other_credits ?? 0;
  const totalOtherCreditsCount = summary.total_other_credits_count ?? 0;

  return (
    <>
      {paymentAmount > 0 && (
        <SummaryNotice
          label="Pagamento recebido"
          value={formatCurrency(paymentAmount)}
          description={summary.payment_description || 'Pagamento da fatura'}
        />
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 10,
        marginBottom: 14,
        flexShrink: 0,
      }}>
        <SummaryCard
          label="Total da Fatura"
          value={formatCurrency(summary.total_invoice)}
          subtitle={`${summary.total_expenses} gastos`}
          color="var(--red-400)"
        />
        {totalOtherCredits > 0 && (
          <SummaryCard
            label="Estornos / Reembolsos"
            value={formatCurrency(totalOtherCredits)}
            subtitle={`${totalOtherCreditsCount} créditos`}
            color="var(--green-400)"
          />
        )}
        <SummaryCard
          label="Maior Gasto"
          value={formatCurrency(summary.largest_expense)}
          subtitle={summary.largest_expense_description || 'Sem gastos'}
          color="var(--amber-400)"
        />
        <SummaryCard
          label="Parcelas Futuras"
          value={formatCurrency(summary.future_commitment)}
          subtitle={`${summary.total_installment_count} parceladas · média ${formatCurrency(averageExpense)}`}
          color="var(--blue-400)"
        />
      </div>
    </>
  );
}

export default function UploadPreview({ result, onBack, onImportDone }: Props) {
  const { transactions, parser_used, source_file, summary } = result;

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
  const [categories, setCategories] = useState<Record<number, string | null>>(
    () => Object.fromEntries(transactions.map((tx, i) => [i, tx.category]))
  );

  // ── Filtros ─────────────────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<Filter>('todos');
  const [search, setSearch] = useState('');

  // ── Import state ────────────────────────────────────────────────────────────
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; summary?: InvoiceSummary } | null>(null);

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
    setImporting(true);

    const toImport: PreviewTransaction[] = Array.from(selected).map(i => ({
      ...transactions[i],
      description: descriptions[i] ?? transactions[i].description,
      category:    categories[i]   ?? null,
    }));

    try {
      const res = await importTransactions({
        source_file,
        parser_used,
        transactions: toImport,
      });
      setImportResult(res);
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
          <button
            onClick={onImportDone}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Importar outro arquivo
          </button>
          <Link
            href="/"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Ver no Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Render principal ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
            marginBottom: 8,
            padding: 0,
          }}
        >
          <ArrowLeft size={14} /> Trocar arquivo
        </button>
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

      {summary && <InvoiceSummaryCards summary={summary} />}

      {/* Filtros + busca */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Chips de filtro */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['todos', 'entradas', 'saidas', 'transferencias'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: `1px solid ${activeFilter === f ? 'var(--blue-500)' : 'var(--border-default)'}`,
                background: activeFilter === f ? 'rgba(49,130,206,0.15)' : 'var(--surface-card)',
                color: activeFilter === f ? 'var(--blue-400)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: activeFilter === f ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f === 'todos' ? `Todos (${transactions.length})` : f}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 30px',
              borderRadius: 7,
              border: '1px solid var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tabela com scroll interno */}
      <div style={{ maxHeight: '60vh', overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '10px 12px', width: 40, textAlign: 'center' }}>
                <button
                  onClick={toggleAllFiltered}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: allFilteredSelected ? 'var(--blue-400)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  title={allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                >
                  {allFilteredSelected
                    ? <CheckSquare size={16} />
                    : <Square size={16} />
                  }
                </button>
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Data</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Descrição</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Categoria</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {filteredIndices.map(i => {
              const tx = transactions[i];
              const isSelected = selected.has(i);
              const isTransfer = tx.is_internal_transfer;

              return (
                <tr
                  key={i}
                  onClick={() => toggle(i)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isSelected
                      ? 'rgba(49,130,206,0.05)'
                      : isTransfer
                      ? 'rgba(255,255,255,0.01)'
                      : 'transparent',
                    cursor: 'pointer',
                    opacity: isTransfer && !isSelected ? 0.55 : 1,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? 'rgba(49,130,206,0.05)' : isTransfer ? 'rgba(255,255,255,0.01)' : 'transparent';
                  }}
                >
                  {/* Checkbox */}
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ color: isSelected ? 'var(--blue-400)' : 'var(--text-muted)' }}>
                      {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                    </span>
                  </td>

                  {/* Data */}
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {formatDate(tx.date)}
                  </td>

                  {/* Descrição */}
                  <td
                    style={{ padding: '10px 12px', color: 'var(--text-primary)', maxWidth: 300 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isTransfer && (
                        <span title="Transferência interna">
                          <AlertTriangle size={13} color="var(--amber-400)" style={{ flexShrink: 0 }} />
                        </span>
                      )}
                      <EditableDescription
                        value={descriptions[i] ?? tx.description}
                        onSave={val => setDescriptions(prev => ({ ...prev, [i]: val }))}
                      />
                    </div>
                  </td>

                  {/* Categoria (edição inline) */}
                  <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                    <select
                      value={categories[i] ?? ''}
                      onChange={e => setCategories(prev => ({ ...prev, [i]: e.target.value || null }))}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--border-default)',
                        background: 'var(--surface-card)',
                        color: categories[i] ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                        outline: 'none',
                        maxWidth: 150,
                      }}
                    >
                      <option value="">Sem categoria</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>

                  {/* Valor */}
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      {tx.amount > 0
                        ? <TrendingUp size={12} color="var(--green-400)" />
                        : <TrendingDown size={12} color="var(--red-400)" />
                      }
                      <span className={tx.amount >= 0 ? 'value-positive' : 'value-negative'}>
                        {formatCurrency(tx.amount)}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredIndices.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Filter size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
            Nenhum lançamento para este filtro.
          </div>
        )}
      </div>

      {/* Rodapé — sempre visível */}
      <div style={{
        marginTop: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: 12,
      }}>
        {/* Contador */}
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Mostrando {filteredTotal} de {transactions.length} ·{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{selectedCount}</strong> serão importados
        </span>

        {/* Ações */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {/* Cancelar */}
          <button
            onClick={onBack}
            style={{
              padding: '10px 20px',
              borderRadius: 9,
              border: '1px solid var(--border-default)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Cancelar
          </button>

          {/* Importar */}
          <button
            onClick={handleImport}
            disabled={selectedCount === 0 || importing}
            style={{
              padding: '10px 24px',
              borderRadius: 9,
              border: 'none',
              background: selectedCount === 0 ? 'var(--surface-card)' : 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
              color: selectedCount === 0 ? 'var(--text-muted)' : '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (selectedCount > 0) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {importing ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={15} />}
            {importing ? 'Importando...' : `Importar ${selectedCount} selecionados`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
