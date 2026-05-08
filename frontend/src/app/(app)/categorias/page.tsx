'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, X, ChevronRight, Search, Tags, AlertTriangle, RefreshCw } from 'lucide-react';
import Header from '@/components/Layout/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import CategoryIcon from '@/components/CategoryIcon';
import { CategoryIconSelect } from '@/components/category-icon-select';
import { api, type Category, type CreditCardConfig } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

// ── Tipos auxiliares ──────────────────────────────────────────────────────────

type ModalState =
  | { mode: 'create-parent' }
  | { mode: 'create-sub'; parent: Category }
  | { mode: 'edit'; category: Category };

interface FormState {
  name: string;
  icon: string;
  scope: 'credit_card';
  cardId: number | 0;            // 0 = todos os cartões
  parentId: number | 0;          // 0 = nenhuma (categoria principal)
  budgetLimit: string;           // string para input controlado; vazio = sem limite
}

const INITIAL_FORM: FormState = {
  name: '', icon: 'tag', scope: 'credit_card',
  cardId: 0, parentId: 0, budgetLimit: '',
};

// ── Página ────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CreditCardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterCardId, setFilterCardId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  // Modal
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [cats, cardsList] = await Promise.all([
        api.listCategories('credit_card'),
        api.listCards(),
      ]);
      setCategories(cats);
      setCards(cardsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  // ── Derivados ─────────────────────────────────────────────────────────────

  // ── Filtros defensivos ─────────────────────────────────────────────────────
  // Importante: usar `== null` (loose) em vez de `=== null` para tratar `null` e
  // `undefined` da mesma forma. Em produção, a API pode omitir o campo quando
  // ele é null (FastAPI/Pydantic em algumas configurações), e o filtro estrito
  // descartava todas as categorias mesmo o total estando correto.
  const parents = useMemo(
    () => categories.filter(c => c.parent_id == null),
    [categories],
  );
  const subsByParent = useMemo(() => {
    const map = new Map<number, Category[]>();
    categories.filter(c => c.parent_id != null).forEach(c => {
      const list = map.get(c.parent_id as number) ?? [];
      list.push(c);
      map.set(c.parent_id as number, list);
    });
    return map;
  }, [categories]);

  const filteredParents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parents.filter(cat => {
      // Filtro por cartão: "all" mostra todas; cardId N mostra globais + do cartão N
      if (filterCardId !== 'all') {
        if (cat.card_id != null && cat.card_id !== filterCardId) return false;
      }
      if (!q) return true;
      const hit = cat.name.toLowerCase().includes(q);
      const subHit = (subsByParent.get(cat.id) ?? []).some(s => s.name.toLowerCase().includes(q));
      return hit || subHit;
    });
  }, [parents, subsByParent, filterCardId, search]);

  const summary = useMemo(() => {
    const withLimit = categories.filter(c => c.invoice_budget_limit != null).length;
    const globals = parents.filter(c => c.card_id == null).length;
    return {
      total: categories.length,
      withLimit,
      withoutLimit: categories.length - withLimit,
      globals,
    };
  }, [categories, parents]);

  const filtersActive = filterCardId !== 'all' || search.trim() !== '';
  function clearFilters() {
    setFilterCardId('all');
    setSearch('');
  }

  // ── Modal handlers ────────────────────────────────────────────────────────

  function openCreateParent() {
    setForm(INITIAL_FORM);
    setFormError(null);
    setModal({ mode: 'create-parent' });
  }
  function openCreateSub(parent: Category) {
    setForm({
      ...INITIAL_FORM,
      cardId: parent.card_id ?? 0,  // herda card da pai
      parentId: parent.id,
    });
    setFormError(null);
    setModal({ mode: 'create-sub', parent });
  }
  function openEdit(category: Category) {
    setForm({
      name: category.name,
      icon: category.icon ?? 'tag',
      scope: 'credit_card',
      cardId: category.card_id ?? 0,
      parentId: category.parent_id ?? 0,
      budgetLimit: category.invoice_budget_limit != null ? String(category.invoice_budget_limit) : '',
    });
    setFormError(null);
    setModal({ mode: 'edit', category });
  }
  function closeModal() {
    setModal(null);
    setForm(INITIAL_FORM);
    setFormError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    if (!form.name.trim()) {
      setFormError('Informe o nome da categoria.');
      return;
    }
    let limit: number | null = null;
    if (form.budgetLimit.trim() !== '') {
      const parsed = parseFloat(form.budgetLimit.replace(',', '.'));
      if (Number.isNaN(parsed) || parsed <= 0) {
        setFormError('O limite deve ser maior que zero.');
        return;
      }
      limit = parsed;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (modal.mode === 'edit') {
        const updated = await api.updateCategory(modal.category.id, {
          name: form.name.trim(),
          icon: form.icon || null,
          // 0 sentinela: limpa; >0 define
          card_id: form.cardId === 0 ? 0 : form.cardId,
          parent_id: form.parentId === 0 ? 0 : form.parentId,
          // 0 sentinela: remove; >0 define
          invoice_budget_limit: limit ?? 0,
        });
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const payload = {
          name: form.name.trim(),
          scope: 'credit_card' as const,
          icon: form.icon || null,
          card_id: form.cardId === 0 ? null : form.cardId,
          parent_id: form.parentId === 0 ? null : form.parentId,
          invoice_budget_limit: limit,
        };
        const created = await api.createCategory(payload);
        setCategories(prev => [...prev, created]);
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    const subs = subsByParent.get(category.id) ?? [];
    const msg = subs.length > 0
      ? `Excluir "${category.name}" e suas ${subs.length} subcategoria(s)?`
      : `Excluir "${category.name}"?`;
    if (!window.confirm(msg)) return;
    try {
      await api.deleteCategory(category.id);
      setCategories(prev => prev.filter(c => c.id !== category.id && c.parent_id !== category.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir categoria.');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Header title="Categorias" subtitle="Carregando suas categorias..." />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <LoadingSpinner />
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Carregando categorias...</div>
        </main>
      </>
    );
  }
  if (error) {
    return (
      <>
        <Header title="Categorias" subtitle="Erro ao carregar" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{
            width: '100%', maxWidth: 480, textAlign: 'center',
            background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 14, padding: '32px 28px', display: 'grid', gap: 12, justifyItems: 'center',
          }}>
            <span style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'rgba(245,101,101,0.10)', border: '1px solid rgba(245,101,101,0.25)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={20} color="var(--red-400)" />
            </span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Não foi possível carregar suas categorias
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {error}
            </p>
            <button onClick={() => void load()} style={{
              ...primaryButtonStyle, marginTop: 4,
            }}>
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        </main>
      </>
    );
  }

  const cardName = (id: number | null) => {
    if (id === null) return 'Todos os cartões';
    return cards.find(c => c.id === id)?.name ?? `Cartão #${id}`;
  };

  return (
    <>
      <Header
        title="Categorias"
        subtitle="Gerencie categorias, subcategorias, ícones, cartões vinculados e limites de gasto por fatura."
      />

      <main style={{ padding: 24, flex: 1, display: 'grid', gap: 18, alignContent: 'start' }}>

        {/* ── Resumo + ação primária ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
          }}>
            <SummaryCard label="Total de categorias" value={String(summary.total)} />
            <SummaryCard label="Com limite definido" value={String(summary.withLimit)} />
            <SummaryCard label="Sem limite" value={String(summary.withoutLimit)} />
            <SummaryCard label="Aplicadas a todos" value={String(summary.globals)} />
          </div>
          <button onClick={openCreateParent} style={primaryButtonStyle}>
            <Plus size={15} /> Nova categoria
          </button>
        </div>

        {/* ── Filtros ────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          padding: '10px 12px',
          borderRadius: 10,
        }}>
          <select
            value={String(filterCardId)}
            onChange={e => setFilterCardId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            style={{ ...inputStyle, padding: '7px 10px', fontSize: 12, minWidth: 200 }}
          >
            <option value="all">Todos os cartões</option>
            {cards.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
            <Search size={14} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar categoria..."
              style={{ ...inputStyle, padding: '7px 10px 7px 30px', fontSize: 12, width: '100%' }}
            />
          </div>
        </div>

        {/* ── Lista ──────────────────────────────────────────────────────── */}
        {filteredParents.length === 0 ? (
          <div style={{
            border: '1px dashed var(--border-default)',
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            color: 'var(--text-muted)',
            display: 'grid', gap: 10, justifyItems: 'center',
          }}>
            {categories.length === 0 ? (
              <>
                <Tags size={26} style={{ opacity: 0.5 }} />
                <div style={{ fontSize: 13 }}>Nenhuma categoria criada ainda.</div>
                <button onClick={openCreateParent} style={primaryButtonStyle}>
                  <Plus size={14} /> Criar primeira categoria
                </button>
              </>
            ) : filtersActive ? (
              <>
                <Search size={22} style={{ opacity: 0.5 }} />
                <div style={{ fontSize: 13 }}>Nenhuma categoria encontrada com os filtros atuais.</div>
                <button onClick={clearFilters} style={{ ...ghostButtonStyle, fontSize: 12.5 }}>
                  Limpar filtros
                </button>
              </>
            ) : (
              <>
                <AlertTriangle size={22} color="var(--amber-400)" />
                <div style={{ fontSize: 13 }}>
                  Você tem <strong>{categories.length}</strong> categoria{categories.length === 1 ? '' : 's'} cadastrada{categories.length === 1 ? '' : 's'},
                  mas nenhuma categoria principal foi encontrada para listar.
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 360 }}>
                  Isso pode indicar um problema de dados. Tente recarregar; se persistir, contate o suporte.
                </div>
                <button onClick={() => void load()} style={{ ...ghostButtonStyle, fontSize: 12.5 }}>
                  <RefreshCw size={12} /> Recarregar
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {filteredParents.map(parent => (
              <CategoryCard
                key={parent.id}
                category={parent}
                subs={subsByParent.get(parent.id) ?? []}
                cardName={cardName(parent.card_id)}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAddSub={openCreateSub}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {modal && (
        <CategoryModal
          modal={modal}
          form={form}
          setForm={setForm}
          cards={cards}
          parents={parents}
          saving={saving}
          formError={formError}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </>
  );
}

// ── Cards de categoria ────────────────────────────────────────────────────────

function CategoryCard({
  category, subs, cardName, onEdit, onDelete, onAddSub,
}: {
  category: Category;
  subs: Category[];
  cardName: string;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddSub: (c: Category) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{ padding: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'rgba(49,130,206,0.12)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <CategoryIcon icon={category.icon} size={18} color="var(--blue-400)" />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
              {category.name}
            </span>
            {category.invoice_budget_limit != null && (
              <span style={chipStyle('var(--green-400)')}>
                Limite: {formatCurrency(category.invoice_budget_limit)}
              </span>
            )}
            {subs.length > 0 && (
              <button
                onClick={() => setOpen(o => !o)}
                style={{
                  ...chipStyle('var(--text-muted)'),
                  cursor: 'pointer', border: '1px solid var(--border-subtle)', background: 'transparent',
                }}
              >
                <ChevronRight size={11} style={{
                  transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s',
                }} />
                {subs.length} subcategoria{subs.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 3 }}>
            {cardName} · Fatura de cartão de crédito
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => onAddSub(category)} style={iconButtonStyle} title="Adicionar subcategoria">
            <Plus size={13} />
          </button>
          <button onClick={() => onEdit(category)} style={iconButtonStyle} title="Editar categoria">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(category)} style={iconButtonStyle} title="Excluir categoria">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {open && subs.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '8px 14px 12px 60px',
          display: 'grid',
          gap: 6,
          background: 'rgba(255,255,255,0.015)',
        }}>
          {subs.map(sub => (
            <div key={sub.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 0',
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'rgba(49,130,206,0.10)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <CategoryIcon icon={sub.icon} size={13} color="var(--blue-400)" />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                  {sub.name}
                </span>
                {sub.invoice_budget_limit != null && (
                  <span style={{ ...chipStyle('var(--green-400)'), marginLeft: 8 }}>
                    {formatCurrency(sub.invoice_budget_limit)}
                  </span>
                )}
              </div>
              <button onClick={() => onEdit(sub)} style={iconButtonStyle} title="Editar">
                <Pencil size={11} />
              </button>
              <button onClick={() => onDelete(sub)} style={iconButtonStyle} title="Excluir">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function CategoryModal({
  modal, form, setForm, cards, parents, saving, formError, onClose, onSave,
}: {
  modal: ModalState;
  form: FormState;
  setForm: (f: FormState) => void;
  cards: CreditCardConfig[];
  parents: Category[];
  saving: boolean;
  formError: string | null;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}) {
  const isSub = modal.mode === 'create-sub' || (modal.mode === 'edit' && form.parentId !== 0);
  const fixedParent: Category | undefined =
    modal.mode === 'create-sub' ? modal.parent
    : modal.mode === 'edit' && modal.category.parent_id !== null
      ? parents.find(p => p.id === modal.category.parent_id)
      : undefined;

  const title =
    modal.mode === 'create-parent' ? 'Nova categoria'
    : modal.mode === 'create-sub' ? `Nova subcategoria em ${modal.parent.name}`
    : 'Editar categoria';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20,
      }}
    >
      <form
        onSubmit={onSave}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 14,
          padding: 22,
          width: '100%',
          maxWidth: 480,
          display: 'grid',
          gap: 12,
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h2>
          <button type="button" onClick={onClose} style={iconButtonStyle}>
            <X size={14} />
          </button>
        </div>

        {fixedParent && (
          <div style={{
            padding: '10px 12px', borderRadius: 8,
            background: 'rgba(49,130,206,0.08)',
            border: '1px solid rgba(49,130,206,0.20)',
            fontSize: 12, color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CategoryIcon icon={fixedParent.icon} size={14} color="var(--blue-400)" />
            Categoria pai: <strong>{fixedParent.name}</strong>
          </div>
        )}

        <label style={labelStyle}>
          Nome
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder={isSub ? 'Ex: Mercado' : 'Ex: Alimentação'}
            style={inputStyle}
            autoFocus
          />
        </label>

        <label style={labelStyle}>
          Ícone
          <CategoryIconSelect value={form.icon} onChange={icon => setForm({ ...form, icon })} disabled={saving} />
        </label>

        <label style={labelStyle}>
          Usar esta categoria em
          <select
            value={form.scope}
            onChange={e => setForm({ ...form, scope: e.target.value as 'credit_card' })}
            style={inputStyle}
          >
            <option value="credit_card">Fatura de cartão de crédito</option>
          </select>
        </label>

        {!fixedParent && (
          <label style={labelStyle}>
            Aplicar em
            <select
              value={String(form.cardId)}
              onChange={e => setForm({ ...form, cardId: Number(e.target.value) as number | 0 })}
              style={inputStyle}
              disabled={!!fixedParent}
            >
              <option value="0">Todos os cartões</option>
              {cards.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        )}

        <label style={labelStyle}>
          Limite de gasto por fatura {isSub && <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>}
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.budgetLimit}
            onChange={e => setForm({ ...form, budgetLimit: e.target.value })}
            placeholder="Ex: 1000.00 (deixe vazio para sem limite)"
            style={inputStyle}
          />
        </label>

        {modal.mode === 'create-parent' && (
          <label style={labelStyle}>
            Categoria pai
            <select
              value="0"
              disabled
              style={{ ...inputStyle, color: 'var(--text-muted)' }}
            >
              <option value="0">Nenhuma — categoria principal</option>
            </select>
          </label>
        )}

        {formError && (
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'rgba(245,101,101,0.10)',
            color: 'var(--red-400)', fontSize: 12,
            border: '1px solid rgba(245,101,101,0.25)',
          }}>
            {formError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" onClick={onClose} style={ghostButtonStyle}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? 'Salvando...' : (modal.mode === 'edit' ? 'Salvar alterações' : 'Salvar')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Helpers visuais ───────────────────────────────────────────────────────────

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      padding: '11px 13px',
    }}>
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 3 }}>
        {value}
      </div>
    </div>
  );
}

const chipStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  fontSize: 10.5, color, padding: '2px 7px', borderRadius: 5,
  background: 'rgba(255,255,255,0.04)',
  fontWeight: 500,
});

const labelStyle: React.CSSProperties = {
  display: 'grid', gap: 6, color: 'var(--text-muted)', fontSize: 12,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 11px', borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'var(--surface-panel)', color: 'var(--text-primary)',
  fontSize: 13, outline: 'none',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 14px', borderRadius: 8, border: 'none',
  background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
  color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
};

const ghostButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 14px', borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'transparent', color: 'var(--text-secondary)',
  fontSize: 13, cursor: 'pointer',
};

const iconButtonStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 7,
  border: '1px solid var(--border-default)',
  background: 'transparent', color: 'var(--text-muted)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};
