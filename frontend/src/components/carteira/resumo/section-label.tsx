export interface SectionLabelProps {
  label: string
}

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <div className="border-b border-white/[0.07] px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
      {label}
    </div>
  )
}
