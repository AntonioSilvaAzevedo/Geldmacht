'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CategoryChoiceSelect } from '@/components/category-choice-select';
import { api, type BankAccountConfig, type Category } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, CreditCard, FileUp, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/useIsMobile';

const cardStyle: React.CSSProperties = {
  background: 'var(--surface-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 12,
  padding: '18px 20px',
};

export default function LancamentoNovoPage() {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<'choose' | 'manual'>('choose');

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
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoadingRefs(true);
    setLoadError(null);
    void Promise.all([
      api.listBankAccounts(false),
      api.listCategories('bank'),
    ])
      .then(([b, c]) => {
        if (cancel) return;
        setBanks(b.filter(x => x.is_active));
        setCategories(c);
      })
      .catch(err => {
        if (cancel) return;
        setLoadError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
      })
      .finally(() => {
        if (!cancel) setLoadingRefs(false);
      });
    return () => { cancel = true; };
  }, []);

  const categoryOptions = [...categories]
    .sort((a, b) => {
      const pa = categories.find(p => p.id === a.parent_id);
      const pb = categories.find(p => p.id === b.parent_id);
      const la = pa ? `${pa.name} / ${a.name}` : a.name;
      const lb = pb ? `${pb.name} / ${b.name}` : b.name;
      return la.localeCompare(lb);
    })
    .map(c => {
      const parent = c.parent_id != null ? categories.find(p => p.id === c.parent_id) : null;
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
    setSuccess(null);
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
      setSuccess('Lançamento salvo com sucesso.');
      setValorStr('');
      setDescricao('');
      setObservacoes('');
      setCategoryId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (step === 'choose') {
    return (
      <>
<main style={{ padding: isMobile ? 16 : '28px 32px', flex: 1, maxWidth: 560, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full whitespace-normal hover:border-[var(--blue-500)]"
              style={{ ...cardStyle, textAlign: 'left', cursor: 'pointer' }}
              onClick={() => setStep('manual')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'rgba(49,130,206,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Landmark size={22} color="var(--blue-400)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Lançamento manual</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
                    Registrar entrada ou saída em conta bancária.
                  </div>
                </div>
              </div>
            </Button>

            <Link href="/home/upload?type=credit_card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ ...cardStyle, cursor: 'pointer', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'rgba(56,161,105,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CreditCard size={22} color="var(--green-400)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Importar fatura</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
                      Enviar PDF da fatura do cartão.
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/home/upload?type=bank_statement" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ ...cardStyle, cursor: 'pointer', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'rgba(49,130,206,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileUp size={22} color="var(--blue-400)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Importar extrato (OFX)</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
                      Vincule à sua conta bancária e revise os lançamentos antes de salvar.
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
<main style={{ padding: isMobile ? 16 : '24px 32px', flex: 1, maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-[18px] inline-flex gap-1.5 px-0 text-[var(--text-muted)] hover:bg-transparent hover:opacity-[0.85]"
          onClick={() => { setStep('choose'); setFormError(null); setSuccess(null); }}
        >
          <ArrowLeft size={15} /> Voltar
        </Button>

        {loadingRefs ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <LoadingSpinner />
          </div>
        ) : loadError ? (
          <p style={{ color: 'var(--red-400)', fontSize: 13 }}>{loadError}</p>
        ) : banks.length === 0 ? (
          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '28px 20px',
          }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Cadastre uma conta bancária antes de registrar lançamentos manuais.
            </p>
          </div>
        ) : (
          <form onSubmit={e => void handleSubmit(e)} style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 5, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Tipo</span>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as 'income' | 'expense')}
                style={{ padding: '9px 11px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              >
                <option value="income">Entrada</option>
                <option value="expense">Saída</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 5, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Valor (R$)</span>
              <Input
                size="sm"
                value={valorStr}
                onChange={e => setValorStr(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="font-[family-name:var(--font-mono)] text-sm"
              />
            </label>

            <label style={{ display: 'grid', gap: 5, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Data</span>
              <Input
                type="date"
                size="sm"
                value={data}
                onChange={e => setData(e.target.value)}
              />
            </label>

            <label style={{ display: 'grid', gap: 5, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Conta</span>
              <select
                value={bankId ?? ''}
                onChange={e => setBankId(e.target.value ? Number(e.target.value) : null)}
                style={{ padding: '9px 11px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }}
              >
                <option value="">Selecione…</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>

            <div style={{ display: 'grid', gap: 5, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Categoria (opcional)</span>
              {categories.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  Nenhuma categoria de conta bancária.{' '}
                  <Link href="/home/categorias" style={{ color: 'var(--blue-400)' }}>Criar em Categorias</Link>
                  {' '}(aba Conta bancária).
                </p>
              ) : (
                <CategoryChoiceSelect
                  value={categoryId}
                  options={categoryOptions}
                  onChange={setCategoryId}
                  emptyLabel="Sem categoria"
                  maxWidth={480}
                />
              )}
            </div>

            <label style={{ display: 'grid', gap: 5, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Descrição</span>
              <Input
                size="sm"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex.: Supermercado"
              />
            </label>

            <label style={{ display: 'grid', gap: 5, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Observações (opcional)</span>
              <Textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={2}
              />
            </label>

            {formError && <p style={{ margin: 0, fontSize: 12, color: 'var(--red-400)' }}>{formError}</p>}
            {success && <p style={{ margin: 0, fontSize: 12, color: 'var(--green-400)' }}>{success}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <Button type="submit" variant="primary" loading={saving} className="flex-1">
                Salvar lançamento
              </Button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
