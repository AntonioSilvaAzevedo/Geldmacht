import { Input } from '@/components/ui/input';
import { type CreditCardConfig, type InvoiceCreate } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface CreditCardInvoiceFormProps {
  isMobile: boolean;
  selectedCard: CreditCardConfig | null;
  cards: CreditCardConfig[];
  onSelectCard: (card: CreditCardConfig | null) => void;
  invoiceData: InvoiceCreate;
  onUpdateInvoice: (patch: Partial<InvoiceCreate>) => void;
}

export function CreditCardInvoiceForm({
  isMobile,
  selectedCard,
  cards,
  onSelectCard,
  invoiceData,
  onUpdateInvoice,
}: CreditCardInvoiceFormProps) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: `1px solid ${!selectedCard ? 'rgba(229,62,62,0.4)' : 'var(--border-subtle)'}`,
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 14,
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Dados da fatura
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '12px 16px',
      }}>
        <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
          <span style={{ fontWeight: 600, color: selectedCard ? 'var(--text-secondary)' : 'var(--red-400)' }}>
            Cartão {!selectedCard && '— obrigatório'}
          </span>
          <select
            value={selectedCard?.id ?? ''}
            onChange={e => {
              const id = e.target.value ? Number(e.target.value) : null;
              onSelectCard(cards.find(c => c.id === id) ?? null);
            }}
            style={{
              padding: '6px 9px',
              borderRadius: 6,
              border: `1px solid ${!selectedCard ? 'rgba(229,62,62,0.5)' : 'var(--border-default)'}`,
              background: 'var(--surface-panel)',
              color: selectedCard ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            <option value="">Selecione um cartão</option>
            {cards.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.institution ? ` — ${c.institution}` : ''}</option>
            ))}
          </select>
          {!selectedCard && (
            <span style={{ color: 'var(--red-400)', fontSize: 11 }}>Obrigatório para importar.</span>
          )}
        </label>

        <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Vencimento</span>
          <Input
            type="date"
            size="sm"
            value={invoiceData.due_date ?? ''}
            onChange={e => {
              const v = e.target.value;
              onUpdateInvoice({ due_date: v || null, due_month: v ? v.slice(0, 7) : invoiceData.due_month });
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Mês de pagamento</span>
          <Input
            type="month"
            size="sm"
            value={invoiceData.due_month ?? ''}
            onChange={e => onUpdateInvoice({ due_month: e.target.value })}
          />
        </label>

        <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Início do período</span>
          <Input
            type="date"
            size="sm"
            value={invoiceData.cycle_start_date ?? ''}
            onChange={e => onUpdateInvoice({ cycle_start_date: e.target.value || null })}
          />
        </label>

        <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Fim do período</span>
          <Input
            type="date"
            size="sm"
            value={invoiceData.cycle_end_date ?? ''}
            onChange={e => onUpdateInvoice({ cycle_end_date: e.target.value || null })}
          />
        </label>

        <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total da fatura</span>
          <Input
            type="number"
            size="sm"
            min={0}
            step={0.01}
            placeholder="0,00"
            value={invoiceData.total_amount ?? ''}
            onChange={e => onUpdateInvoice({ total_amount: e.target.value ? Number(e.target.value) : null })}
          />
        </label>
      </div>

      {selectedCard && (invoiceData.due_date || invoiceData.due_month) && (
        <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(49,130,206,0.07)', borderRadius: 7, fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
          {invoiceData.due_date && (
            <span>Vence em <strong style={{ color: 'var(--blue-400)' }}>{formatDate(invoiceData.due_date)}</strong></span>
          )}
          {invoiceData.cycle_start_date && invoiceData.cycle_end_date && (
            <span>Período: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(invoiceData.cycle_start_date)} a {formatDate(invoiceData.cycle_end_date)}</strong></span>
          )}
          {invoiceData.total_amount != null && (
            <span>Total: <strong style={{ color: 'var(--red-400)' }}>{formatCurrency(invoiceData.total_amount)}</strong></span>
          )}
        </div>
      )}
    </div>
  );
}
