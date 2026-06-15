'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { LancamentoModal } from '@/components/Lancamento/LancamentoModal';

interface LancamentoModalContextValue {
  open: () => void;
  close: () => void;
}

const LancamentoModalContext = createContext<LancamentoModalContextValue | null>(null);

export function LancamentoModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<LancamentoModalContextValue>(
    () => ({ open: () => setIsOpen(true), close: () => setIsOpen(false) }),
    [],
  );

  return (
    <LancamentoModalContext.Provider value={value}>
      {children}
      {isOpen && <LancamentoModal onClose={value.close} />}
    </LancamentoModalContext.Provider>
  );
}

export function useLancamentoModal(): LancamentoModalContextValue {
  const context = useContext(LancamentoModalContext);
  if (!context) {
    throw new Error('useLancamentoModal must be used within LancamentoModalProvider');
  }
  return context;
}
