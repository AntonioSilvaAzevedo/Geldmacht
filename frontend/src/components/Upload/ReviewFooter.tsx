import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReviewFooterProps {
  isMobile: boolean;
  selectedCount: number;
  filteredTotal: number;
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
  filteredTotal,
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
        'mt-3.5 flex shrink-0 items-center justify-between gap-2.5',
        isMobile &&
          'fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-40 mt-0 border-t border-[var(--border-default)] bg-[var(--surface-card)] px-3.5 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.30)]',
      )}
    >
      <span className="min-w-0 text-[12px] text-[var(--text-muted)]">
        {isMobile ? (
          <>
            <strong className="text-[var(--text-primary)]">{selectedCount}</strong>
            {' '}selecionado{selectedCount === 1 ? '' : 's'}
          </>
        ) : (
          <>
            Mostrando {filteredTotal} de {transactionsTotal} ·{' '}
            <strong className="text-[var(--text-primary)]">{selectedCount}</strong> serão importados
          </>
        )}
      </span>

      <div className="flex shrink-0 gap-2.5">
        <Button type="button" variant="outline" onClick={onBack}>
          Cancelar
        </Button>

        {isBankStatement && !hasBankAccount ? (
          <Button
            type="button"
            variant="outline"
            disabled
            title="Volte e selecione uma conta bancária."
            className="border-[rgba(229,62,62,0.3)] text-[var(--red-400)] opacity-75"
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
            className="border-[rgba(229,62,62,0.3)] text-[var(--red-400)] opacity-75"
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
