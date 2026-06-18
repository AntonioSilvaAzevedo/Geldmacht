import { type BankAccountConfig, type UploadResponse } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface BankStatementInfoProps {
  bankAccount: BankAccountConfig | null | undefined;
  statementMetadata: UploadResponse['statement_metadata'];
  transactionsCount: number;
}

export function BankStatementInfo({ bankAccount, statementMetadata, transactionsCount }: BankStatementInfoProps) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 14,
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
      }}>
        Dados do extrato
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, display: 'grid', gap: 6 }}>
        {bankAccount && (
          <div><strong style={{ color: 'var(--text-primary)' }}>Conta:</strong>{' '}{bankAccount.name}{bankAccount.institution ? ` — ${bankAccount.institution}` : ''}</div>
        )}
        {statementMetadata?.institution != null && statementMetadata.institution !== '' && (
          <div><strong style={{ color: 'var(--text-primary)' }}>Instituição (arquivo):</strong>{' '}{statementMetadata.institution}</div>
        )}
        {statementMetadata?.account_id != null && statementMetadata.account_id !== '' && (
          <div><strong style={{ color: 'var(--text-primary)' }}>ID conta (OFX):</strong>{' '}{statementMetadata.account_id}</div>
        )}
        {(statementMetadata?.period_start || statementMetadata?.period_end) && (
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Período:</strong>{' '}
            {statementMetadata.period_start ? formatDate(statementMetadata.period_start) : '—'}
            {' — '}
            {statementMetadata.period_end ? formatDate(statementMetadata.period_end) : '—'}
          </div>
        )}
        {statementMetadata?.ledger_balance != null && (
          <div><strong style={{ color: 'var(--text-primary)' }}>Saldo (extrato):</strong>{' '}{formatCurrency(statementMetadata.ledger_balance)}</div>
        )}
        {(statementMetadata?.total_inflows != null || statementMetadata?.total_outflows != null) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
            {statementMetadata.total_inflows != null && (
              <span><strong style={{ color: 'var(--green-400)' }}>Entradas:</strong>{' '}{formatCurrency(statementMetadata.total_inflows)}</span>
            )}
            {statementMetadata.total_outflows != null && (
              <span><strong style={{ color: 'var(--red-400)' }}>Saídas:</strong>{' '}{formatCurrency(statementMetadata.total_outflows)}</span>
            )}
          </div>
        )}
        <div><strong style={{ color: 'var(--text-primary)' }}>Lançamentos:</strong>{' '}{transactionsCount}</div>
      </div>
    </div>
  );
}
