'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Wallet } from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { IncomeSourceModal } from '@/components/fontesEntrada/IncomeSourceModal';
import { IncomeSourceRow } from '@/components/fontesEntrada/IncomeSourceRow';
import { api, type BankAccountConfig, type IncomeSourceConfig, type IncomeSourcePayload } from '@/lib/api';

export default function FontesEntradaPage() {
  const [sources, setSources] = useState<IncomeSourceConfig[]>([]);
  const [accounts, setAccounts] = useState<BankAccountConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<IncomeSourceConfig | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.listIncomeSources(), api.listBankAccounts(true)])
      .then(([s, a]) => {
        setSources(s);
        setAccounts(a);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar fontes de entrada.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accountNameById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  async function handleSave(payload: IncomeSourcePayload) {
    if (editing) {
      await api.updateIncomeSource(editing.id, payload);
    } else {
      await api.createIncomeSource(payload);
    }
    setEditing(null);
    setCreating(false);
    load();
  }

  async function handleDelete(source: IncomeSourceConfig) {
    if (!window.confirm(`Excluir a fonte de entrada "${source.name}"?`)) return;
    await api.deleteIncomeSource(source.id);
    load();
  }

  const showModal = creating || editing !== null;

  return (
    <main className="mx-auto w-full max-w-[760px] flex-1 px-8 py-7">
      <h1 className="mb-1 text-[20px] font-bold text-[var(--text-primary)]">Fontes de entrada</h1>
      <p className="mb-5 text-[13px] text-[var(--text-secondary)]">
        Cadastre de onde vêm suas receitas e benefícios para classificar entradas com mais precisão.
      </p>

      {loading && <LoadingSpinner />}

      {!loading && error && <p className="text-[13px] text-[var(--red-400)]">{error}</p>}

      {!loading && !error && sources.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-[var(--border-default)] px-6 py-12 text-center">
          <Wallet size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <h2 className="mb-2 text-[16px] font-semibold text-[var(--text-primary)]">Nenhuma fonte de entrada cadastrada</h2>
          <p className="mb-5 text-[13px] text-[var(--text-secondary)]">
            Cadastre salário, honorários ou benefícios para classificar suas entradas.
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-2.5">
          {sources.map((source) => (
            <IncomeSourceRow
              key={source.id}
              source={source}
              defaultAccountName={source.default_account_id ? accountNameById.get(source.default_account_id) ?? null : null}
              onEdit={setEditing}
              onDelete={(s) => void handleDelete(s)}
            />
          ))}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--border-default)] text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <Plus size={15} /> Adicionar fonte de entrada
          </button>
        </div>
      )}

      {showModal && (
        <IncomeSourceModal
          source={editing}
          accounts={accounts}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSubmit={handleSave}
        />
      )}
    </main>
  );
}
