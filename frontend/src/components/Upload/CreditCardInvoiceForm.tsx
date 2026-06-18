import { type CreditCardConfig } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CreditCardInvoiceFormProps {
  selectedCard: CreditCardConfig | null;
  cards: CreditCardConfig[];
  onSelectCard: (card: CreditCardConfig | null) => void;
}

export function CreditCardInvoiceForm({ selectedCard, cards, onSelectCard }: CreditCardInvoiceFormProps) {
  return (
    <div
      className={cn(
        'mb-3.5 flex shrink-0 flex-col gap-1.5 rounded-[10px] border bg-[var(--surface-card)] px-4 py-3',
        selectedCard ? 'border-[var(--border-subtle)]' : 'border-[rgba(229,62,62,0.4)]',
      )}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        Cartão de destino
      </span>
      <select
        value={selectedCard?.id ?? ''}
        onChange={(e) => {
          const id = e.target.value ? Number(e.target.value) : null;
          onSelectCard(cards.find((c) => c.id === id) ?? null);
        }}
        className={cn(
          'rounded-[6px] border bg-[var(--surface-panel)] px-2.5 py-1.5 text-[13px]',
          selectedCard
            ? 'border-[var(--border-default)] text-[var(--text-primary)]'
            : 'border-[rgba(229,62,62,0.5)] text-[var(--text-muted)]',
        )}
      >
        <option value="">Selecione um cartão</option>
        {cards.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.institution ? ` — ${c.institution}` : ''}
          </option>
        ))}
      </select>
      {!selectedCard && (
        <span className="text-[11px] text-[var(--red-400)]">Obrigatório para importar a fatura.</span>
      )}
    </div>
  );
}
