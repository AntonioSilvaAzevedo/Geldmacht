'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface LancamentoPrerequisiteModalProps {
  hasCard: boolean;
  onClose: () => void;
}

export function LancamentoPrerequisiteModal({ hasCard, onClose }: LancamentoPrerequisiteModalProps) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = hasCard
    ? 'Complete o cadastro da carteira'
    : 'Você ainda não possui uma conta cadastrada';
  const description = hasCard
    ? 'Cadastre uma conta corrente para começar a registrar lançamentos.'
    : 'Cadastre uma conta na carteira antes de adicionar lançamentos manuais.';

  function goToCarteira() {
    onClose();
    router.push('/home/carteira');
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lancamento-prereq-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 [animation:gm-fade-in_0.18s_ease-out] sm:items-center sm:p-5"
    >
      <div className="flex w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border-default)] bg-[var(--surface-card)] [animation:gm-modal-slide-in_0.24s_cubic-bezier(0.2,0.8,0.2,1)] sm:max-w-[420px] sm:rounded-2xl">
        <div className="flex justify-end px-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-3 px-6 pb-7 pt-1 text-center">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)]">
            <Wallet size={24} />
          </div>
          <h2 id="lancamento-prereq-title" className="text-[17px] font-bold tracking-[-0.01em]">
            {title}
          </h2>
          <p className="max-w-[300px] text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
          <Button type="button" variant="primary" onClick={goToCarteira} className="mt-1">
            Ir para carteira
          </Button>
        </div>
      </div>
    </div>
  );
}
