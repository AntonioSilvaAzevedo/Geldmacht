'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Header from '@/components/Layout/Header';
import ErrorState from '@/components/ErrorState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api, type Category } from '@/lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3182ce');
  const [saving, setSaving] = useState(false);

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
      const category = await api.createCategory({ name: name.trim(), scope: 'credit_card', color });
      setCategories(prev => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria.');
    } finally {
      setSaving(false);
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
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></main>
      </>
    );
  }
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <Header title="Categorias" subtitle="Categorias manuais para faturas de cartão" />
      <main style={{ padding: 24, flex: 1, display: 'grid', gap: 18, alignContent: 'start' }}>
        <form onSubmit={createCategory} style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: 18,
          display: 'grid',
          gap: 12,
          maxWidth: 560,
        }}>
          <label style={labelStyle}>
            Nome da categoria
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Alimentação" style={inputStyle} />
          </label>
          <div style={labelStyle}>
            Usar esta categoria em
            <div style={{
              ...inputStyle,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--blue-400)',
                flexShrink: 0,
              }} />
              Fatura de cartão de crédito
            </div>
          </div>
          <label style={labelStyle}>
            Cor
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ ...inputStyle, padding: 4, width: 72 }} />
          </label>
          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            <Plus size={15} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background: category.color || 'var(--blue-400)',
                    display: 'inline-block',
                  }} />
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{category.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Fatura de cartão de crédito</div>
                  </div>
                </div>
                <button onClick={() => deleteCategory(category.id)} style={iconButtonStyle} title="Excluir categoria">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

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
