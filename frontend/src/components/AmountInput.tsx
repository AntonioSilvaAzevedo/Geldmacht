'use client';

import { useEffect, useRef } from 'react';
import type { TransactionTipo } from './TypeToggle';
import { formatCurrencyInput } from '@/lib/formatters';

interface AmountInputProps {
  /** Dígitos brutos, ex: "123456" → exibe "1.234,56". Estado mantido pelo pai. */
  value: string;
  /** Chamado com a nova string de dígitos (nunca formatada). */
  onChange: (digits: string) => void;
  type?: TransactionTipo;
  autoFocus?: boolean;
  onEnter?: () => void;
}

const MAX_DIGITS = 13; // 99.999.999.999,99

export default function AmountInput({
  value,
  onChange,
  type = 'saida',
  autoFocus = false,
  onEnter,
}: AmountInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const colour    = type === 'saida' ? 'var(--red)' : 'var(--green)';
  const hasVal    = value.length > 0 && parseInt(value, 10) > 0;
  const borderCol = hasVal
    ? type === 'saida' ? 'rgba(255,69,58,.4)' : 'rgba(48,209,88,.4)'
    : 'rgba(255,255,255,.1)';

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter?.();
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      onChange(value.slice(0, -1));
      return;
    }
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      if (value.length < MAX_DIGITS) onChange(value + e.key);
      return;
    }
    // Tab, Escape, Arrow keys etc. passam normalmente
  }

  const displayValue = formatCurrencyInput(value);

  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontFamily: 'var(--font-mono)', fontSize: 17, color: 'var(--t3)', fontWeight: 500,
        pointerEvents: 'none', zIndex: 1,
      }}>
        R$
      </span>
      <input
        ref={ref}
        value={displayValue}
        onChange={() => { /* controlado via onKeyDown */ }}
        onKeyDown={handleKeyDown}
        placeholder="0,00"
        inputMode="numeric"
        style={{
          width: '100%',
          paddingLeft: 44, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
          borderRadius: 11,
          border: `1.5px solid ${borderCol}`,
          background: 'var(--surface-card)',
          color: hasVal ? colour : 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em',
          height: 58,
          transition: 'border-color .2s, color .15s',
          outline: 'none',
          cursor: 'text',
        }}
      />
    </div>
  );
}
