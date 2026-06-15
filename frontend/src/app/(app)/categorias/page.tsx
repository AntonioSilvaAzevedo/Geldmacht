'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Search, Tags, AlertTriangle, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api, type Category, type CreditCardConfig, type CategoryPayload, type CategoryUpdatePayload } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/useIsMobile';

// ─── Color palette ─────────────────────────────────────────────────────────────
const PALETTE = ['#FF9F0A','#0A84FF','#BF5AF2','#30D158','#FF453A','#5AC8FA','#5E5CE6','#FF6B00','#34C759','#FF375F'];

const ICON_GROUPS: { label: string; icons: string[] }[] = [
  { label: 'Alimentação', icons: ['🍽️','🍔','🍕','🌮','🌯','🍣','🍱','🍜','🥗','🥩','🍗','🧆','🍳','🥞','🥐','🍞','🧀','🥚','🍿','🍦','🎂','🍰','🧁','🍩','🍪'] },
  { label: 'Bebidas',     icons: ['☕','🍵','🧃','🥤','🧋','🍺','🍻','🥂','🍷','🍸','🍹','🧉','🥛','💧'] },
  { label: 'Compras',     icons: ['🛍️','🛒','🏪','🏬','🏷️','👕','👗','👔','👟','👠','👒','🧣','💍','💎','💄','🧴','🧹','🪣','📦','🎁'] },
  { label: 'Transporte',  icons: ['🚗','🚕','🚙','🚌','🚎','🚂','🚁','✈️','⛵','🛳️','🚲','🛵','🏍️','⛽','🅿️','🛤️'] },
  { label: 'Moradia',     icons: ['🏠','🏡','🏢','🔑','🚪','🪟','🛋️','🛏️','🛁','🚿','🧺','💡','🔧','🔨','🪛','🪴','🌿','📦'] },
  { label: 'Saúde',       icons: ['💊','🏥','🩺','🩻','🧬','🩹','💉','🧪','🔬','🏋️','💪','🧘','🤸','🦷','👁️','❤️','🫀','🧠'] },
  { label: 'Beleza',      icons: ['💈','✂️','💅','🪒','🪥','🧖','🧗','🌸','🌺','🌹','💐'] },
  { label: 'Entret.',     icons: ['🎮','🕹️','🎯','🎲','🃏','♟️','🎬','📺','📽️','🎭','🎪','🎠','🎡','🎢','🎵','🎸','🎻','🎹','🥁','🎺','🎷','🎙️','🎤','🎧'] },
  { label: 'Esportes',    icons: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🥊','🤺','🏊','🚴','🧗','🏄','⛷️','🏂','🤿','🏆','🥇','🎿'] },
  { label: 'Educação',    icons: ['🎓','📚','📖','📝','✏️','🖊️','📐','📏','🔭','🧪','🔬','🖥️','🖨️','🎒','🏫','🧑‍🏫'] },
  { label: 'Trabalho',    icons: ['💼','💻','🖥️','⌨️','🖱️','📱','☎️','📠','📧','📨','📋','📊','📈','📉','🗂️','🗃️','🖇️','📎','✂️','🖊️','📌','📍'] },
  { label: 'Finanças',    icons: ['💰','💵','💴','💶','💷','💳','🏦','🏧','📈','📉','🪙','💹','🤝','🏛️','📑'] },
  { label: 'Pets',        icons: ['🐾','🐕','🐈','🐇','🐠','🐹','🐦','🦜','🦎','🐢','🐓','🐄','🐴','🐑'] },
  { label: 'Família',     icons: ['👶','🧒','🧑','👨','👩','👴','👵','🧸','🎒','🪆','🧩','🛺','🍼','🪁'] },
  { label: 'Viagens',     icons: ['🌍','🌎','🌏','🗺️','🏖️','🏔️','🏕️','⛺','🗼','🏯','🏰','🗽','🎡','🎢','🧳','🏝️','🌋','🏜️'] },
  { label: 'Serviços',    icons: ['⚡','🔌','📡','🌐','📮','📬','🏗️','🔩','⚙️','🛠️','🪜','🧯','🚒','🚑','🚓','💈'] },
  { label: 'Natureza',    icons: ['🌱','🌿','🍀','🌲','🌴','🌵','🌾','🍂','🌸','🌺','🌻','🌼','🍄','🌊','🔥','❄️','⛅','🌈','☀️','🌙','⭐','🌟','💫','☁️'] },
  { label: 'Outros',      icons: ['📁','🗂️','🔔','🎁','🏷️','🔖','🔐','🔒','🔓','🪪','📌','📍','🧲','🔋','💡','🕯️','🪔','🎀','🎊','🎉','🎈','🏅','🥈','🥉'] },
];

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

// ─── BudgetBar ────────────────────────────────────────────────────────────────

function BudgetBar({ spent, limit }: { spent: number; limit: number }) {
  const pct = Math.min(100, (spent / limit) * 100);
  return (
    <div style={{ marginTop: 4, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? 'var(--red)' : 'var(--blue)', borderRadius: 2 }} />
    </div>
  );
}

// ─── Category Card ─────────────────────────────────────────────────────────────
function CategoryCard({
  cat, idx, subs, domain, cards, onEdit, onAddSub, isEditing,
}: {
  cat: Category;
  idx: number;
  subs: Category[];
  domain: Scope;
  cards: CreditCardConfig[];
  onEdit: (c: Category) => void;
  onAddSub: (c: Category) => void;
  isEditing?: boolean;
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
          <IconBtn title="Editar" onClick={() => onEdit(cat)} style={{ color: isEditing ? 'var(--blue-400)' : undefined }}><Pencil size={13} /></IconBtn>
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
  mode, target, parentCat, domain, cards, onSave, onCancel, onDeleteRequest,
}: {
  mode: FormMode;
  target: Category | null;
  parentCat: Category | null;
  domain: Scope;
  cards: CreditCardConfig[];
  onSave: (form: FormState) => Promise<void>;
  onCancel: () => void;
  onDeleteRequest?: () => void;
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
  const [iconSearch, setIconSearch]         = useState('');
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
          <div style={{ background: 'var(--surface-2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {/* Search */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                value={iconSearch}
                onChange={e => setIconSearch(e.target.value)}
                placeholder="Buscar ícone..."
                autoFocus
                style={{ ...inp, paddingLeft: 28, width: '100%', fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
            {/* Groups */}
            <div style={{ maxHeight: 280, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(() => {
                const q = iconSearch.trim();
                const groups = q
                  ? [{ label: 'Resultados', icons: ICON_GROUPS.flatMap(g => g.icons).filter(ic => ic.includes(q)) }]
                  : ICON_GROUPS;
                return groups.map(group => group.icons.length === 0 ? null : (
                  <div key={group.label}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>
                      {group.label}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {group.icons.map(ic => (
                        <button key={ic} type="button"
                          onClick={() => { setForm(f => ({ ...f, icon: ic })); setShowIconPicker(false); setIconSearch(''); }}
                          style={{
                            width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: 'pointer',
                            background: form.icon === ic ? `${form.color}30` : 'transparent',
                            border: `1px solid ${form.icon === ic ? form.color : 'transparent'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => { if (form.icon !== ic) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                          onMouseLeave={e => { if (form.icon !== ic) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {err && <p style={{ fontSize: 12, color: 'var(--red-400)', margin: 0 }}>{err}</p>}

        <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
          {/* Excluir — só no modo edição */}
          {mode === 'edit' && onDeleteRequest && (
            <button
              type="button"
              onClick={onDeleteRequest}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 11px', borderRadius: 8,
                border: '1px solid rgba(255,69,58,.25)',
                background: 'rgba(255,69,58,.08)',
                color: 'var(--red, #FF453A)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Trash2 size={12} /> Excluir
            </button>
          )}
          {/* Cancelar + Salvar — sempre à direita */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" onClick={onCancel} style={ghostBtnStyle}>Cancelar</button>
            <button type="submit" disabled={saving} style={primaryBtnStyle}>
              {saving ? 'Salvando…' : mode === 'edit' ? 'Salvar' : 'Criar categoria'}
            </button>
          </div>
        </div>
      </form>
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
  const [formMode, setFormMode]         = useState<FormMode>(null);
  const [editTarget, setEditTarget]     = useState<Category | null>(null);
  const [parentTarget, setParentTarget] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting]           = useState(false);

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

  const filtered = parents;

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

  async function executeDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.deleteCategory(deleteConfirm.id);
      setCategories(prev => prev.filter(c => c.id !== deleteConfirm.id && c.parent_id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setFormMode(null);
      setEditTarget(null);
      setParentTarget(null);
    } catch (e) {
      // keep modal open, show nothing — the form error state handles this gracefully
      console.error('[cat] delete failed:', e);
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(cat: Category) { setEditTarget(cat); setParentTarget(null); setFormMode('edit'); }
  function openNewSub(parent: Category) { setParentTarget(parent); setEditTarget(null); setFormMode('new-sub'); }

  const px = isMobile ? 14 : 24;

  return (
    <>
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

      {/* Header row — controls only */}
      <div style={{
        padding: `13px ${px}px 12px`,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      }}>
        <DomainToggle domain={domain} onChange={d => { setDomain(d); setFormMode(null); }} />
        <button
          onClick={() => { setFormMode('new-parent'); setEditTarget(null); setParentTarget(null); }}
          style={primaryBtnStyle}
        >
          <Plus size={13} /> Nova categoria
        </button>
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
            {formMode && (
              <CategoryForm
                mode={formMode} target={editTarget} parentCat={parentTarget}
                domain={domain} cards={cards}
                onSave={handleSave}
                onCancel={() => { setFormMode(null); setEditTarget(null); setParentTarget(null); }}
                onDeleteRequest={formMode === 'edit' && editTarget
                  ? () => setDeleteConfirm({ id: editTarget.id, name: editTarget.name })
                  : undefined}
              />
            )}

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>
                <Tags size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  {`Nenhuma categoria de ${domain === 'credit_card' ? 'cartão' : 'conta'} ainda.`}
                </div>
                <button onClick={() => { setFormMode('new-parent'); setEditTarget(null); setParentTarget(null); }} style={primaryBtnStyle}>
                  <Plus size={13} /> Criar primeira categoria
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {filtered.map((cat, i) => (
                  <CategoryCard
                    key={cat.id} cat={cat} idx={i} domain={domain} cards={cards}
                    subs={subsByParent.get(cat.id) ?? []}
                    onEdit={openEdit}
                    onAddSub={openNewSub}
                    isEditing={formMode === 'edit' && editTarget?.id === cat.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

    </div>

    {/* ── Modal de confirmação de exclusão ───────────────────────────────────── */}
    {deleteConfirm && (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)',
        }}
        onClick={() => setDeleteConfirm(null)}
      >
        <div
          style={{
            background: 'var(--surface-1, #1C1C1E)',
            borderRadius: 20,
            padding: '28px 28px 24px',
            maxWidth: 380, width: '100%',
            boxShadow: '0 32px 80px rgba(0,0,0,.75)',
            animation: 'fadeUp 0.18s ease both',
            textAlign: 'center',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Ícone */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,69,58,.1)', border: '2px solid rgba(255,69,58,.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
              stroke="var(--red, #FF453A)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>

          {/* Título */}
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 6 }}>
            Excluir categoria?
          </div>

          {/* Descrição */}
          <p style={{
            fontSize: 13, color: 'var(--text-secondary, rgba(255,255,255,.55))',
            lineHeight: 1.6, margin: '0 0 22px',
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>&quot;{deleteConfirm.name}&quot;</strong>{' '}
            será removida permanentemente. Lançamentos vinculados não serão apagados.
          </p>

          {/* Botões */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setDeleteConfirm(null)}
              style={{
                flex: 1, padding: '9px', borderRadius: 9,
                border: '1px solid rgba(255,255,255,.12)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => void executeDelete()}
              disabled={deleting}
              style={{
                flex: 1, padding: '9px', borderRadius: 9,
                border: 'none',
                background: 'var(--red, #FF453A)', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: deleting ? 'default' : 'pointer',
                fontFamily: 'inherit', opacity: deleting ? 0.7 : 1,
              }}
            >
              {deleting ? 'Excluindo…' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = { display: 'grid', gap: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' };
const inp: React.CSSProperties = { padding: '8px 11px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--surface-2,#2C2C2E)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' };
const primaryBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: 'var(--blue-400,#0A84FF)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' };
const ghostBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' };
