'use client';

import { useCallback, useEffect, useState } from 'react';
import { Landmark, Plus } from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { ContaRow } from '@/components/contas/ContaRow';
import { EditBankAccountModal } from '@/components/contas/EditBankAccountModal';
import { BankAccountModal, type BankAccountModalData } from '@/components/carteira/BankAccountModal';
import { ensureInstitutionId } from '@/lib/carteira/ensure-institution';
import { api, type BankAccountConfig, type BankAccountPayload } from '@/lib/api';

export default function ContasPage() {
  const [accounts, setAccounts] = useState<BankAccountConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BankAccountConfig | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .listBankAccounts(true)
      .then(setAccounts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar contas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(payload: BankAccountModalData) {
    const institutionId = payload.institution ? await ensureInstitutionId(payload.institution) : null;
    await api.createBankAccount({ ...payload, institution_id: institutionId ?? undefined, currency: 'BRL', is_active: true });
    setCreating(false);
    load();
  }

  async function handleUpdate(payload: Partial<BankAccountPayload>) {
    if (!editing) return;
    await api.updateBankAccount(editing.id, payload);
    setEditing(null);
    load();
  }

  return (
    <main className="mx-auto w-full max-w-[760px] flex-1 px-8 py-7">
      <h1 className="mb-1 text-[20px] font-bold text-[var(--text-primary)]">Contas</h1>
      <p className="mb-5 text-[13px] text-[var(--text-secondary)]">
        Gerencie as contas financeiras da sua carteira: tipo, conta principal e status.
      </p>

      {loading && <LoadingSpinner />}

      {!loading && error && <p className="text-[13px] text-[var(--red-400)]">{error}</p>}

      {!loading && !error && accounts.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-[var(--border-default)] px-6 py-12 text-center">
          <Landmark size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <h2 className="mb-2 text-[16px] font-semibold text-[var(--text-primary)]">Nenhuma conta cadastrada</h2>
          <p className="mb-5 text-[13px] text-[var(--text-secondary)]">
            Cadastre uma conta para vincular lançamentos e extratos.
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-2.5">
          {accounts.map((account) => (
            <ContaRow key={account.id} account={account} onEdit={setEditing} />
          ))}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--border-default)] text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <Plus size={15} /> Adicionar conta
          </button>
        </div>
      )}

      {editing && (
        <EditBankAccountModal account={editing} onClose={() => setEditing(null)} onSubmit={handleUpdate} />
      )}
      {creating && (
        <BankAccountModal onClose={() => setCreating(false)} onSubmit={handleCreate} />
      )}
    </main>
  );
}
