'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useInstitution } from '@/components/carteira/institution-context'

export default function InstitutionIndexPage() {
  const router = useRouter()
  const { slug, accounts, cards, loading } = useInstitution()

  useEffect(() => {
    if (loading) return
    if (accounts.length > 0) {
      router.replace(`/home/carteira/${slug}/extrato`)
    } else if (cards.length > 0) {
      router.replace(`/home/carteira/${slug}/cartao/faturas`)
    }
  }, [loading, accounts, cards, slug, router])

  return null
}
