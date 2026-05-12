'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Layout/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  api,
  type BankAccountConfig,
  type BankAccountPayload,
  type BankAccountType,
} from '@/lib/api';
import {
  Landmark,
  Pencil,
  Plus,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/useIsMobile';

const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  checking: 'Conta corrente',
  savings: 'Conta poupança',
  payment: 'Conta pagamento',
  business: 'Conta PJ',
  investment: 'Conta investimento',
  other: 'Outra',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 9,
  border: 'none',
  background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const mutedButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 12,
  cursor: 'pointer',
};

function Badge({ inactive }: { inactive: boolean }) {
  if (!inactive) return null;
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--amber-400)',
      border: '1px solid rgba(245,158,11,0.35)',
      borderRadius: 6,
      padding: '3px 8px',
      marginLeft: 8,
    }}>
      Desativada
    </span>
  );
}

export default function ContasBancariasPage() {
  const isMobile = useIsMobile();
  const [accounts, setAccounts] = useState<BankAccountConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | { edit: BankAccountConfig } | null>(null);
  const [form, setForm] = useState<{
    name: string;
    institution: string;
    account_type: BankAccountType;
    currency: string;
  }>({
    name: '',
    institution: '',
    account_type: 'payment',
    currency: 'BRL',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listBankAccounts(true);
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeAccounts = useMemo(() => accounts.filter(a => a.is_active), [accounts]);

  function openCreate() {
    setForm({ name: '', institution: '', account_type: 'payment', currency: 'BRL' });
    setFormError(null);
    setModal('create');
  }

  function openEdit(acc: BankAccountConfig) {
    setForm({
      name: acc.name,
      institution: acc.institution ?? '',
      account_type: acc.account_type,
      currency: acc.currency || 'BRL',
    });
    setFormError(null);
    setModal({ edit: acc });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Informe o nome da conta.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: BankAccountPayload = {
        name: form.name.trim(),
        institution: form.institution.trim() || null,
        account_type: form.account_type,
        currency: form.currency || 'BRL',
      };
      if (modal === 'create') {
        const created = await api.createBankAccount(payload);
        setAccounts(prev => [...prev, created]);
      } else if (modal && typeof modal === 'object' && 'edit' in modal) {
        const updated = await api.updateBankAccount(modal.edit.id, payload);
        setAccounts(prev => prev.map(a => (a.id === updated.id ? updated : a)));
      }
      setModal(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(acc: BankAccountConfig) {
    if (!window.confirm(`Desativar a conta "${acc.name}"? Os lançamentos existentes serão mantidos.`)) return;
    try {
      await api.deactivateBankAccount(acc.id);
      setAccounts(prev =>
        prev.map(a => (a.id === acc.id ? { ...a, is_active: false } : a)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desativar.');
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Contas bancárias" subtitle="Carregando..." />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </main>
      </>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <>
        <Header title="Contas bancárias" subtitle="Erro" />
        <main style={{ padding: 24, flex: 1 }}>
          <div style={{
            maxWidth: 440, margin: '0 auto', textAlign: 'center',
            background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 14, padding: 28, display: 'grid', gap: 12, justifyItems: 'center',
          }}>
            <AlertTriangle size={22} color="var(--red-400)" />
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{error}</p>
            <button type="button" onClick={() => void load()} style={primaryButtonStyle}>
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        title="Contas bancárias"
        subtitle="Cadastro de contas, importação OFX de extrato e lançamentos manuais."
      />

      <main style={{ padding: isMobile ? '16px 14px 24px' : '24px 32px 40px', flex: 1, maxWidth: 720, margin: '0 auto', width: '100%' }}>

        <div style={{
          marginBottom: 20,
          padding: '12px 14px',
          borderRadius: 10,
          background: 'rgba(49,130,206,0.08)',
          border: '1px solid rgba(49,130,206,0.2)',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          Importe um extrato em{' '}
          <Link href="/upload?type=bank_statement" style={{ color: 'var(--blue-400)', fontWeight: 600 }}>OFX</Link>
          {' '}vinculado à conta, ou registre lançamentos em{' '}
          <Link href="/lancamentos/novo" style={{ color: 'var(--blue-400)', fontWeight: 600 }}>Novo lançamento</Link>.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
          <button type="button" onClick={openCreate} style={primaryButtonStyle}>
            <Plus size={16} /> Nova conta
          </button>
        </div>

        {accounts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--surface-card)',
            border: '1px dashed var(--border-default)',
            borderRadius: 14,
          }}>
            <Landmark size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 17, color: 'var(--text-primary)' }}>
              Nenhuma conta bancária cadastrada
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Cadastre uma conta para começar a registrar lançamentos manuais e preparar futuras importações de extratos.
            </p>
            <button type="button" onClick={openCreate} style={primaryButtonStyle}>
              <Plus size={16} /> Cadastrar conta
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {accounts.map(acc => (
              <div
                key={acc.id}
                style={{
                  background: 'var(--surface-card)',
                  border: `1px solid ${acc.is_active ? 'var(--border-subtle)' : 'rgba(245,158,11,0.25)'}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  opacity: acc.is_active ? 1 : 0.85,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                      {acc.name}
                      <Badge inactive={!acc.is_active} />
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>
                      {acc.institution || 'Instituição não informada'}
                      {' · '}
                      {ACCOUNT_TYPE_LABELS[acc.account_type]}
                      {' · '}
                      {acc.currency}
                    </div>
                    <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      <Link href={`/contas/${acc.id}`} style={{ color: 'var(--blue-400)', fontWeight: 600 }}>Ver movimentações</Link>
                      {' '}·{' '}
                      <Link href={`/upload?type=bank_statement&bankAccountId=${acc.id}`} style={{ color: 'var(--blue-400)' }}>Importar OFX</Link>
                      .
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <button type="button" onClick={() => openEdit(acc)} style={mutedButtonStyle}>
                      <Pencil size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Editar
                    </button>
                    {acc.is_active && (
                      <button
                        type="button"
                        onClick={() => void handleDeactivate(acc)}
                        style={{
                          ...mutedButtonStyle,
                          borderColor: 'rgba(245,158,11,0.4)',
                          color: 'var(--amber-400)',
                        }}
                      >
                        Desativar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeAccounts.length > 0 && (
          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            <Link href="/lancamentos/novo" style={{ color: 'var(--blue-400)' }}>Registrar lançamento manual</Link>
            {' · '}
            <Link href="/upload?type=bank_statement" style={{ color: 'var(--blue-400)' }}>Importar extrato OFX</Link>
          </p>
        )}
      </main>

      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'var(--surface-panel)',
              borderRadius: 14,
              border: '1px solid var(--border-subtle)',
              padding: '22px 20px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 17, color: 'var(--text-primary)' }}>
              {modal === 'create' ? 'Nova conta bancária' : 'Editar conta'}
            </h2>
            <form onSubmit={e => void handleSave(e)} style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Nome da conta</span>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  placeholder="Ex.: Nubank Conta"
                />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Instituição (opcional)</span>
                <input
                  value={form.institution}
                  onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  placeholder="Ex.: Nubank"
                />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Tipo</span>
                <select
                  value={form.account_type}
                  onChange={e => setForm(f => ({ ...f, account_type: e.target.value as BankAccountType }))}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                >
                  {(Object.keys(ACCOUNT_TYPE_LABELS) as BankAccountType[]).map(k => (
                    <option key={k} value={k}>{ACCOUNT_TYPE_LABELS[k]}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Moeda</span>
                <input
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  maxLength={8}
                />
              </label>
              {formError && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--red-400)' }}>{formError}</p>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setModal(null)} style={mutedButtonStyle} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" style={{ ...primaryButtonStyle, opacity: saving ? 0.7 : 1 }} disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
