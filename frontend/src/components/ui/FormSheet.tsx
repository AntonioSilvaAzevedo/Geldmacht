'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FormSheetProps {
  onClose: () => void;
  title?: ReactNode;
  titleId?: string;
  titleIcon?: ReactNode;
  ariaLabelledBy?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
  zClassName?: string;
  bodyClassName?: string;
  dismissable?: boolean;
  closeDisabled?: boolean;
}

export function FormSheet({
  onClose,
  title,
  titleId,
  titleIcon,
  ariaLabelledBy,
  children,
  footer,
  maxWidthClass = 'sm:max-w-[420px]',
  zClassName = 'z-[200]',
  bodyClassName,
  dismissable = true,
  closeDisabled = false,
}: FormSheetProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !closeDisabled) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, closeDisabled]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy ?? titleId}
      onClick={(e) => {
        if (dismissable && !closeDisabled && e.target === e.currentTarget) onClose();
      }}
      className={cn(
        'fixed inset-0 flex items-start justify-center bg-black/55 px-3 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+12px)] [animation:gm-fade-in_0.18s_ease-out] sm:items-center sm:p-5',
        zClassName,
      )}
    >
      <div
        className={cn(
          'flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] [animation:gm-modal-slide-down_0.24s_cubic-bezier(0.2,0.8,0.2,1)] sm:max-h-[90dvh] sm:[animation:gm-modal-slide-in_0.24s_cubic-bezier(0.2,0.8,0.2,1)]',
          maxWidthClass,
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center border-b border-[var(--separator)] px-5 py-4',
            title != null ? 'justify-between' : 'justify-end',
          )}
        >
          {title != null && (
            <div className="flex min-w-0 items-center gap-2.5">
              {titleIcon}
              <h2 id={titleId} className="truncate text-[17px] font-bold tracking-[-0.01em]">
                {title}
              </h2>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Fechar"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto px-5 py-5',
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer != null && (
          <div className="shrink-0 border-t border-[var(--separator)] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
