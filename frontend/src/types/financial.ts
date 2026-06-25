export interface MonthlyEntradas {
  salarioCLT: number;
  honorariosPJ: number;
  fgts: number;
  valeAlimentacao: number;
  cashback: number;
}

export interface MonthlyGastos {
  faturaCartao: number;
  fixosMoradia: number;
  valeGasto: number;
}

export interface MonthlyInvestimentos {
  acoes: number;
  fiis: number;
  etfs: number;
  bitcoin: number;
  rendaFixa: number;
}

export interface MonthData {
  month: string;
  year: number;
  entradas: MonthlyEntradas;
  gastos: MonthlyGastos;
  investimentos: MonthlyInvestimentos;
  totalEntradas: number;
  totalGastos: number;
  totalInvestimentos: number;
  saldoLiquido: number;
}

export type MonthlyData = Record<string, MonthData>;

export interface Transaction {
  id: number;
  date: string;
  description: string;
  raw_description: string | null;
  amount: number;
  account_id: number | null;
  account_type: string | null;   // 'nubank_pf' | 'nubank_pj' | 'nubank_cartao' | 'itau' | 'mercado_pago'
  card_id: number | null;
  invoice_id: number | null;     // âncora principal da fatura
  bank_account_id: number | null;
  /** Origem: pdf_invoice_import | bank_statement_import | manual */
  source: string | null;
  /** income | expense | transfer | payment | adjustment */
  transaction_type: string | null;
  /** Referência externa do extrato (ex.: FITID OFX). */
  source_reference?: string | null;
  notes: string | null;
  category: string | null;
  category_id: number | null;
  category_name: string | null;
  category_group: string | null;
  is_internal_transfer: boolean;
  is_payment: boolean;
  installment_current: number | null;
  installment_total: number | null;
  reference_month: string | null;   // legado
  billing_month: string | null;     // legado
  source_file: string | null;
  imported_at: string;
  /** Preenchido pelo backend (GET fatura / transações) quando category_ref + parent estão carregados. */
  category_display_label?: string | null;
  category_icon?: string | null;
  category_parent_id?: number | null;
  category_parent_name?: string | null;
  category_invoice_budget_limit?: number | null;
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
}

export type Transactions = Transaction[];

export interface CreditCardTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  installment: string | null;
}

export interface CreditCardMonth {
  month: string;
  period: string;
  dueDate: string;
  totalAmount: number;
  minimumPayment: number;
  transactions: CreditCardTransaction[];
  categorySummary: Record<string, number>;
}

export type CreditCardData = Record<string, CreditCardMonth>;

export interface InvestmentAsset {
  ticker: string;
  name: string;
  type: 'Ação' | 'FII' | 'ETF';
  segment?: string;
  sector?: string;
  subtype?: string;
  region?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  portfolioPercent: number;
}

export interface AportesMes {
  acoes: number;
  fiis: number;
  etfs: number;
  rendaFixa: number;
  total: number;
}

export interface InvestmentTotals {
  acoes: number;
  fiis: number;
  etfs: number;
  bitcoin: number;
  rendaFixa: number;
  patrimonio: number;
}

export interface InvestmentsData {
  lastUpdate: string;
  account: string;
  broker: string;
  assets: InvestmentAsset[];
  totals: InvestmentTotals;
  aportesMensais: Record<string, AportesMes>;
}

export interface DividendTransaction {
  date: string;
  ticker: string;
  type: 'Rendimento' | 'Dividendo' | 'JCP';
  quantity: number;
  unitValue: number;
  value: number;
}

export interface DividendMonth {
  total: number;
  byType: {
    Rendimento: number;
    Dividendo: number;
    JCP: number;
  };
  transactions: DividendTransaction[];
}

export type DividendsData = Record<string, DividendMonth>;
