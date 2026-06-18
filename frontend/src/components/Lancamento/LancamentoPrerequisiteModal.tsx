'use client';

import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormSheet } from '@/components/ui/FormSheet';

interface LancamentoPrerequisiteModalProps {
  hasCard: boolean;
  onClose: () => void;
}

export function LancamentoPrerequisiteModal({ hasCard, onClose }: LancamentoPrerequisiteModalProps) {
  const router = useRouter();

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
    <FormSheet
      onClose={onClose}
      ariaLabelledBy="lancamento-prereq-title"
      maxWidthClass="sm:max-w-[420px]"
      bodyClassName="flex flex-col items-center gap-3 px-6 pb-7 pt-1 text-center"
    >
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
    </FormSheet>
  );
}
