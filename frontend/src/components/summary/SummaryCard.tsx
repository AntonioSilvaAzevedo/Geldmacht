import type { ReactNode } from 'react';

interface SummaryCardProps {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  accent: string;
}

export default function SummaryCard({ label, value, helper, icon, accent }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
            color: accent,
          }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      <div
        className="mt-3 text-[26px] font-semibold leading-tight tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className="mt-1 text-[12px] text-[var(--text-secondary)]">{helper}</div>
    </div>
  );
}
