import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type Filter = 'todos' | 'entradas' | 'saidas' | 'transferencias';

const FILTER_LABELS: Record<Filter, string> = {
  todos: 'Todos',
  entradas: 'Entradas',
  saidas: 'Saídas',
  transferencias: 'Transferências',
};

interface ReviewFiltersProps {
  isBankStatement: boolean;
  activeFilter: Filter;
  onFilterChange: (filter: Filter) => void;
  totalCount: number;
  search: string;
  onSearchChange: (value: string) => void;
}

export function ReviewFilters({
  isBankStatement,
  activeFilter,
  onFilterChange,
  totalCount,
  search,
  onSearchChange,
}: ReviewFiltersProps) {
  const filters: Filter[] = isBankStatement
    ? ['todos', 'entradas', 'saidas']
    : ['todos', 'entradas', 'saidas', 'transferencias'];

  return (
    <div className="mb-3.5 flex shrink-0 flex-wrap gap-2.5">
      <div className="flex gap-1.5">
        {filters.map((filter) => (
          <Button
            key={filter}
            type="button"
            variant={activeFilter === filter ? 'primary' : 'outline'}
            size="sm"
            className="rounded-[7px]"
            onClick={() => onFilterChange(filter)}
          >
            {filter === 'todos' ? `Todos (${totalCount})` : FILTER_LABELS[filter]}
          </Button>
        ))}
      </div>

      <div className="relative min-w-[200px] flex-1">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          type="text"
          variant="search"
          size="sm"
          placeholder="Buscar por descrição..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
