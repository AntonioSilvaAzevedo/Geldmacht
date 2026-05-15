'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, X, ChevronRight, Search, Tags, AlertTriangle, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api, type Category, type CreditCardConfig, type CategoryPayload, type CategoryUpdatePayload } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/useIsMobile';

// ─── Color palette ─────────────────────────────────────────────────────────────
const PALETTE = ['#FF9F0A','#0A84FF','#BF5AF2','#30D158','#FF453A','#5AC8FA','#5E5CE6','#FF6B00','#34C759','#FF375F'];
const ICONS   = ['🍽️','🛍️','📱','💊','🚗','🎮','🏠','💼','🤝','📈','✈️','🎓','📋','🛒','☕','🎬','💻','⚡','🔑','🏥','🎵','🎨','🐾','👶','🌍'];

function resolveColor(cat: Category, idx: number): string {
  return cat.color ?? PALETTE[idx % PALETTE.length];
}

type Scope = 'credit_card' | 'bank';
type FormMode = null | 'new-parent' | 'new-sub' | 'edit';

interface FormState {
  name: string;
  icon: string;
  color: string;
  scope: Scope;
  cardId: number | null;
  parentId: number | null;
  budgetLimit: string;
}

const EMPTY_FORM: FormState = {
  name: '', icon: '📁', color: PALETTE[0], scope: 'credit_card',
  cardId: null, parentId: null, budgetLimit: '',
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
  const [domain, setDomain] = useState<'credit_card' | 'bank'>('credit_card');

  // Modal
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, cardsList] = await Promise.all([
        api.listCategories(domain),
        domain === 'credit_card' ? api.listCards() : Promise.resolve<CreditCardConfig[]>([]),
      ]);
      setCategories(cats);
      setCards(cardsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => { void load(); }, [load]);

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
      if (domain === 'credit_card') {
        if (filterCardId !== 'all') {
          if (cat.card_id != null && cat.card_id !== filterCardId) return false;
        }
      }
      if (!q) return true;
      const hit = cat.name.toLowerCase().includes(q);
      const subHit = (subsByParent.get(cat.id) ?? []).some(s => s.name.toLowerCase().includes(q));
      return hit || subHit;
    });
  }, [parents, subsByParent, filterCardId, search, domain]);

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
    setForm({ ...INITIAL_FORM, scope: domain });
    setFormError(null);
    setModal({ mode: 'create-parent' });
  }
  function openCreateSub(parent: Category) {
    setForm({
      ...INITIAL_FORM,
      scope: parent.scope,
      cardId: parent.scope === 'bank' ? 0 : (parent.card_id ?? 0),
      parentId: parent.id,
    });
    setFormError(null);
    setModal({ mode: 'create-sub', parent });
  }
  function openEdit(category: Category) {
    setForm({
      name: category.name,
      icon: category.icon ?? 'tag',
      scope: category.scope,
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
    let limit: number | null | undefined = undefined;
    if (form.scope === 'credit_card') {
      limit = null;
      if (form.budgetLimit.trim() !== '') {
        const parsed = parseFloat(form.budgetLimit.replace(',', '.'));
        if (Number.isNaN(parsed) || parsed <= 0) {
          setFormError('O limite deve ser maior que zero.');
          return;
        }
        limit = parsed;
      }
    }

    setSaving(true);
    setFormError(null);
    try {
      if (modal.mode === 'edit') {
        const patch: Parameters<typeof api.updateCategory>[1] = {
          name: form.name.trim(),
          icon: form.icon || null,
        };
        if (form.scope === 'credit_card') {
          patch.card_id = form.cardId === 0 ? 0 : form.cardId;
          patch.parent_id = form.parentId === 0 ? 0 : form.parentId;
          patch.invoice_budget_limit = limit ?? 0;
        }
        const updated = await api.updateCategory(modal.category.id, patch);
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const payload = {
          name: form.name.trim(),
          scope: form.scope,
          icon: form.icon || null,
          card_id: form.scope === 'bank' ? undefined : (form.cardId === 0 ? null : form.cardId),
          parent_id: form.parentId === 0 ? null : form.parentId,
          invoice_budget_limit: form.scope === 'credit_card' ? limit ?? null : undefined,
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

<main style={{ padding: 24, flex: 1, display: 'grid', gap: 18, alignContent: 'start' }}>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['credit_card', 'bank'] as const).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => { setDomain(d); setFilterCardId('all'); }}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: `1px solid ${domain === d ? 'var(--blue-500)' : 'var(--border-default)'}`,
                background: domain === d ? 'rgba(49,130,206,0.15)' : 'var(--surface-card)',
                color: domain === d ? 'var(--blue-400)' : 'var(--text-secondary)',
                fontSize: 12.5,
                fontWeight: domain === d ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {d === 'credit_card' ? 'Cartão de crédito' : 'Conta bancária'}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
          }}>
            <SummaryCard label="Total de categorias" value={String(summary.total)} />
            {domain === 'credit_card' ? (
              <>
                <SummaryCard label="Com limite definido" value={String(summary.withLimit)} />
                <SummaryCard label="Sem limite" value={String(summary.withoutLimit)} />
                <SummaryCard label="Aplicadas a todos" value={String(summary.globals)} />
              </>
            ) : (
              <SummaryCard label="Uso" value="Manual / extrato futuro" />
            )}
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
          {domain === 'credit_card' && (
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
          )}

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
                domain={domain}
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

// ─── Category Card ─────────────────────────────────────────────────────────────
function CategoryCard({
  cat, idx, subs, domain, cards, onEdit, onDelete, onAddSub, onDeleteSub,
}: {
  cat: Category;
  idx: number;
  subs: Category[];
  domain: Scope;
  cards: CreditCardConfig[];
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddSub: (c: Category) => void;
  onDeleteSub: (sub: Category) => void;
}) {
  const [subsOpen, setSubsOpen] = useState(false);
  const [hov, setHov] = useState(false);
  const color    = resolveColor(cat, idx);
  const hasLimit = cat.invoice_budget_limit != null && cat.invoice_budget_limit > 0;

  const cardLabel = cat.card_id
    ? cards.find(c => c.id === cat.card_id)?.name ?? `Cartão #${cat.card_id}`
    : 'Todos os cartões';

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.12s',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Main row */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Color avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: `${color}20`, border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {cat.icon || '📁'}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{cat.name}</span>
            {hasLimit && (
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--blue-400)', background: 'rgba(10,132,255,0.1)', borderRadius: 4, padding: '2px 7px' }}>
                Limite {formatCurrency(cat.invoice_budget_limit!)}
              </span>
            )}
            {subs.length > 0 && (
              <button
                onClick={() => setSubsOpen(v => !v)}
                style={{
                  fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                {subs.length} subcategor{subs.length > 1 ? 'ias' : 'ia'} {subsOpen ? '↑' : '↓'}
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {domain === 'credit_card' ? cardLabel : 'Conta bancária'}
          </div>
          {hasLimit && <BudgetBar spent={0} limit={cat.invoice_budget_limit!} />}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
          {subs.length > 0 && (
            <IconBtn onClick={() => setSubsOpen(v => !v)} style={{ color: subsOpen ? 'var(--blue-400)' : undefined }}>
              <ChevronDown open={subsOpen} />
            </IconBtn>
          )}
          <IconBtn title="Subcategoria" onClick={() => onAddSub(cat)}><Plus size={13} /></IconBtn>
          <IconBtn title="Editar" onClick={() => onEdit(cat)}><Pencil size={13} /></IconBtn>
          <IconBtn title="Excluir" onClick={() => onDelete(cat)} danger><Trash2 size={13} /></IconBtn>
        </div>
      </div>

      {/* Subcategories */}
      {subsOpen && subs.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {subs.map((sub, i) => (
            <div
              key={sub.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px 10px 58px',
                borderBottom: i < subs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 14, marginRight: 4 }}>{sub.icon || ''}</span>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{sub.name}</span>
              <IconBtn title="Editar" onClick={() => onEdit(sub)} small><Pencil size={11} /></IconBtn>
              <IconBtn title="Excluir" onClick={() => onDeleteSub(sub)} danger small><Trash2 size={11} /></IconBtn>
            </div>
          ))}
          <div style={{ padding: '8px 16px 10px 58px' }}>
            <button
              onClick={() => onAddSub(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 12px',
                color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-400)'; e.currentTarget.style.color = 'var(--blue-400)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Plus size={12} /> Adicionar subcategoria
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline form ───────────────────────────────────────────────────────────────
function CategoryForm({
  mode, target, parentCat, domain, cards, onSave, onCancel,
}: {
  mode: FormMode;
  target: Category | null;
  parentCat: Category | null;
  domain: Scope;
  cards: CreditCardConfig[];
  onSave: (form: FormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (mode === 'edit' && target) {
      return {
        name: target.name,
        icon: target.icon ?? '📁',
        color: target.color ?? PALETTE[0],
        scope: target.scope,
        cardId: target.card_id,
        parentId: target.parent_id,
        budgetLimit: target.invoice_budget_limit != null ? String(target.invoice_budget_limit) : '',
      };
    }
    if (mode === 'new-sub' && parentCat) {
      return { ...EMPTY_FORM, scope: parentCat.scope, parentId: parentCat.id, color: resolveColor(parentCat, 0) };
    }
    return { ...EMPTY_FORM, scope: domain };
  });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isSub = mode === 'new-sub' || (mode === 'edit' && target?.parent_id != null);
  const title = mode === 'edit' ? 'Editar categoria'
    : isSub ? `Nova subcategoria em "${parentCat?.name ?? ''}"`
    : 'Nova categoria';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Informe o nome.'); return; }
    setSaving(true); setErr(null);
    try { await onSave(form); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Erro ao salvar.'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid rgba(10,132,255,0.3)',
      borderRadius: 16, padding: '16px 18px', marginBottom: 14,
      animation: 'fadeUp 0.18s cubic-bezier(.25,.46,.45,.94) both',
    }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{title}</span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      {isSub && parentCat && (
        <div style={{ padding: '8px 12px', marginBottom: 12, borderRadius: 8, background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.2)', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>{parentCat.icon || '📁'}</span>
          Subcategoria de <strong style={{ color: 'var(--text-primary)' }}>{parentCat.name}</strong>
        </div>
      )}

      <form onSubmit={e => void handleSubmit(e)} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'start' }}>
          {/* Icon + color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" onClick={() => setShowIconPicker(v => !v)} style={{
              width: 52, height: 52, borderRadius: 14, fontSize: 24,
              background: `${form.color}20`, border: `2px solid ${form.color}44`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {form.icon}
            </button>
            {!isSub && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, width: 52 }}>
                {PALETTE.slice(0, 8).map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c,
                    border: `2px solid ${form.color === c ? '#fff' : 'transparent'}`,
                    cursor: 'pointer', padding: 0,
                  }} />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <label style={lbl}>
              <span>Nome</span>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={isSub ? 'Ex: Mercado' : 'Ex: Alimentação'}
                required style={inp} autoFocus
              />
            </label>
            {!isSub && domain === 'credit_card' && (
              <>
                <label style={lbl}>
                  <span>Aplicar em</span>
                  <select
                    value={form.cardId ?? ''}
                    onChange={e => setForm(f => ({ ...f, cardId: e.target.value ? Number(e.target.value) : null }))}
                    style={inp}
                  >
                    <option value="">Todos os cartões</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label style={lbl}>
                  <span>Limite por fatura (opcional)</span>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)' }}>R$</span>
                    <input
                      value={form.budgetLimit}
                      onChange={e => setForm(f => ({ ...f, budgetLimit: e.target.value }))}
                      type="number" min="0" step="0.01" placeholder="Sem limite"
                      style={{ ...inp, paddingLeft: 32 }}
                    />
                  </div>
                </label>
              </>
            )}
          </div>
        </div>

        {showIconPicker && (
          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => { setForm(f => ({ ...f, icon: ic })); setShowIconPicker(false); }} style={{
                width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer',
                background: form.icon === ic ? `${form.color}30` : 'transparent',
                border: `1px solid ${form.icon === ic ? form.color : 'transparent'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ic}
              </button>
            ))}
          </div>
        )}

        {err && <p style={{ fontSize: 12, color: 'var(--red-400)', margin: 0 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={ghostBtnStyle}>Cancelar</button>
          <button type="submit" disabled={saving} style={primaryBtnStyle}>
            {saving ? 'Salvando…' : mode === 'edit' ? 'Salvar' : 'Criar categoria'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Summary Strip ─────────────────────────────────────────────────────────────
function SummaryStrip({ cats, domain }: { cats: Category[]; domain: Scope }) {
  const parents     = cats.filter(c => c.parent_id == null);
  const subs        = cats.filter(c => c.parent_id != null);
  const withLimit   = parents.filter(c => c.invoice_budget_limit != null && c.invoice_budget_limit > 0).length;
  const withSubcats = parents.filter(c => subs.some(s => s.parent_id === c.id)).length;

  const items = domain === 'credit_card'
    ? [
        { label: 'Categorias',   value: parents.length, color: 'var(--text-primary)' },
        { label: 'Subcategorias',value: subs.length,    color: 'var(--purple-400,#BF5AF2)' },
        { label: 'Com limite',   value: withLimit,      color: withLimit > 0 ? 'var(--blue-400)' : 'var(--text-muted)' },
        { label: 'Com subcats',  value: withSubcats,    color: withSubcats > 0 ? 'var(--teal-400,#5AC8FA)' : 'var(--text-muted)' },
      ]
    : [
        { label: 'Categorias',   value: parents.length, color: 'var(--text-primary)' },
        { label: 'Subcategorias',value: subs.length,    color: 'var(--purple-400,#BF5AF2)' },
      ];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`,
      background: 'var(--surface-card)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, overflow: 'hidden', marginBottom: 14,
    }}>
      {items.map((s, i) => (
        <div key={i} style={{ padding: '12px 14px', borderRight: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>{s.label}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconBtn({ children, onClick, title, danger, small, style }: {
  children: React.ReactNode; onClick: () => void; title?: string; danger?: boolean; small?: boolean; style?: React.CSSProperties;
}) {
  const sz = small ? 24 : 28;
  return (
    <button
      onClick={onClick} title={title}
      style={{
        width: sz, height: sz, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)',
        background: 'transparent', color: danger ? 'var(--red-400)' : 'var(--text-muted)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.1s', ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function DomainToggle({ domain, onChange }: { domain: Scope; onChange: (d: Scope) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 3 }}>
      {(['credit_card', 'bank'] as Scope[]).map((d, i) => (
        <button key={d} onClick={() => onChange(d)} style={{
          padding: '5px 13px', borderRadius: 8, border: 'none',
          background: domain === d ? 'rgba(255,255,255,0.1)' : 'transparent',
          color: domain === d ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontSize: 12, fontWeight: domain === d ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)',
          boxShadow: domain === d ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
        }}>
          {i === 0 ? 'Cartão' : 'Conta'}
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const isMobile = useIsMobile();
  const [domain, setDomain]             = useState<Scope>('credit_card');
  const [categories, setCategories]     = useState<Category[]>([]);
  const [cards, setCards]               = useState<CreditCardConfig[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [formMode, setFormMode]         = useState<FormMode>(null);
  const [editTarget, setEditTarget]     = useState<Category | null>(null);
  const [parentTarget, setParentTarget] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [cats, cds] = await Promise.all([
        api.listCategories(domain),
        domain === 'credit_card' ? api.listCards() : Promise.resolve<CreditCardConfig[]>([]),
      ]);
      setCategories(cats); setCards(cds);
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar.'); }
    finally { setLoading(false); }
  }, [domain]);

  useEffect(() => { void load(); }, [load]);

  const parents = useMemo(() => categories.filter(c => c.parent_id == null), [categories]);
  const subsByParent = useMemo(() => {
    const m = new Map<number, Category[]>();
    categories.filter(c => c.parent_id != null).forEach(c => {
      const l = m.get(c.parent_id!) ?? []; l.push(c); m.set(c.parent_id!, l);
    });
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (subsByParent.get(c.id) ?? []).some(s => s.name.toLowerCase().includes(q))
    );
  }, [parents, subsByParent, search]);

  async function handleSave(form: FormState) {
    const payload: CategoryPayload = {
      name: form.name.trim(), scope: form.scope, icon: form.icon || null, color: form.color || null,
      card_id: form.scope === 'bank' ? null : (form.cardId ?? null),
      parent_id: form.parentId ?? null,
      invoice_budget_limit: form.scope === 'credit_card' && form.budgetLimit ? parseFloat(form.budgetLimit) : null,
    };
    if (formMode === 'edit' && editTarget) {
      const patch: CategoryUpdatePayload = { name: payload.name, icon: payload.icon as string, color: payload.color as string };
      if (form.scope === 'credit_card') {
        patch.card_id              = form.cardId ?? 0;
        patch.parent_id            = form.parentId ?? 0;
        patch.invoice_budget_limit = form.budgetLimit ? parseFloat(form.budgetLimit) : 0;
      }
      const updated = await api.updateCategory(editTarget.id, patch);
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    } else {
      const created = await api.createCategory(payload);
      setCategories(prev => [...prev, created]);
    }
    setFormMode(null); setEditTarget(null); setParentTarget(null);
  }

  async function handleDelete(cat: Category) {
    const subs = subsByParent.get(cat.id) ?? [];
    if (!window.confirm(subs.length > 0
      ? `Excluir "${cat.name}" e suas ${subs.length} subcategoria(s)?`
      : `Excluir "${cat.name}"?`
    )) return;
    await api.deleteCategory(cat.id);
    setCategories(prev => prev.filter(c => c.id !== cat.id && c.parent_id !== cat.id));
  }

  function openEdit(cat: Category) { setEditTarget(cat); setParentTarget(null); setFormMode('edit'); }
  function openNewSub(parent: Category) { setParentTarget(parent); setEditTarget(null); setFormMode('new-sub'); }

  const px = isMobile ? 14 : 24;

  return (
    <>
      <PageHeader title="Categorias" subtitle="Organize e defina limites de orçamento" />

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Page header row */}
        <div style={{
          padding: `13px ${px}px 12px`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar categoria..."
              style={{ ...inp, paddingLeft: 30, width: '100%', fontSize: 12 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <DomainToggle domain={domain} onChange={d => { setDomain(d); setFormMode(null); }} />
            <button
              onClick={() => { setFormMode('new-parent'); setEditTarget(null); setParentTarget(null); }}
              style={primaryBtnStyle}
            >
              <Plus size={13} /> Nova categoria
            </button>
          </div>
        </div>

        <div style={{ padding: `16px ${px}px 40px` }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '16px 0' }}>
              <AlertTriangle size={16} color="var(--red-400)" />
              <p style={{ fontSize: 14, color: 'var(--red-400)', margin: 0 }}>{error}</p>
              <button onClick={() => void load()} style={ghostBtnStyle}><RefreshCw size={14} /> Tentar novamente</button>
            </div>
          ) : (
            <>
              <SummaryStrip cats={categories} domain={domain} />

              {formMode && (
                <CategoryForm
                  mode={formMode} target={editTarget} parentCat={parentTarget}
                  domain={domain} cards={cards}
                  onSave={handleSave}
                  onCancel={() => { setFormMode(null); setEditTarget(null); setParentTarget(null); }}
                />
              )}

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 24px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>
                  <Tags size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    {search ? 'Nenhuma categoria encontrada.' : `Nenhuma categoria de ${domain === 'credit_card' ? 'cartão' : 'conta'} ainda.`}
                  </div>
                  {!search && (
                    <button onClick={() => { setFormMode('new-parent'); setEditTarget(null); setParentTarget(null); }} style={primaryBtnStyle}>
                      <Plus size={13} /> Criar primeira categoria
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {filtered.map((cat, i) => (
                    <CategoryCard
                      key={cat.id} cat={cat} idx={i} domain={domain} cards={cards}
                      subs={subsByParent.get(cat.id) ?? []}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onAddSub={openNewSub}
                      onDeleteSub={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = { display: 'grid', gap: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' };
const inp: React.CSSProperties = { padding: '8px 11px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--surface-2,#2C2C2E)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' };
const primaryBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: 'var(--blue-400,#0A84FF)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' };
const ghostBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' };
