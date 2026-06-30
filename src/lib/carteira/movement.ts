import type { Transaction } from '@/types/financial'

export type MovementType = 'income' | 'expense' | 'internal_transfer' | 'credit_card_payment'

const KNOWN: MovementType[] = ['income', 'expense', 'internal_transfer', 'credit_card_payment']

export function resolveMovementType(tx: Transaction): MovementType {
  if (tx.movement_type && KNOWN.includes(tx.movement_type as MovementType)) {
    return tx.movement_type as MovementType
  }
  if (tx.is_internal_transfer) return 'internal_transfer'
  if (tx.is_payment || tx.transaction_type === 'payment') return 'credit_card_payment'
  return tx.amount > 0 ? 'income' : 'expense'
}

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  income: 'Receita',
  expense: 'Despesa',
  internal_transfer: 'Transferência interna',
  credit_card_payment: 'Pagamento de fatura',
}
