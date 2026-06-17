export function parseInstitutionId(slug: string): number | null {
  const id = Number(slug)
  return Number.isInteger(id) && id > 0 ? id : null
}
