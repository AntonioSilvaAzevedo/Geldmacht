'use client';

import { useState } from 'react';

export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface CategorySelectorProps {
  categories: CategoryItem[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  variant?: 'grid' | 'chips';
  visibleCount?: number;
}

export default function CategorySelector({
  categories,
  selected,
  onSelect,
  variant = 'grid',
  visibleCount = 4,
}: CategorySelectorProps) {
  const [expanded, setExpanded] = useState(false);

  if (variant === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {categories.map(c => {
          const on = selected === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(on ? null : c.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '11px 8px', borderRadius: 12,
                border: `1.5px solid ${on ? c.color : 'rgba(255,255,255,.08)'}`,
                background: on ? `${c.color}18` : 'var(--surface-2)',
                color: on ? c.color : 'var(--text-secondary)',
                fontSize: 11, fontWeight: on ? 600 : 400,
                transition: 'all .12s', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{c.icon}</span>
              <span style={{ fontSize: 10, textAlign: 'center', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // chips variant
  const visible = expanded ? categories : categories.slice(0, visibleCount);
  const more = categories.length - visibleCount;
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {visible.map(c => {
        const on = selected === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(on ? null : c.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 20,
              border: `1.5px solid ${on ? c.color : 'rgba(255,255,255,.1)'}`,
              background: on ? `${c.color}20` : 'rgba(255,255,255,.04)',
              color: on ? c.color : 'var(--text-secondary)',
              fontSize: 12, fontWeight: on ? 600 : 400,
              transition: 'all .12s', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{c.icon}</span>
            {c.label}
          </button>
        );
      })}
      {!expanded && more > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '7px 12px', borderRadius: 20,
            border: '1.5px solid rgba(255,255,255,.1)',
            background: 'rgba(255,255,255,.04)',
            color: 'var(--text-muted)', fontSize: 12,
            transition: 'all .12s', cursor: 'pointer',
          }}
        >
          +{more} mais
        </button>
      )}
      {expanded && more > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '7px 12px', borderRadius: 20,
            border: '1.5px solid rgba(255,255,255,.1)',
            background: 'rgba(255,255,255,.04)',
            color: 'var(--text-muted)', fontSize: 12,
            transition: 'all .12s', cursor: 'pointer',
          }}
        >
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
          Menos
        </button>
      )}
    </div>
  );
}
