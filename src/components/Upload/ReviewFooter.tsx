import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReviewFooterProps {
  isMobile: boolean;
  selectedCount: number;
  transactionsTotal: number;
  isBankStatement: boolean;
  isCreditCardType: boolean;
  hasBankAccount: boolean;
  hasSelectedCard: boolean;
  importing: boolean;
  onBack: () => void;
  onImport: () => void;
}

export function ReviewFooter({
  isMobile,
  selectedCount,
  transactionsTotal,
  isBankStatement,
  isCreditCardType,
  hasBankAccount,
  hasSelectedCard,
  importing,
  onBack,
  onImport,
}: ReviewFooterProps) {
  return (
    <div
      className={cn(
        'mt-3.5 flex shrink-0 items-center gap-2.5',
        isMobile ? 'border-t border-[var(--border-default)] pt-2.5' : 'justify-between',
      )}
    >
      {!isMobile && (
        <span className="min-w-0 text-[12px] text-[var(--text-muted)]">
          <strong className="text-[var(--text-primary)]">{selectedCount}</strong> de {transactionsTotal} serão importados
        </span>
      )}

      <div className={cn('flex gap-2.5', isMobile ? 'w-full' : 'shrink-0')}>
        <Button type="button" variant="outline" onClick={onBack} className={cn(isMobile && 'flex-1')}>
          Cancelar
        </Button>

        {isBankStatement && !hasBankAccount ? (
          <Button
            type="button"
            variant="outline"
            disabled
            title="Volte e selecione uma conta bancária."
            className={cn('border-[rgba(229,62,62,0.3)] text-[var(--red-400)] opacity-75', isMobile && 'flex-1')}
          >
            <Download className="size-[15px]" aria-hidden />
            Conta obrigatória
          </Button>
        ) : isCreditCardType && !isBankStatement && !hasSelectedCard ? (
          <Button
            type="button"
            variant="outline"
            disabled
            title="Selecione o cartão desta fatura antes de importar."
            className={cn('border-[rgba(229,62,62,0.3)] text-[var(--red-400)] opacity-75', isMobile && 'flex-1')}
          >
            <Download className="size-[15px]" aria-hidden />
            Selecione um cartão
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={onImport}
            disabled={selectedCount === 0}
            loading={importing}
            className={cn(isMobile && 'flex-1')}
          >
            {!importing && <Download className="size-[15px]" aria-hidden />}
            {importing
              ? 'Importando...'
              : isMobile
                ? `Importar (${selectedCount})`
                : `Importar ${selectedCount} selecionados`}
          </Button>
        )}
      </div>
    </div>
  );
}
