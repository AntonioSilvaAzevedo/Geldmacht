/**
 * KPIStrip
 *
 * Faixa horizontal de métricas numéricas. Reutilizada em múltiplas telas:
 *   — Aba Conta do InstitutionDetail  (Entradas / Saídas / Saldo do mês)
 *   — Tela Movimentações              (Entradas / Saídas / Saldo)
 *   — Fatura Dashboard                (Média / Maior / Parcelas futuras)
 *   — Carteira Hub                    (Saldo / Faturas / Investimentos / Patrimônio)
 *
 * Props:
 *   items  — { label, value, color?, sub? }[]  2–4 métricas (value já formatado)
 *   mb     — number?                           margin-bottom em px (default: 14)
 */

export interface KPIItem {
  label: string;
  /** Valor já formatado como string — use formatCurrency() antes de passar */
  value: string;
  /** Cor do valor. Omitir = var(--text-primary) */
  color?: string;
  /** Sublabel opcional abaixo do valor */
  sub?: string;
}

export interface KPIStripProps {
  items: KPIItem[];
  /** margin-bottom em px. Default: 14 */
  mb?: number;
}

export default function KPIStrip({ items, mb = 14 }: KPIStripProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      background: 'var(--surface-card)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: mb,
    }}>
      {items.map((k, i) => (
        <div key={i} style={{
          padding: '13px 15px',
          borderRight: i < items.length - 1 ? '1px solid var(--separator)' : 'none',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6,
          }}>
            {k.label}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 15, fontWeight: 700,
            color: k.color ?? 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            {k.value}
          </div>
          {k.sub && (
            <div style={{ fontSize: 10, color: 'var(--text-quaternary)', marginTop: 4 }}>
              {k.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
