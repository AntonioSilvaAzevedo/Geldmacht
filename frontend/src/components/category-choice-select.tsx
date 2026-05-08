'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

import CategoryIcon from '@/components/CategoryIcon';

export interface CategoryChoiceOption {
  id: number;
  label: string;
  /** Chave do ícone salva na categoria (pode ser null). */
  icon: string | null;
}

export interface CategoryChoiceSelectProps {
  value: number | null;
  options: CategoryChoiceOption[];
  onChange: (id: number | null) => void;
  disabled?: boolean;
  /** Largura máxima do controle (gatilho). */
  maxWidth?: number | string;
  emptyLabel?: string;
}

/**
 * Escolha de categoria/subcategoria com ícone por linha (revisão de import, fatura, etc.).
 * Mantém apenas IDs no estado; ícones vêm do objeto categoria.
 */
export function CategoryChoiceSelect({
  value,
  options,
  onChange,
  disabled,
  maxWidth = '100%',
  emptyLabel = 'Sem categoria',
}: CategoryChoiceSelectProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = value != null ? options.find(o => o.id === value) : null;

  const filtered = q.trim()
    ? options.filter(o => o.label.toLowerCase().includes(q.trim().toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQ('');
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  return (
    <div
      ref={rootRef}
      data-slot="category-choice-select"
      style={{ position: 'relative', width: '100%', maxWidth }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          borderRadius: 7,
          border: '1px solid var(--border-default)',
          background: 'var(--surface-panel)',
          color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: 12,
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          minHeight: 36,
        }}
      >
        <span style={{ flexShrink: 0, display: 'inline-flex' }}>
          <CategoryIcon icon={selected?.icon} size={15} color="var(--blue-400)" />
        </span>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : emptyLabel}
        </span>
        <ChevronDown
          size={14}
          color="var(--text-muted)"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 4px)',
            zIndex: 200,
            maxHeight: 'min(320px, 50vh)',
            overflowX: 'hidden',
            overflowY: 'auto',
            borderRadius: 10,
            border: '1px solid var(--border-default)',
            background: 'var(--surface-card)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            display: 'grid',
            gap: 0,
          }}
        >
          {options.length > 10 && (
            <div style={{ padding: 8, borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, background: 'var(--surface-card)', zIndex: 1 }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Filtrar..."
                  aria-label="Filtrar categorias"
                  style={{
                    width: '100%',
                    padding: '6px 8px 6px 28px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-panel)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            role="option"
            aria-selected={value == null}
            onClick={() => { onChange(null); setOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              border: 'none',
              background: value == null ? 'rgba(49,130,206,0.08)' : 'transparent',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
              minHeight: 44,
            }}
          >
            <CategoryIcon icon={null} size={15} color="var(--text-muted)" />
            {emptyLabel}
          </button>

          {filtered.map(opt => (
            <button
              key={opt.id}
              type="button"
              role="option"
              aria-selected={value === opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                border: 'none',
                borderTop: '1px solid var(--border-subtle)',
                background: value === opt.id ? 'rgba(49,130,206,0.08)' : 'transparent',
                color: 'var(--text-primary)',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: 44,
              }}
            >
              <CategoryIcon icon={opt.icon} size={15} color="var(--blue-400)" />
              <span style={{ flex: 1, wordBreak: 'break-word' }}>{opt.label}</span>
            </button>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Nenhuma categoria encontrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
