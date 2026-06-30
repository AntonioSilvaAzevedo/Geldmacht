'use client';

import { useEffect, type ReactNode } from 'react';

interface Props {
  onClose: () => void;
  ariaLabelledBy: string;
  zIndex?: number;
  children: ReactNode;
}

export default function ModalDialog({
  onClose,
  ariaLabelledBy,
  zIndex = 200,
  children,
}: Props) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      style={{ zIndex }}
      className="fixed inset-0 flex items-start justify-center bg-black/55 px-3 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+12px)] [animation:gm-fade-in_0.18s_ease-out] sm:items-center sm:p-5"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] w-full max-w-[520px] flex-col overflow-y-auto overscroll-contain rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[0_32px_80px_rgba(0,0,0,0.55)] [animation:gm-modal-slide-down_0.24s_cubic-bezier(0.2,0.8,0.2,1)] sm:max-h-[90dvh] sm:[animation:gm-modal-slide-in_0.22s_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        {children}
      </div>
    </div>
  );
}
