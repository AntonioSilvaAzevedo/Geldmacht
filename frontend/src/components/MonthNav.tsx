/**
 * MonthNav
 *
 * Barra de navegação entre períodos (meses ou faturas) com setas ← →.
 * Usada em:
 *   — Tela Movimentações   (meses da conta, no nav slot do PageHeader)
 *   — Tela Fatura Detalhe  (faturas do cartão, no nav slot do PageHeader)
 *
 * Props:
 *   items       — { label, short }[]   lista de períodos em ordem cronológica
 *   idx         — number               índice do período ativo (controlled)
 *   onNavigate  — (idx: number) => void
 *   size        — 'md' | 'sm'          tamanho dos botões (default: 'md')
 *   centerLabel — boolean              exibe o label no centro (default: true)
 *   centerSub   — string?              subtítulo abaixo do label central
 */

export interface MonthNavItem {
  label: string;
  short: string;
}

export interface MonthNavProps {
  items: MonthNavItem[];
  idx: number;
  onNavigate: (idx: number) => void;
  size?: 'md' | 'sm';
  centerLabel?: boolean;
  centerSub?: string;
}

export default function MonthNav({
  items, idx, onNavigate,
  size = 'md', centerLabel = true, centerSub,
}: MonthNavProps) {
  const prev = idx > 0 ? items[idx - 1] : null;
  const next = idx < items.length - 1 ? items[idx + 1] : null;
  const sm = size === 'sm';

  const btnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: sm ? 4 : 5,
    padding: sm ? '5px 10px' : '7px 12px',
    borderRadius: sm ? 8 : 10,
    border: '1px solid',
    borderColor: active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
    background: 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-quaternary)',
    fontSize: sm ? 11 : 12,
    cursor: active ? 'pointer' : 'not-allowed',
    transition: 'all 0.12s',
    fontFamily: 'var(--font-sans)',
  });

  const ChevL = () => (
    <svg width={sm ? 11 : 13} height={sm ? 11 : 13} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );

  const ChevR = () => (
    <svg width={sm ? 11 : 13} height={sm ? 11 : 13} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* ← Prev */}
      <button
        type="button"
        disabled={!prev}
        onClick={() => prev && onNavigate(idx - 1)}
        style={btnStyle(!!prev)}
        onMouseEnter={e => { if (prev) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <ChevL /> {prev ? prev.short : '—'}
      </button>

      {/* Centro */}
      {centerLabel && items[idx] && (
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: sm ? 13 : 15, fontWeight: 700,
            letterSpacing: '-0.015em', lineHeight: 1.2,
            color: 'var(--text-primary)',
          }}>
            {items[idx].label}
          </div>
          {centerSub && (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
              {centerSub}
            </div>
          )}
        </div>
      )}

      {/* → Next */}
      <button
        type="button"
        disabled={!next}
        onClick={() => next && onNavigate(idx + 1)}
        style={btnStyle(!!next)}
        onMouseEnter={e => { if (next) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        {next ? next.short : '—'} <ChevR />
      </button>
    </div>
  );
}
