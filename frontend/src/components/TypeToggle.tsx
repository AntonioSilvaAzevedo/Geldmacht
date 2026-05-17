'use client';

export type TransactionTipo = 'saida' | 'entrada';

interface TypeToggleProps {
  value: TransactionTipo;
  onChange: (v: TransactionTipo) => void;
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
}

const SIZES = {
  sm: { p: '7px',  fs: 12, r: 10 },
  md: { p: '10px', fs: 14, r: 11 },
  lg: { p: '13px', fs: 16, r: 13 },
};

const OPTS = [
  { id: 'saida'   as TransactionTipo, label: 'Saída',   emoji: '💸', color: 'var(--red)'   },
  { id: 'entrada' as TransactionTipo, label: 'Entrada', emoji: '💰', color: 'var(--green)' },
];

export default function TypeToggle({
  value,
  onChange,
  size = 'md',
  showEmoji = true,
}: TypeToggleProps) {
  const cfg = SIZES[size];
  return (
    <div style={{ display: 'flex', gap: 5, background: 'rgba(255,255,255,.05)', borderRadius: cfg.r + 3, padding: 4 }}>
      {OPTS.map(t => {
        const on = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              flex: 1, padding: cfg.p, borderRadius: cfg.r,
              fontSize: cfg.fs, fontWeight: 700, border: 'none',
              background: on ? t.color : 'transparent',
              color: on ? '#fff' : t.color,
              transition: 'all .15s', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {showEmoji && <span style={{ fontSize: cfg.fs + 2 }}>{t.emoji}</span>}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
