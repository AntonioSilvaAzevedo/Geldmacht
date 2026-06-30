import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SummaryCardProps {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  accent: string;
  size?: 'md' | 'sm';
}

export default function SummaryCard({ label, value, helper, icon, accent, size = 'md' }: SummaryCardProps) {
  const sm = size === 'sm';
  return (
    <div
      className={cn(
        'rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[var(--surface-card)] shadow-[var(--shadow-card)]',
        sm ? 'p-4' : 'p-5',
      )}
    >
      <div className={cn('flex items-center', sm ? 'gap-2' : 'gap-2.5')}>
        <span
          className={cn('flex shrink-0 items-center justify-center rounded-[10px]', sm ? 'size-8' : 'size-9')}
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
            color: accent,
          }}
        >
          {icon}
        </span>
        <span
          className={cn(
            'font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]',
            sm ? 'text-[10px]' : 'text-[11px]',
          )}
        >
          {label}
        </span>
      </div>
      <div
        className={cn('font-semibold leading-tight tabular-nums', sm ? 'mt-2.5 text-[18px]' : 'mt-3 text-[26px]')}
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className={cn('mt-1 text-[var(--text-secondary)]', sm ? 'text-[11px]' : 'text-[12px]')}>{helper}</div>
    </div>
  );
}
