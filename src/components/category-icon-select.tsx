'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import CategoryIcon from '@/components/CategoryIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  CATEGORY_ICON_GROUPS,
  ICON_LABELS,
  resolveIconKey,
} from '@/components/category-icons-catalog';

export interface CategoryIconSelectProps {
  value: string;
  onChange: (iconKey: string) => void;
  disabled?: boolean;
}

/**
 * Seletor de ícone para categorias e subcategorias: busca, grupos e grid com toque confortável.
 * Salva apenas a chave (`value`); não persiste componente React.
 */
export function CategoryIconSelect({ value, onChange, disabled }: CategoryIconSelectProps) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!normalized) return CATEGORY_ICON_GROUPS;
    return CATEGORY_ICON_GROUPS.map(g => ({
      ...g,
      keys: g.keys.filter(k => {
        const label = (ICON_LABELS[k] ?? k).toLowerCase();
        return k.includes(normalized) || label.includes(normalized);
      }),
    })).filter(g => g.keys.length > 0);
  }, [normalized]);

  const current = resolveIconKey(value);

  return (
    <div
      data-slot="category-icon-select"
      style={{ display: 'grid', gap: 10 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid var(--border-default)',
          background: 'var(--surface-panel)',
        }}
      >
        <CategoryIcon icon={current} size={18} color="var(--blue-400)" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ícone selecionado</span>
        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
          {ICON_LABELS[current] ?? current}
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <Input
          type="search"
          variant="search"
          size="sm"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar ícone..."
          disabled={disabled}
          aria-label="Buscar ícone"
        />
      </div>

      <div
        style={{
          maxHeight: 'min(360px, 45vh)',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: 4,
          display: 'grid',
          gap: 14,
        }}
      >
        {groups.map(group => (
          <div key={group.id} style={{ display: 'grid', gap: 8 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              {group.title}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
                gap: 8,
              }}
            >
              {group.keys.map(key => {
                const resolved = resolveIconKey(key);
                const selected = resolved === current;
                const label = ICON_LABELS[key] ?? ICON_LABELS[resolved] ?? key;
                return (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    title={label}
                    aria-label={label}
                    onClick={() => onChange(resolved)}
                    className={cn(
                      'size-11 min-h-11 min-w-11 shrink-0 rounded-[10px] p-0 [&_svg]:pointer-events-none',
                      selected
                        ? 'border-2 border-[var(--blue-400)] bg-[rgba(49,130,206,0.12)]'
                        : '!border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)]',
                    )}
                  >
                    <CategoryIcon icon={resolved} size={18} color={selected ? 'var(--blue-400)' : 'var(--text-secondary)'} />
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
