'use client';

import { useEffect, useState } from 'react';

import { CategoryChoiceSelect } from '@/components/category-choice-select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { FormSheet } from '@/components/ui/FormSheet';
import { Input, Select, Textarea } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { api } from '@/lib/api';
import { useLancamentoModalData } from '@/components/Lancamento/useLancamentoModalData';

interface LancamentoModalProps {
  onClose: () => void;
}

export function LancamentoModal({ onClose }: LancamentoModalProps) {
  const [tipo, setTipo] = useState<'income' | 'expense'>('expense');
  const [valorStr, setValorStr] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [bankId, setBankId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [incomeSourceId, setIncomeSourceId] = useState<number | null>(null);
  const [isReserveOrInvestment, setIsReserveOrInvestment] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [affectsSummary, setAffectsSummary] = useState(true);

  const { banks, categories, incomeSources, loadingRefs, loadError, monthStatus } =
    useLancamentoModalData(bankId, data);

  useEffect(() => {
    setAffectsSummary(true);
  }, [bankId, data]);

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
        affects_summary: affectsSummary,
        income_source_id: tipo === 'income' ? incomeSourceId : null,
        is_reserve_or_investment: isReserveOrInvestment,
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

              {monthStatus?.needs_impact_confirmation && (
                <div className="grid gap-1.5 text-xs">
                  <span className="font-semibold text-[var(--text-secondary)]">
                    Este mês já tem extrato importado nesta conta. Afeta o saldo e o resumo do mês?
                  </span>
                  <SegmentedControl
                    tabs={['Sim', 'Não']}
                    active={affectsSummary ? 'Sim' : 'Não'}
                    onChange={(tab) => setAffectsSummary(tab === 'Sim')}
                    size="sm"
                  />
                </div>
              )}

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

              {tipo === 'income' && incomeSources.length > 0 && (
                <label className="grid gap-1.5 text-xs">
                  <span className="font-semibold text-[var(--text-secondary)]">Fonte de entrada (opcional)</span>
                  <Select
                    size="sm"
                    value={incomeSourceId ?? ''}
                    onChange={(e) => setIncomeSourceId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Sem fonte de entrada</option>
                    {incomeSources.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </label>
              )}

              <label className="flex cursor-pointer items-center gap-2.5 text-xs">
                <input
                  type="checkbox"
                  checked={isReserveOrInvestment}
                  onChange={(e) => setIsReserveOrInvestment(e.target.checked)}
                  className="size-4 shrink-0 accent-[var(--blue-400)]"
                />
                <span className="text-[var(--text-primary)]">
                  Aporte ou resgate de reserva/investimento (não conta como receita/despesa)
                </span>
              </label>

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
