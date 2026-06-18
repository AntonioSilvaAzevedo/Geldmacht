'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

import CategoryIcon from '@/components/CategoryIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

  if (options.length === 0) {
    return (
      <div
        data-slot="category-choice-empty"
        style={{ width: '100%', maxWidth }}
        className="flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--separator-opaque)] px-2.5 py-[7px] text-[length:var(--text-footnote)] text-[var(--text-muted)]"
      >
        <CategoryIcon icon={null} size={15} color="var(--text-muted)" />
        <span className="min-w-0 flex-1 truncate">{emptyLabel}</span>
      </div>
    );
  }

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
        className={cn(
          'flex min-h-9 w-full items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--separator-opaque)] bg-transparent px-2.5 py-[7px] text-left text-[length:var(--text-footnote)] outline-none transition-colors focus-visible:ring-3 focus-visible:ring-[rgba(10,132,255,0.45)]',
          disabled ? 'cursor-not-allowed opacity-[0.38]' : 'cursor-pointer hover:bg-[var(--surface-hover)]',
        )}
      >
        <span className="inline-flex shrink-0">
          <CategoryIcon icon={selected?.icon} size={15} color="var(--blue-400)" />
        </span>
        <span className={cn('min-w-0 flex-1 truncate', selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
          {selected ? selected.label : emptyLabel}
        </span>
        <ChevronDown
          size={14}
          aria-hidden
          className="shrink-0 text-[var(--text-muted)] transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
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
                <Input
                  variant="search"
                  size="sm"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Filtrar..."
                  aria-label="Filtrar categorias"
                  className="pl-7 text-xs"
                />
              </div>
            </div>
          )}

          <Button
            type="button"
            role="option"
            variant="ghost"
            aria-selected={value == null}
            onClick={() => { onChange(null); setOpen(false); }}
            className={cn(
              'min-h-11 h-auto w-full justify-start gap-2 rounded-none px-3 py-2.5 text-left font-normal text-xs',
              value == null ? 'bg-[rgba(49,130,206,0.08)]' : 'bg-transparent',
            )}
          >
            <CategoryIcon icon={null} size={15} color="var(--text-muted)" />
            {emptyLabel}
          </Button>

          {filtered.map(opt => (
            <Button
              key={opt.id}
              type="button"
              role="option"
              variant="ghost"
              aria-selected={value === opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={cn(
                'min-h-11 h-auto w-full justify-start gap-2 rounded-none border-0 border-t border-[var(--border-subtle)] px-3 py-2.5 text-left font-normal text-xs text-[var(--text-primary)]',
                value === opt.id ? 'bg-[rgba(49,130,206,0.08)]' : 'bg-transparent',
              )}
            >
              <CategoryIcon icon={opt.icon} size={15} color="var(--blue-400)" />
              <span style={{ flex: 1, wordBreak: 'break-word' }}>{opt.label}</span>
            </Button>
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
