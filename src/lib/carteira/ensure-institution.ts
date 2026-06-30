import { api } from '@/lib/api'

export async function ensureInstitutionId(name: string): Promise<number | null> {
  const trimmed = name.trim()
  if (!trimmed) return null

  const existing = await api.listInstitutions()
  const match = existing.find(
    (institution) => institution.name.toLowerCase() === trimmed.toLowerCase(),
  )
  if (match) return match.id

  try {
    const created = await api.createInstitution(trimmed)
    return created.id
  } catch {
    const after = await api.listInstitutions()
    return (
      after.find(
        (institution) => institution.name.toLowerCase() === trimmed.toLowerCase(),
      )?.id ?? null
    )
  }
}
