'use client';

import { useState, type MouseEvent } from 'react';
import { Settings, Trash2 } from 'lucide-react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DeleteAccountModal } from '@/components/carteira/DeleteAccountModal';

interface AccountSettingsMenuProps {
  institutionId: number;
  institutionName: string;
  onDeleted: () => void;
  className?: string;
}

function stop(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
}

export function AccountSettingsMenu({ institutionId, institutionName, onDeleted, className }: AccountSettingsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        aria-label="Configurações da conta"
        onClick={(e) => { stop(e); setMenuOpen((v) => !v); }}
        className="flex size-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-[var(--text-primary)]"
      >
        <Settings className="size-4" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={(e) => { stop(e); setMenuOpen(false); }} />
          <div className="absolute right-0 top-9 z-[70] min-w-[210px] overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-1 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
              Configurações da conta
            </div>
            <button
              type="button"
              onClick={(e) => { stop(e); setMenuOpen(false); setShowDelete(true); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-[var(--red)] transition-colors hover:bg-white/[0.05]"
            >
              <Trash2 className="size-4" /> Excluir conta
            </button>
          </div>
        </>
      )}

      {showDelete && (
        <DeleteAccountModal
          institutionName={institutionName}
          onClose={() => setShowDelete(false)}
          onConfirm={async () => {
            await api.deleteInstitution(institutionId);
            setShowDelete(false);
            onDeleted();
          }}
        />
      )}
    </div>
  );
}
