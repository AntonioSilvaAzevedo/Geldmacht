'use client';

import { useMemo, useState } from 'react';
import { Search, Tag } from 'lucide-react';

import CategoryIcon from '@/components/CategoryIcon';
import { FormSheet } from '@/components/ui/FormSheet';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface CategoryBadgeOption {
  id: number;
  label: string;
  icon: string | null;
}

interface CategoryBadgesProps {
  value: number | null;
  options: CategoryBadgeOption[];
  onChange: (id: number | null) => void;
  emptyLabel?: string;
  maxInline?: number;
  inlineThreshold?: number;
}

function chipClass(selected: boolean): string {
  return cn(
    'inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
    selected
      ? 'border-[var(--blue)] bg-[rgba(10,132,255,0.14)] text-[var(--blue-400)]'
      : 'border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]',
  );
}

export function CategoryBadges({
  value,
  options,
  onChange,
  emptyLabel = 'Sem categoria',
  maxInline = 5,
  inlineThreshold = 8,
}: CategoryBadgesProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = value != null ? options.find((o) => o.id === value) ?? null : null;

  const inline = useMemo(() => {
    if (options.length <= inlineThreshold) return options;
    const top = options.slice(0, maxInline);
    if (selected && !top.some((o) => o.id === selected.id)) return [...top, selected];
    return top;
  }, [options, inlineThreshold, maxInline, selected]);

  const hasOverflow = options.length > inline.length;

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div className="flex w-full min-w-0 flex-wrap gap-2">
      <button type="button" onClick={() => onChange(null)} className={chipClass(value == null)}>
        <Tag className="size-3.5 shrink-0" aria-hidden />
        {emptyLabel}
      </button>

      {inline.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={chipClass(value === opt.id)}
        >
          <span className="inline-flex shrink-0">
            <CategoryIcon icon={opt.icon} size={13} color="var(--blue-400)" />
          </span>
          <span className="truncate">{opt.label}</span>
        </button>
      ))}

      {hasOverflow && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[var(--border-default)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)]"
        >
          Mais categorias
        </button>
      )}

      {sheetOpen && (
        <FormSheet
          onClose={() => { setSheetOpen(false); setQuery(''); }}
          title="Escolher categoria"
          titleId="category-sheet-title"
          maxWidthClass="sm:max-w-[420px]"
          bodyClassName="flex flex-col gap-2 p-4"
        >
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              variant="search"
              size="sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar categoria..."
              aria-label="Buscar categoria"
              className="pl-8"
            />
          </div>

          <button
            type="button"
            onClick={() => { onChange(null); setSheetOpen(false); setQuery(''); }}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left text-[13px] transition-colors',
              value == null ? 'border-[var(--blue)] bg-[rgba(10,132,255,0.1)]' : 'border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]',
            )}
          >
            <CategoryIcon icon={null} size={15} color="var(--text-muted)" />
            {emptyLabel}
          </button>

          {filtered.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setSheetOpen(false); setQuery(''); }}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left text-[13px] transition-colors',
                value === opt.id ? 'border-[var(--blue)] bg-[rgba(10,132,255,0.1)]' : 'border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]',
              )}
            >
              <span className="inline-flex shrink-0">
                <CategoryIcon icon={opt.icon} size={15} color="var(--blue-400)" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">{opt.label}</span>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="px-1 py-6 text-center text-[12px] text-[var(--text-muted)]">
              Nenhuma categoria encontrada.
            </div>
          )}
        </FormSheet>
      )}
    </div>
  );
}
