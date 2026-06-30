import { type ComponentProps } from 'react';
import { CheckSquare, Square } from 'lucide-react';

import { CategoryChoiceSelect } from '@/components/category-choice-select';
import { Button } from '@/components/ui/button';
import { ReviewTransactionRow } from '@/components/Upload/ReviewTransactionRow';
import { type PreviewTransaction } from '@/lib/api';

interface ReviewTransactionListProps {
  isMobile: boolean;
  transactions: PreviewTransaction[];
  filteredIndices: number[];
  selected: Set<number>;
  onToggle: (index: number) => void;
  allFilteredSelected: boolean;
  onToggleAll: () => void;
  descriptions: Record<number, string>;
  onDescriptionChange: (index: number, value: string) => void;
  categoryIds: Record<number, number | null>;
  onCategoryChange: (index: number, id: number | null) => void;
  categoryOptions: ComponentProps<typeof CategoryChoiceSelect>['options'];
}

export function ReviewTransactionList({
  isMobile,
  transactions,
  filteredIndices,
  selected,
  onToggle,
  allFilteredSelected,
  onToggleAll,
  descriptions,
  onDescriptionChange,
  categoryIds,
  onCategoryChange,
  categoryOptions,
}: ReviewTransactionListProps) {
  if (isMobile) {
    return (
      <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto">
        <div className="grid w-full min-w-0 gap-2">
          {filteredIndices.map(i => (
            <ReviewTransactionRow
              key={i}
              tx={transactions[i]}
              index={i}
              isMobile
              isSelected={selected.has(i)}
              onToggle={onToggle}
              description={descriptions[i] ?? transactions[i].description}
              onDescriptionChange={onDescriptionChange}
              categoryId={categoryIds[i] ?? null}
              onCategoryChange={onCategoryChange}
              categoryOptions={categoryOptions}
            />
          ))}
          {filteredIndices.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>
              Nenhum lançamento encontrado no arquivo.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 10,
      border: '1px solid var(--border-subtle)',
      overflowY: 'auto',
      flex: 1,
      minHeight: 0,
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--surface-panel)', borderBottom: '1px solid var(--border-subtle)' }}>
            <th style={{ padding: '10px 12px', width: 40, textAlign: 'center' }}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={`h-auto w-auto border-none bg-transparent p-0 hover:bg-transparent ${allFilteredSelected ? 'text-[var(--blue-400)]' : 'text-[var(--text-muted)]'}`}
                aria-label={allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                title={allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                onClick={onToggleAll}
              >
                {allFilteredSelected
                  ? <CheckSquare className="size-4" aria-hidden />
                  : <Square className="size-4" aria-hidden />}
              </Button>
            </th>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Data</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Descrição</th>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Categoria</th>
            <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {filteredIndices.map(i => (
            <ReviewTransactionRow
              key={i}
              tx={transactions[i]}
              index={i}
              isMobile={false}
              isSelected={selected.has(i)}
              onToggle={onToggle}
              description={descriptions[i] ?? transactions[i].description}
              onDescriptionChange={onDescriptionChange}
              categoryId={categoryIds[i] ?? null}
              onCategoryChange={onCategoryChange}
              categoryOptions={categoryOptions}
            />
          ))}
        </tbody>
      </table>

      {filteredIndices.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhum lançamento encontrado no arquivo.
        </div>
      )}
    </div>
  );
}
