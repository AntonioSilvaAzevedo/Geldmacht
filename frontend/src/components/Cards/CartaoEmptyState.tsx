'use client';

import EmptyState from '@/components/EmptyState';

interface Props {
  institutionName: string;
  institutionColor: string;
  onAddCard: () => void;
}

export default function CartaoEmptyState({ institutionName, institutionColor, onAddCard }: Props) {
  return (
    <EmptyState
      icon={
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
          stroke={institutionColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      }
      title="Nenhum cartão vinculado"
      description={
        <>
          Adicione o cartão de crédito do{' '}
          <strong className="text-[var(--text-primary)]">{institutionName}</strong>{' '}
          para acompanhar faturas e lançamentos.
        </>
      }
      actionLabel="Adicionar cartão"
      onAction={onAddCard}
    />
  );
}
