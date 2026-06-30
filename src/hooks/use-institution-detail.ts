'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  api,
  type BankAccountConfig,
  type CardDashboard,
  type CreditCardConfig,
} from '@/lib/api'
import type { InstitutionDetail } from '@/lib/carteira/types'

export function useInstitutionDetail(institutionId: number | null) {
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
    if (institutionId == null) {
      setLoading(false)
      setError('Instituição inválida.')
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [institutions, allAccounts, allCards] = await Promise.all([
          api.listInstitutions(),
          api.listBankAccounts(false),
          api.listCards(),
        ])

        const institution = institutions.find((i) => i.id === institutionId)
        const filteredAccounts = allAccounts.filter(
          (account) => account.institution_id === institutionId,
        )
        const filteredCards = allCards.filter(
          (card) => card.institution_id === institutionId,
        )

        const dashMap = new Map<number, CardDashboard>()
        const results = await Promise.allSettled(
          filteredCards.map((card) => api.getCardDashboard(card.id)),
        )
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            dashMap.set(filteredCards[index].id, result.value)
          }
        })

        if (cancelled) return

        setAccounts(filteredAccounts)
        setCards(filteredCards)
        setDashboards(dashMap)
        setDisplayName(
          institution?.name ||
            filteredAccounts[0]?.institution ||
            filteredCards[0]?.institution ||
            '',
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
  }, [institutionId, reloadKey])

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
