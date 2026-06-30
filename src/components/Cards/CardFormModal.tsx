'use client';

import { FormSheet } from '@/components/ui/FormSheet';
import CreditCardForm from '@/components/Cards/CreditCardForm';
import type { CreditCardConfig } from '@/lib/api';

export type CardFormData = Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'> & {
  credit_limit: number | null;
};

interface CardFormModalProps {
  onClose: () => void;
  onSubmit: (payload: CardFormData) => Promise<void>;
  institutionName?: string;
}

export function CardFormModal({ onClose, onSubmit, institutionName }: CardFormModalProps) {
  return (
    <FormSheet
      onClose={onClose}
      title="Cadastrar cartão"
      titleId="card-form-modal-title"
      maxWidthClass="sm:max-w-[480px]"
    >
      <CreditCardForm
        submitLabel="Cadastrar cartão"
        onSubmit={onSubmit}
        onCancel={onClose}
        initial={institutionName ? { institution: institutionName } : undefined}
      />
    </FormSheet>
  );
}
