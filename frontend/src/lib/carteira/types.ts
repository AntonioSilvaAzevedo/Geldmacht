import type {
  BankAccountConfig,
  CardDashboard,
  CreditCardConfig,
} from '@/lib/api'

export interface InstitutionDetail {
  accounts: BankAccountConfig[]
  cards: CreditCardConfig[]
  dashboards: Map<number, CardDashboard>
  displayName: string
  loading: boolean
  error: string | null
}
