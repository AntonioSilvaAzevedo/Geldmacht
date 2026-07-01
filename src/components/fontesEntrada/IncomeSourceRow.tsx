'use client';

import { Pencil, Trash2 } from 'lucide-react';

import { INCOME_SOURCE_NATURE_LABELS, INCOME_SOURCE_TYPE_LABELS } from '@/lib/fontesEntrada/labels';
import type { IncomeSourceConfig } from '@/lib/api';

interface IncomeSourceRowProps {
  source: IncomeSourceConfig;
  defaultAccountName: string | null;
  onEdit: (source: IncomeSourceConfig) => void;
  onDelete: (source: IncomeSourceConfig) => void;
}

export function IncomeSourceRow({ source, defaultAccountName, onEdit, onDelete }: IncomeSourceRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">{source.name}</span>
          {source.nature === 'restricted_benefit' && (
            <span className="rounded-[5px] border border-[rgba(255,159,10,0.3)] bg-[rgba(255,159,10,0.12)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--amber-400)]">
              Benefício restrito
            </span>
          )}
          {!source.is_active && (
            <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--text-muted)]">
              Inativa
            </span>
          )}
        </div>
        <div className="mt-1 text-[12px] text-[var(--text-secondary)]">
          {INCOME_SOURCE_TYPE_LABELS[source.type] ?? source.type} · {INCOME_SOURCE_NATURE_LABELS[source.nature] ?? source.nature}
          {defaultAccountName && ` · Conta padrão: ${defaultAccountName}`}
        </div>
      </div>
      <button
        type="button"
        aria-label={`Editar ${source.name}`}
        onClick={() => onEdit(source)}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-[var(--text-primary)]"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Excluir ${source.name}`}
        onClick={() => onDelete(source)}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-[var(--red-400)]"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
