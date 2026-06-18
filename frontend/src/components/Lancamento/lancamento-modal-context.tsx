'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { LancamentoChoiceModal } from '@/components/Lancamento/LancamentoChoiceModal';
import { LancamentoModal } from '@/components/Lancamento/LancamentoModal';
import { LancamentoPrerequisiteModal } from '@/components/Lancamento/LancamentoPrerequisiteModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api, type ManualEligibility } from '@/lib/api';

type View = 'closed' | 'choice' | 'loading' | 'form' | 'warning';

interface LancamentoModalContextValue {
  open: () => void;
  close: () => void;
}

const LancamentoModalContext = createContext<LancamentoModalContextValue | null>(null);

export function LancamentoModalProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('closed');
  const [eligibility, setEligibility] = useState<ManualEligibility | null>(null);

  const value = useMemo<LancamentoModalContextValue>(
    () => ({
      open: () => setView('choice'),
      close: () => setView('closed'),
    }),
    [],
  );

  const startManual = () => {
    setView('loading');
    void api
      .getManualEligibility()
      .then((result) => {
        setEligibility(result);
        setView(result.can_launch ? 'form' : 'warning');
      })
      .catch(() => {
        setView('form');
      });
  };

  return (
    <LancamentoModalContext.Provider value={value}>
      {children}
      {view === 'choice' && (
        <LancamentoChoiceModal onManual={startManual} onClose={value.close} />
      )}
      {view === 'loading' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <LoadingSpinner />
        </div>
      )}
      {view === 'form' && <LancamentoModal onClose={value.close} />}
      {view === 'warning' && (
        <LancamentoPrerequisiteModal hasCard={eligibility?.has_card ?? false} onClose={value.close} />
      )}
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
