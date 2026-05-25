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
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex, padding: 20,
        animation: 'gm-fade-in 0.18s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'gm-modal-slide-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
