'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { useInstitutionDetail } from '@/hooks/use-institution-detail'
import { decodeSlug } from '@/lib/carteira/institution-helpers'
import { getInstitutionColor } from '@/lib/institutionColors'
import type { InstitutionDetail } from '@/lib/carteira/types'

export interface InstitutionContextValue extends InstitutionDetail {
  institutionName: string
  institutionColor: string
  slug: string
  refetch: () => void
}

const InstitutionContext = createContext<InstitutionContextValue | null>(null)

export interface InstitutionProviderProps {
  slug: string
  children: ReactNode
}

export function InstitutionProvider({ slug, children }: InstitutionProviderProps) {
  const institutionName = decodeSlug(slug)
  const detail = useInstitutionDetail(institutionName)

  const value: InstitutionContextValue = {
    ...detail,
    institutionName,
    slug,
    institutionColor: getInstitutionColor(
      detail.displayName || institutionName,
    ),
    refetch: detail.refetch,
  }

  return (
    <InstitutionContext.Provider value={value}>
      {children}
    </InstitutionContext.Provider>
  )
}

export function useInstitution(): InstitutionContextValue {
  const context = useContext(InstitutionContext)
  if (!context) {
    throw new Error('useInstitution must be used within InstitutionProvider')
  }
  return context
}
