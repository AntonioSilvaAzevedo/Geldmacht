/**
 * AccountCard
 *
 * Card de detalhe de conta bancária. Exibido na aba "Conta" do InstitutionDetail,
 * logo abaixo do InstitutionHeader. Seguido por KPIStrip e lista de lançamentos.
 *
 * Uso básico:
 *   <AccountCard
 *     inst={{ name: 'Nubank', abbr: 'NU', color: '#820AD1' }}
 *     conta={{ label: 'Conta PF', number: '4365066-8', balance: 3240.50, type: 'Conta pagamento' }}
 *     onAction={() => router.push(`/carteira/nubank`)}
 *   />
 *
 * Com slot de ações customizado:
 *   <AccountCard
 *     inst={...}
 *     conta={...}
 *     right={
 *       <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'flex-end' }}>
 *         <button onClick={onImport}>Importar OFX</button>
 *         <button onClick={onView}>Ver movimentações →</button>
 *       </div>
 *     }
 *   />
 */

import { formatCurrency } from '@/lib/formatters';

export interface AccountCardInst {
  /** Nome da instituição */
  name: string;
  /** Sigla exibida no avatar (1–2 chars) */
  abbr: string;
  /** Cor de marca da instituição (hex) */
  color: string;
}

export interface AccountCardConta {
  /** Nome exibido da conta (ex: "Conta PF", "Conta PJ") */
  label: string;
  /** Número da conta. null = não exibir */
  number: string | null;
  /** Saldo atual */
  balance: number;
  /** Tipo de conta exibido no rodapé. Default: "Conta pagamento" */
  type?: string;
}

export interface AccountCardProps {
  inst: AccountCardInst;
  conta: AccountCardConta;
  /** Callback do botão de ação padrão. Omitir oculta o botão */
  onAction?: () => void;
  /** Label do botão de ação. Default: "Ver movimentações →" */
  actionLabel?: string;
  /** Substitui o botão padrão — use para múltiplas ações ou CTAs customizados */
  right?: React.ReactNode;
}

export default function AccountCard({
  inst,
  conta,
  onAction,
  actionLabel = 'Ver movimentações →',
  right,
}: AccountCardProps) {
  const balanceColor =
    conta.balance > 0 ? '#30D158'
    : conta.balance < 0 ? '#FF453A'
    : 'rgba(255,255,255,0.35)';

  return (
    <div style={{
      borderRadius: 20,
      padding: '22px 24px 18px',
      background: `linear-gradient(135deg,${inst.color}1a 0%,rgba(0,0,0,0) 60%),#1C1C1E`,
      border: `1px solid ${inst.color}33`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* decorative circle */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 140, height: 140, borderRadius: '50%',
        background: `${inst.color}18`,
        pointerEvents: 'none',
      }} />

      {/* top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          {/* institution badge + account name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: inst.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#fff',
            }}>
              {inst.abbr}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {conta.label}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)' }}>
                {inst.name}{conta.number ? ` · ${conta.number}` : ''}
              </div>
            </div>
          </div>

          {/* balance */}
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 5,
          }}>
            Saldo atual
          </div>
          <div style={{
            fontFamily: 'var(--font-mono, "DM Mono", monospace)',
            fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em',
            lineHeight: 1, color: balanceColor,
          }}>
            {formatCurrency(conta.balance)}
          </div>
        </div>

        {/* right slot — custom > default button */}
        {right ?? (onAction && (
          <button onClick={onAction} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 13px', borderRadius: 9,
            background: 'rgba(10,132,255,0.12)',
            border: '1px solid rgba(10,132,255,0.30)',
            color: '#0A84FF', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', flexShrink: 0,
          }}>
            {actionLabel}
          </button>
        ))}
      </div>

      {/* footer */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
        {conta.type ?? 'Conta pagamento'} · BRL
      </div>
    </div>
  );
}
