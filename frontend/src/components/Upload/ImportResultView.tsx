import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InvoiceSummaryCards } from '@/components/Upload/InvoiceSummaryCards';
import { type CreditCardConfig, type ImportResponse } from '@/lib/api';

interface ImportResultViewProps {
  importResult: ImportResponse;
  selectedCard: CreditCardConfig | null;
  onImportDone: () => void;
}

export function ImportResultView({ importResult, selectedCard, onImportDone }: ImportResultViewProps) {
  return (
    <div style={{ padding: '48px 40px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'rgba(56,161,105,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <CheckCircle2 size={36} color="var(--green-400)" />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
        Importação concluída!
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
        <strong style={{ color: 'var(--green-400)' }}>{importResult.imported}</strong> lançamentos importados
        {importResult.skipped > 0 && (
          <>, <strong style={{ color: 'var(--amber-400)' }}>{importResult.skipped}</strong> duplicatas ignoradas</>
        )}
      </p>
      {importResult.summary && (
        <div style={{ marginTop: 24, textAlign: 'left' }}>
          <InvoiceSummaryCards summary={importResult.summary} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
        <Button type="button" variant="outline" onClick={onImportDone}>
          Importar outro arquivo
        </Button>
        <Link
          href={
            importResult.bank_account_id
              ? '/home/carteira'
              : selectedCard?.institution_id != null && importResult.invoice_id
                ? `/home/carteira/${selectedCard.institution_id}/cartao/faturas/${importResult.invoice_id}`
                : selectedCard?.institution_id != null
                  ? `/home/carteira/${selectedCard.institution_id}/cartao/faturas`
                  : '/home/carteira'
          }
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--primary-gradient)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {importResult.bank_account_id
            ? 'Ver movimentações da conta'
            : (importResult.card_id && (importResult.invoice_id || importResult.due_month))
              ? 'Ver fatura'
              : 'Ver no Dashboard'}
        </Link>
      </div>
    </div>
  );
}
