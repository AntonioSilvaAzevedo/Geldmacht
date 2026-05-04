'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const AVAILABLE_MONTHS = [
  { key: '2026-01', short: 'Jan', full: 'Janeiro 2026' },
  { key: '2026-02', short: 'Fev', full: 'Fevereiro 2026' },
  { key: '2026-03', short: 'Mar', full: 'Março 2026' },
  { key: '2026-04', short: 'Abr', full: 'Abril 2026' },
];

interface MonthSelectorProps {
  currentMonth: string;
  basePath?: string;
}

export default function MonthSelector({ currentMonth, basePath = '/mes' }: MonthSelectorProps) {
  const idx = AVAILABLE_MONTHS.findIndex((m) => m.key === currentMonth);
  const prev = idx > 0 ? AVAILABLE_MONTHS[idx - 1] : null;
  const next = idx < AVAILABLE_MONTHS.length - 1 ? AVAILABLE_MONTHS[idx + 1] : null;

  const navBtnStyle = (enabled: boolean): React.CSSProperties => ({
    width: 28,
    height: 28,
    borderRadius: 6,
    background: 'var(--surface-card)',
    border: '1px solid var(--border-default)',
    color: enabled ? 'var(--text-secondary)' : 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    opacity: enabled ? 1 : 0.3,
    pointerEvents: enabled ? 'auto' : 'none',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {AVAILABLE_MONTHS.map((m) => {
          const active = m.key === currentMonth;
          return (
            <Link
              key={m.key}
              href={`${basePath}/${m.key}`}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                background: active ? 'var(--blue-500)' : 'var(--surface-card)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${active ? 'var(--blue-500)' : 'var(--border-default)'}`,
                transition: 'all 0.15s ease',
              }}
            >
              {m.short}
            </Link>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {prev ? (
          <Link href={`${basePath}/${prev.key}`} style={navBtnStyle(true)}>
            <ChevronLeft size={14} />
          </Link>
        ) : (
          <div style={navBtnStyle(false)}><ChevronLeft size={14} /></div>
        )}
        {next ? (
          <Link href={`${basePath}/${next.key}`} style={navBtnStyle(true)}>
            <ChevronRight size={14} />
          </Link>
        ) : (
          <div style={navBtnStyle(false)}><ChevronRight size={14} /></div>
        )}
      </div>
    </div>
  );
}
