'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  api,
  type BankAccountConfig,
  type CardDashboard,
  type CreditCardConfig,
} from '@/lib/api'
import {
  deriveDisplayName,
  matchesInstitution,
} from '@/lib/carteira/institution-helpers'
import type { InstitutionDetail } from '@/lib/carteira/types'

export function useInstitutionDetail(institutionName: string) {
  const [accounts, setAccounts] = useState<BankAccountConfig[]>([])
  const [cards, setCards] = useState<CreditCardConfig[]>([])
  const [dashboards, setDashboards] = useState<Map<number, CardDashboard>>(
    new Map(),
  )
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    if (!institutionName) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [allAccounts, allCards] = await Promise.all([
          api.listBankAccounts(false),
          api.listCards(),
        ])

        const filteredAccounts = allAccounts.filter((account) =>
          matchesInstitution(account.institution, institutionName),
        )
        const filteredCards = allCards.filter((card) =>
          matchesInstitution(card.institution, institutionName),
        )

        const dashMap = new Map<number, CardDashboard>()
        await Promise.allSettled(
          filteredCards.map(async (card) => {
            try {
              dashMap.set(card.id, await api.getCardDashboard(card.id))
            } catch {
              /* skip */
            }
          }),
        )

        if (cancelled) return

        setAccounts(filteredAccounts)
        setCards(filteredCards)
        setDashboards(dashMap)
        setDisplayName(
          deriveDisplayName(filteredAccounts, filteredCards, institutionName),
        )
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Erro ao carregar instituição.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [institutionName, reloadKey])

  const detail: InstitutionDetail = {
    accounts,
    cards,
    dashboards,
    displayName,
    loading,
    error,
  }

  return { ...detail, refetch }
}
