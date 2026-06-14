export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

export function toSlug(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase())
}

export function matchesInstitution(field: string | null, name: string): boolean {
  return (
    (field?.trim() || 'sem instituição').toLowerCase() === name.toLowerCase()
  )
}

export function deriveDisplayName(
  accounts: { institution: string | null }[],
  cards: { institution: string | null }[],
  fallback: string,
): string {
  return (
    accounts[0]?.institution?.trim() ||
    cards[0]?.institution?.trim() ||
    fallback
  )
}
