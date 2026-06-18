'use client';

import { useEffect, useState } from 'react';

import { CategoryChoiceSelect } from '@/components/category-choice-select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { FormSheet } from '@/components/ui/FormSheet';
import { Input, Select, Textarea } from '@/components/ui/input';
import { api, type BankAccountConfig, type Category } from '@/lib/api';

interface LancamentoModalProps {
  onClose: () => void;
}

export function LancamentoModal({ onClose }: LancamentoModalProps) {
  const [banks, setBanks] = useState<BankAccountConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<'income' | 'expense'>('expense');
  const [valorStr, setValorStr] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [bankId, setBankId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [descricao, setDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoadingRefs(true);
    setLoadError(null);
    void Promise.all([api.listBankAccounts(false), api.listCategories('bank')])
      .then(([b, c]) => {
        if (cancel) return;
        setBanks(b.filter((x) => x.is_active));
        setCategories(c);
      })
      .catch((err) => {
        if (!cancel) setLoadError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
      })
      .finally(() => {
        if (!cancel) setLoadingRefs(false);
      });
    return () => { cancel = true; };
  }, []);

  const categoryOptions = [...categories]
    .sort((a, b) => {
      const pa = categories.find((p) => p.id === a.parent_id);
      const pb = categories.find((p) => p.id === b.parent_id);
      const la = pa ? `${pa.name} / ${a.name}` : a.name;
      const lb = pb ? `${pb.name} / ${b.name}` : b.name;
      return la.localeCompare(lb);
    })
    .map((c) => {
      const parent = c.parent_id != null ? categories.find((p) => p.id === c.parent_id) : null;
      return {
        id: c.id,
        label: parent ? `${parent.name} / ${c.name}` : c.name,
        icon: c.icon ?? null,
        isSub: !!parent,
      };
    });

  function parseValor(): number | null {
    const t = valorStr.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const n = Number(t);
    if (Number.isNaN(n) || n <= 0) return null;
    return n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const v = parseValor();
    if (!bankId) {
      setFormError('Selecione a conta bancária.');
      return;
    }
    if (v == null) {
      setFormError('Informe um valor válido (maior que zero).');
      return;
    }
    if (!descricao.trim()) {
      setFormError('Informe a descrição.');
      return;
    }
    const amount = tipo === 'income' ? v : -v;
    setSaving(true);
    try {
      await api.createManualTransaction({
        transaction_type: tipo,
        amount,
        transaction_date: data,
        description: descricao.trim(),
        bank_account_id: bankId,
        category_id: categoryId,
        notes: observacoes.trim() || null,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormSheet
      onClose={onClose}
      title="Adicionar lançamento"
      titleId="lancamento-modal-title"
      maxWidthClass="sm:max-w-[480px]"
    >
      {loadingRefs ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : loadError ? (
        <p className="text-[13px] text-[var(--red-400)]">{loadError}</p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-3.5">
              <label className="grid gap-1.5 text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Tipo</span>
                <Select size="sm" value={tipo} onChange={(e) => setTipo(e.target.value as 'income' | 'expense')}>
                  <option value="income">Entrada</option>
                  <option value="expense">Saída</option>
                </Select>
              </label>

              <label className="grid gap-1.5 text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Valor (R$)</span>
                <Input
                  size="sm"
                  value={valorStr}
                  onChange={(e) => setValorStr(e.target.value)}
                  inputMode="decimal"
                  placeholder="0,00"
                  className="font-[family-name:var(--font-mono)] text-sm"
                />
              </label>

              <label className="grid gap-1.5 text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Data</span>
                <Input type="date" size="sm" value={data} onChange={(e) => setData(e.target.value)} />
              </label>

              <label className="grid gap-1.5 text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Conta</span>
                <Select
                  size="sm"
                  value={bankId ?? ''}
                  onChange={(e) => setBankId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Selecione…</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </label>

              <div className="grid gap-1.5 text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Categoria (opcional)</span>
                {categories.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    Nenhuma categoria de conta bancária. Crie em Categorias (aba Conta bancária).
                  </p>
                ) : (
                  <CategoryChoiceSelect
                    value={categoryId}
                    options={categoryOptions}
                    onChange={setCategoryId}
                    emptyLabel="Sem categoria"
                    maxWidth={440}
                  />
                )}
              </div>

              <label className="grid gap-1.5 text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Descrição</span>
                <Input
                  size="sm"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex.: Supermercado"
                />
              </label>

              <label className="grid gap-1.5 text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Observações (opcional)</span>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
              </label>

              {formError && <p className="text-xs text-[var(--red-400)]">{formError}</p>}

              <Button type="submit" variant="primary" loading={saving} className="mt-1.5 w-full">
                Salvar lançamento
              </Button>
            </form>
          )}
    </FormSheet>
  );
}
