'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import Header from '@/components/Layout/Header';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import CategoryIcon, { ICON_OPTIONS } from '@/components/CategoryIcon';
import { api, type Category } from '@/lib/api';

// ── Estado de edição inline ───────────────────────────────────────────────────
interface EditState {
  id: number;
  name: string;
  icon: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Criação
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [saving, setSaving] = useState(false);

  // Edição inline
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setCategories(await api.listCategories('credit_card'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const category = await api.createCategory({ name: name.trim(), scope: 'credit_card', icon });
      setCategories(prev => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setIcon('tag');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria.');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editing.name.trim()) return;
    setEditSaving(true);
    try {
      const updated = await api.updateCategory(editing.id, {
        name: editing.name.trim(),
        icon: editing.icon || null,
      });
      setCategories(prev =>
        prev.map(cat => cat.id === updated.id ? updated : cat)
            .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar categoria.');
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteCategory(id: number) {
    await api.deleteCategory(id);
    setCategories(prev => prev.filter(cat => cat.id !== id));
  }

  if (loading) {
    return (
      <>
        <Header title="Categorias" subtitle="Carregando..." />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner />
        </main>
      </>
    );
  }
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <Header title="Categorias" subtitle="Categorias manuais para faturas de cartão" />
      <main style={{ padding: 24, flex: 1, display: 'grid', gap: 18, alignContent: 'start' }}>

        {/* ── Formulário de criação ─────────────────────────────────────────── */}
        <form onSubmit={createCategory} style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 18,
          display: 'grid',
          gap: 12,
          maxWidth: 560,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Nova categoria
          </h2>

          <label style={labelStyle}>
            Nome da categoria
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Alimentação"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Ícone
            <IconSelect value={icon} onChange={setIcon} />
          </label>

          <div style={labelStyle}>
            Usar esta categoria em
            <div style={{ ...inputStyle, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8,
                borderRadius: '50%', background: 'var(--blue-400)', flexShrink: 0,
              }} />
              Fatura de cartão de crédito
            </div>
          </div>

          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            <Plus size={15} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>

        {/* ── Lista de categorias ───────────────────────────────────────────── */}
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
            Categorias de cartão
          </h2>
          <div style={{ display: 'grid', gap: 8, maxWidth: 720 }}>
            {categories.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Nenhuma categoria criada para fatura de cartão.
              </div>
            )}
            {categories.map(category => (
              <div key={category.id} style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                {editing?.id === category.id ? (
                  /* ── Modo edição inline ─────────────────────────────────── */
                  <div style={{ flex: 1, display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        autoFocus
                        value={editing.name}
                        onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : prev)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); void saveEdit(); }
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        style={{ ...inputStyle, flex: 1, minWidth: 120, padding: '6px 10px', fontSize: 13 }}
                      />
                      <div style={{ minWidth: 180 }}>
                        <IconSelect
                          value={editing.icon}
                          onChange={v => setEditing(prev => prev ? { ...prev, icon: v } : prev)}
                          compact
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => void saveEdit()}
                        disabled={editSaving}
                        style={{ ...primaryButtonStyle, padding: '5px 12px', fontSize: 12 }}
                      >
                        <Check size={13} /> {editSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        style={{ ...iconButtonStyle, width: 'auto', padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <X size={13} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Modo visualização ──────────────────────────────────── */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'rgba(49,130,206,0.12)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <CategoryIcon icon={category.icon} size={16} color="var(--blue-400)" />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                        {category.name}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        Fatura de cartão de crédito
                      </div>
                    </div>
                  </div>
                )}

                {editing?.id !== category.id && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setEditing({ id: category.id, name: category.name, icon: category.icon ?? 'tag' })}
                      style={iconButtonStyle}
                      title="Editar categoria"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      style={iconButtonStyle}
                      title="Excluir categoria"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

// ── Seletor de ícone ──────────────────────────────────────────────────────────

function IconSelect({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          ...inputStyle,
          paddingLeft: compact ? 8 : 36,
          appearance: 'none',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {ICON_OPTIONS.map(opt => (
          <option key={opt.key} value={opt.key}>{opt.label}</option>
        ))}
      </select>
      {!compact && (
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'var(--text-muted)',
        }}>
          <CategoryIcon icon={value} size={14} color="var(--blue-400)" />
        </span>
      )}
    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  color: 'var(--text-muted)',
  fontSize: 12,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 11px',
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  background: 'var(--surface-panel)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
};

const primaryButtonStyle: React.CSSProperties = {
  justifySelf: 'start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '9px 14px',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};

const iconButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 7,
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-muted)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
