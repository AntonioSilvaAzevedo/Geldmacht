import { SectionLabel } from '@/components/carteira/resumo/section-label'
import { ResumoRow } from '@/components/carteira/resumo/resumo-row'

export interface StatsSectionProps {
  displayName: string
}

export function StatsSection({ displayName }: StatsSectionProps) {
  return (
    <div className="mb-2.5 overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--surface-card)]">
      <SectionLabel label="Informações" />
      <ResumoRow last>
        <span className="text-[13px] text-[var(--text-secondary)]">
          Instituição
        </span>
        <span className="text-[13px] font-medium text-[var(--text-primary)]">
          {displayName}
        </span>
      </ResumoRow>
    </div>
  )
}
