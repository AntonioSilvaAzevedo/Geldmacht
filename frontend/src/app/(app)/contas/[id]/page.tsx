'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Layout/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import CategoryIcon from '@/components/CategoryIcon';
import { api, type BankAccountConfig, type ImportBatchListItem } from '@/lib/api';
import type { Transaction } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ArrowLeft, Landmark, ListFilter, Receipt, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

function txMovementLabel(tx: Transaction): string {
  if (tx.transaction_type === 'income') return 'Entrada';
  if (tx.transaction_type === 'expense') return 'Saída';
  return tx.amount >= 0 ? 'Entrada' : 'Saída';
}

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

  const load = useCallback(async () => {
    if (!Number.isFinite(accountId)) return;
    setLoading(true);
    setError(null);
    try {
      const [acc, txs, batches] = await Promise.all([
        api.getBankAccount(accountId),
        api.getTransactions({
          bank_account_id: accountId,
          transaction_type: movementFilter === 'all' ? undefined : movementFilter,
          limit: 500,
        }) as Promise<Transaction[]>,
        api.listBankAccountImportBatches(accountId),
      ]);
      setAccount(acc);
      setMovements(txs.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)));
      setImportBatches(batches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a conta.');
      setAccount(null);
      setMovements([]);
      setImportBatches([]);
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
            href="/contas"
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
            <ArrowLeft size={14} /> Voltar para contas
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
              <div style={{
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                background: 'var(--surface-card)',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Data</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Descrição</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Tipo</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Categoria</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {formatDate(tx.date)}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-primary)', maxWidth: 260 }}>
                          {tx.description}
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: txMovementLabel(tx) === 'Entrada' ? 'var(--green-400)' : 'var(--red-400)',
                          }}>
                            {txMovementLabel(tx)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {tx.category_display_label || tx.category_name || tx.category || (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sem categoria</span>
                          )}
                          {tx.category_icon && (
                            <span style={{ marginLeft: 6, verticalAlign: 'middle', display: 'inline-flex' }}>
                              <CategoryIcon icon={tx.category_icon} size={14} />
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {tx.amount > 0
                              ? <TrendingUp size={12} color="var(--green-400)" />
                              : <TrendingDown size={12} color="var(--red-400)" />}
                            <span className={tx.amount >= 0 ? 'value-positive' : 'value-negative'}>
                              {formatCurrency(tx.amount)}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
