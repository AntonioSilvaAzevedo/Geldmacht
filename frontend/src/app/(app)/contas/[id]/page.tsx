'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CategoryChoiceSelect } from '@/components/category-choice-select';
import Header from '@/components/Layout/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TransactionList } from '@/components/TransactionList';
import { api, type BankAccountConfig, type Category, type ImportBatchListItem } from '@/lib/api';
import type { Transaction } from '@/types/financial';
import { formatDate } from '@/lib/formatters';
import { ArrowLeft, Landmark, ListFilter, Receipt, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

function formatImportedAtPt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function batchPeriodLabel(b: ImportBatchListItem): string {
  if (b.period_start && b.period_end) return `${formatDate(b.period_start)} a ${formatDate(b.period_end)}`;
  return 'Sem período no extrato';
}

export default function ContaDetalhePage() {
  const params = useParams();
  const idParam = params.id;
  const accountId = typeof idParam === 'string' ? Number(idParam) : NaN;
  const isMobile = useIsMobile();

  const [account, setAccount] = useState<BankAccountConfig | null>(null);
  const [movements, setMovements] = useState<Transaction[]>([]);
  const [importBatches, setImportBatches] = useState<ImportBatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movementFilter, setMovementFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [bankCategories, setBankCategories] = useState<Category[]>([]);
  const [recatModal, setRecatModal] = useState<{ txId: number; categoryId: number | null } | null>(null);
  const [recatSaving, setRecatSaving] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(accountId)) return;
    setLoading(true);
    setError(null);
    try {
      const [acc, txs, batches, cats] = await Promise.all([
        api.getBankAccount(accountId),
        api.getTransactions({
          bank_account_id: accountId,
          transaction_type: movementFilter === 'all' ? undefined : movementFilter,
          limit: 500,
        }) as Promise<Transaction[]>,
        api.listBankAccountImportBatches(accountId),
        api.listCategories('bank'),
      ]);
      setAccount(acc);
      setMovements(txs.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)));
      setImportBatches(batches);
      setBankCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a conta.');
      setAccount(null);
      setMovements([]);
      setImportBatches([]);
      setBankCategories([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, movementFilter]);

  useEffect(() => { void load(); }, [load]);

  const headerSubtitle = useMemo(() => {
    if (!account) return '';
    return [account.institution || 'Sem instituição', account.account_type, account.currency]
      .filter(Boolean)
      .join(' · ');
  }, [account]);

  const bankCategoryOptions = useMemo(() => {
    const byId = new Map(bankCategories.map(c => [c.id, c] as const));
    function labelFor(cat: Category): string {
      if (cat.parent_id != null) {
        const parent = byId.get(cat.parent_id);
        return parent ? `${parent.name} / ${cat.name}` : cat.name;
      }
      return cat.name;
    }
    return bankCategories.map(c => ({
      id: c.id,
      label: labelFor(c),
      icon: c.icon,
    }));
  }, [bankCategories]);

  const saveBankRecategorization = useCallback(async () => {
    if (!recatModal) return;
    setRecatSaving(true);
    try {
      await api.updateTransaction(recatModal.txId, {
        category_id: recatModal.categoryId ?? undefined,
      });
      await load();
      setRecatModal(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Não foi possível alterar a categoria.');
    } finally {
      setRecatSaving(false);
    }
  }, [recatModal, load]);

  if (!Number.isFinite(accountId)) {
    return (
      <>
        <Header title="Conta" subtitle="ID inválido" />
        <main style={{ padding: 24, flex: 1 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Volte para <Link href="/contas" style={{ color: 'var(--blue-400)' }}>contas</Link>.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        title={account?.name ?? 'Conta bancária'}
        subtitle={loading && !account ? 'Carregando…' : headerSubtitle}
      />
      <main style={{
        flex: 1,
        padding: isMobile ? '16px 14px 32px' : '24px 32px 40px',
        maxWidth: 800,
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{ marginBottom: 20 }}>
          <Link
            href="/carteira"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              marginBottom: 12,
            }}
          >
            <ArrowLeft size={14} /> Carteira
          </Link>
        </div>

        {loading && !account ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div style={{
            padding: 24,
            borderRadius: 12,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
          }}>
            <p style={{ color: 'var(--red-400)', fontSize: 14, margin: '0 0 12px' }}>{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                background: 'var(--surface-panel)',
                color: 'var(--text-primary)',
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {!account!.is_active && (
              <p style={{ fontSize: 12, color: 'var(--amber-400)', marginBottom: 14 }}>
                Esta conta está desativada — movimentações anteriores permanecem visíveis.
              </p>
            )}

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <ListFilter size={16} color="var(--text-muted)" />
                <select
                  value={movementFilter}
                  onChange={e => setMovementFilter(e.target.value as 'all' | 'income' | 'expense')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                >
                  <option value="all">Todas as movimentações</option>
                  <option value="income">Apenas entradas</option>
                  <option value="expense">Apenas saídas</option>
                </select>
                <button
                  type="button"
                  aria-label="Atualizar lista"
                  title="Atualizar"
                  onClick={() => void load()}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: '1px solid var(--border-default)',
                    background: 'var(--surface-card)',
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <Link
                href={`/upload?type=bank_statement&bankAccountId=${accountId}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Receipt size={15} /> Importar OFX
              </Link>
            </div>

            <section
              aria-labelledby="imports-heading"
              style={{
                marginBottom: 22,
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-card)',
                padding: isMobile ? '14px 12px' : '16px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: importBatches.length ? 12 : 6 }}>
                <Receipt size={16} color="var(--text-muted)" aria-hidden />
                <h2 id="imports-heading" style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Histórico de importações
                </h2>
              </div>
              {importBatches.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Nenhuma importação de extrato OFX registada nesta conta.
                </p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 14 }}>
                  {importBatches.map(b => (
                    <li
                      key={b.id}
                      style={{
                        paddingBottom: 12,
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4, wordBreak: 'break-word' }}>
                        {b.file_name}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Período: {batchPeriodLabel(b)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {b.imported_count} importados · {b.skipped_count} ignorados
                        {' · '}
                        importado em {formatImportedAtPt(b.imported_at)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {movements.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
                borderRadius: 14,
                border: '1px dashed var(--border-default)',
                background: 'var(--surface-card)',
              }}>
                <Landmark size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h2 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--text-primary)' }}>
                  Nenhuma movimentação nesta conta
                </h2>
                <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Importe um extrato OFX ou registre lançamentos manuais para ver o histórico aqui.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href={`/upload?type=bank_statement&bankAccountId=${accountId}`} style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: 'none',
                  }}>
                    Importar extrato OFX
                  </Link>
                  <Link href="/lancamentos/novo" style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}>
                    Novo lançamento
                  </Link>
                </div>
              </div>
            ) : (
              <TransactionList
                transactions={movements}
                isMobile={isMobile}
                onRecategorize={(txId) => {
                  const tx = movements.find(t => t.id === txId);
                  setRecatModal({ txId, categoryId: tx?.category_id ?? null });
                }}
              />
            )}
          </>
        )}

        {recatModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recat-bank-title"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--inset-screen)',
            }}
            onClick={e => {
              if (e.target === e.currentTarget && !recatSaving) setRecatModal(null);
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 400,
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-modal)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2
                id="recat-bank-title"
                style={{ margin: '0 0 var(--space-4)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}
              >
                Alterar categoria
              </h2>
              <CategoryChoiceSelect
                value={recatModal.categoryId}
                options={bankCategoryOptions}
                onChange={id => setRecatModal(r => (r ? { ...r, categoryId: id } : null))}
                emptyLabel="Sem categoria"
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
                <button
                  type="button"
                  disabled={recatSaving}
                  onClick={() => setRecatModal(null)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: recatSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={recatSaving}
                  onClick={() => void saveBankRecategorization()}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'var(--blue-500)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: recatSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {recatSaving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
