/**
 * api.ts — Camada de comunicação com o backend Geldmacht (FastAPI).
 *
 * Todas as chamadas ao backend passam por este arquivo.
 * Nenhuma tela deve chamar fetch() diretamente para o backend.
 */

import { getSession, signOut } from 'next-auth/react';
import { config } from '@/config/env';
import type { Transaction } from '@/types/financial';

const BASE = config.apiUrl;

// ── Endpoints ────────────────────────────────────────────────────────────────

export const ENDPOINTS = {
  health:           `${BASE}/health`,
  upload:           `${BASE}/api/upload`,
  import:           `${BASE}/api/import`,
  transactions:     `${BASE}/api/transactions`,
  dashboardMonthly: `${BASE}/api/dashboard/monthly`,
} as const;

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Transação retornada pelo preview de upload (ainda não salva no banco). */
export interface PreviewTransaction {
  date: string;
  description: string;
  raw_description: string | null;
  amount: number;
  account: string;
  is_internal_transfer: boolean;
  is_payment: boolean;
  category_id: number | null;
  installment_current: number | null;
  installment_total: number | null;
  category: string | null;
  category_group: string | null;
  /** income | expense — preview OFX / extrato */
  transaction_type?: string | null;
  source_reference?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Metadados do extrato (OFX) no preview do upload. */
export interface StatementMetadata {
  institution?: string | null;
  account_id?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  ledger_balance?: number | null;
  total_inflows?: number | null;
  total_outflows?: number | null;
}

/** Resumo agregado de fatura de cartão calculado no backend. */
export interface InvoiceSummary {
  total_invoice: number;
  total_credits: number;
  payment_amount: number;
  payment_description: string;
  total_other_credits: number;
  total_other_credits_count: number;
  total_transactions: number;
  total_expenses: number;
  total_credits_count: number;
  largest_expense: number;
  largest_expense_description: string;
  total_installment_value: number;
  total_installment_count: number;
  future_commitment: number;
}

/**
 * Metadados reais da fatura extraídos do PDF (retornados no upload preview).
 * Campos de data são strings "YYYY-MM-DD".
 */
export interface InvoiceMetadata {
  invoice_label_month: string | null;  // "abril"
  due_date: string | null;             // "2026-04-13" — vencimento exato
  due_month: string | null;            // "2026-04" — derivado de due_date
  cycle_start_date: string | null;     // "2026-03-04" — início do período
  cycle_end_date: string | null;       // "2026-04-04" — fim do período
  issue_date: string | null;           // "2026-04-04" — emissão/envio
  closing_date: string | null;         // "2026-04-04" — fechamento
  total_amount: number | null;         // 12542.08 — "Total a pagar"
  source: string | null;              // "nubank_pdf"
}

/**
 * Payload de fatura enviado pelo frontend ao confirmar importação.
 * due_month é obrigatório para importações credit_card.
 */
export interface InvoiceCreate {
  due_month: string;
  due_date?: string | null;
  cycle_start_date?: string | null;
  cycle_end_date?: string | null;
  issue_date?: string | null;
  closing_date?: string | null;
  total_amount?: number | null;
  source?: string | null;
  raw_reference_month?: string | null;
}

/**
 * Fatura resumida retornada na listagem do cartão
 * (GET /api/cards/{id}/invoices).
 */
export interface CardInvoice {
  id: number;
  card_id: number;
  due_month: string;              // "2026-04"
  due_date: string | null;        // "2026-04-13"
  cycle_start_date: string | null;
  cycle_end_date: string | null;
  total_amount: number | null;    // do PDF
  computed_total: number;         // calculado das transactions
  transactions_count: number;
  label: string;                  // "Vencimento em Abril/2026"
}

/**
 * Fatura detalhada com metadados completos + transactions
 * (GET /api/cards/{id}/invoices/{invoice_id}).
 */
export interface CardInvoiceDetail {
  id: number;
  card_id: number;
  due_month: string;
  due_date: string | null;
  cycle_start_date: string | null;
  cycle_end_date: string | null;
  issue_date: string | null;
  closing_date: string | null;
  total_amount: number | null;
  source: string | null;
  raw_reference_month: string | null;
  created_at: string;
  transactions: Transaction[];
  summary: InvoiceSummary;
}

/** Resposta do POST /api/upload. */
export interface UploadResponse {
  parser_used: string;
  source_file: string;
  total_transactions: number;
  transactions: PreviewTransaction[];
  detected_reference_month?: string | null;   // legado — igual a invoice_metadata.due_month
  invoice_metadata?: InvoiceMetadata | null;
  summary?: InvoiceSummary | null;
  import_kind?: ImportKind | null;
  statement_metadata?: StatementMetadata | null;
  file_hash?: string | null;
  already_imported?: boolean;
  existing_import_batch?: ExistingImportBatchInfo | null;
}

/** Lote já importado retornado no preview quando arquivo é duplicado. */
export interface ExistingImportBatchInfo {
  id: number;
  file_name: string;
  imported_at: string | null;
  imported_count: number;
  skipped_count: number;
}

/** Histórico GET /api/bank-accounts/:id/import-batches */
export interface ImportBatchListItem {
  id: number;
  file_name: string;
  file_hash: string;
  parser_used: string;
  status: string;
  total_transactions: number;
  imported_count: number;
  skipped_count: number;
  period_start: string | null;
  period_end: string | null;
  imported_at: string | null;
}

/** Tipo de importação confirmada (Fase 1 — extrato real na Fase 2). */
export type ImportKind = 'credit_card_invoice' | 'bank_statement';

/** Payload enviado ao POST /api/import. */
export interface ImportPayload {
  source_file: string;
  parser_used: string;
  card_id?: number | null;
  reference_month?: string | null;   // legado — usar invoice.due_month quando disponível
  invoice?: InvoiceCreate | null;
  transactions: PreviewTransaction[];
  /** Omitido = backend infere pelo parser (compatível com clientes antigos). */
  import_kind?: ImportKind | null;
  bank_account_id?: number | null;
  /** Obrigatório no extrato OFX — mesmo valor do preview (file_hash). */
  file_hash?: string | null;
  /** Metadados do extrato OFX (preview). */
  period_start?: string | null;
  period_end?: string | null;
}

/** Resposta do POST /api/import. */
export interface ImportResponse {
  imported: number;
  skipped: number;
  card_id?: number | null;
  invoice_id?: number | null;
  due_month?: string | null;
  reference_month?: string | null;   // legado
  summary?: InvoiceSummary;
  bank_account_id?: number | null;
  /** Preenchido na importação de extrato bancário (OFX). */
  transactions?: Transaction[] | null;
  import_batch_id?: number | null;
}

export interface CardInvoiceResponse {
  transactions: Transaction[];
  summary: InvoiceSummary;
}

/** Item resumido de fatura usado em respostas agregadas (dashboard). */
export interface InvoiceMini {
  id: number;
  due_month: string;
  due_date: string | null;
  total_amount: number | null;
  computed_total: number;
}

/** Categoria principal agregada do dashboard. */
export interface TopCategoryItem {
  category_id: number | null;
  name: string;
  icon: string | null;
  total: number;
}

/** Resposta do GET /api/cards/{card_id}/dashboard. */
export interface CardDashboard {
  card_id: number;
  invoice_count: number;
  latest_invoice: InvoiceMini | null;
  monthly_average: number;
  highest_invoice: InvoiceMini | null;
  future_installments_total: number;
  invoice_evolution: InvoiceMini[];
  top_categories: TopCategoryItem[];
  recent_invoices: InvoiceMini[];
}

export type BankAccountType =
  | 'checking'
  | 'savings'
  | 'payment'
  | 'business'
  | 'investment'
  | 'other';

export interface BankAccountConfig {
  id: number;
  user_id: number;
  name: string;
  institution: string | null;
  account_type: BankAccountType;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankAccountPayload {
  name: string;
  institution?: string | null;
  institution_id?: number | null;
  account_type: BankAccountType;
  currency?: string;
  is_active?: boolean;
}

export interface InstitutionConfig {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  account_count: number;
  card_count: number;
}

export interface ManualTransactionPayload {
  transaction_type: 'income' | 'expense';
  amount: number;
  transaction_date: string;
  description: string;
  bank_account_id: number;
  category_id?: number | null;
  notes?: string | null;
}

export interface CreditCardConfig {
  id: number;
  user_id: number;
  name: string;
  institution: string | null;
  closing_day: number;
  due_day: number;
  /** Limite informado manualmente pelo usuário. null = não informado. */
  credit_limit: number | null;
  created_at: string;
  updated_at: string;
}

/** @deprecated Use CardInvoice. Mantido para compatibilidade com código legado. */
export interface CardInvoiceMonth {
  reference_month: string;
  label: string;
  total: number;
  transactions_count: number;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  scope: 'credit_card' | 'bank';
  color: string | null;
  icon: string | null;
  /** null = aplica em todos os cartões. */
  card_id: number | null;
  /** null = categoria principal. Preenchido = subcategoria (1 nível). */
  parent_id: number | null;
  /** null = sem limite. > 0 quando definido. */
  invoice_budget_limit: number | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryPayload {
  name: string;
  scope: 'credit_card' | 'bank';
  color?: string | null;
  icon?: string | null;
  card_id?: number | null;
  parent_id?: number | null;
  invoice_budget_limit?: number | null;
}

export interface ReleaseNote {
  id: number;
  version: string;
  title: string;
  description: string | null;
  items: string[];
  show_modal: boolean;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryUpdatePayload {
  name?: string;
  scope?: 'credit_card' | 'bank';
  color?: string | null;
  icon?: string | null;
  /** 0 limpa (vira global); >0 define o cartão. */
  card_id?: number | null;
  /** 0 limpa (vira categoria principal); >0 define a pai. */
  parent_id?: number | null;
  /** 0 remove o limite; >0 define. */
  invoice_budget_limit?: number | null;
}

/** Parâmetros de filtro para GET /api/transactions. */
export interface TransactionFilters {
  account?:    string;
  month?:      string;   // "YYYY-MM"
  category?:   string;
  start_date?: string;   // "YYYY-MM-DD"
  end_date?:   string;   // "YYYY-MM-DD"
  /** Lista apenas movimentações desta conta bancária (exclui cartão/fatura). */
  bank_account_id?: number;
  transaction_type?: 'income' | 'expense';
  limit?:      number;
  offset?:     number;
}

// ── Helper interno ────────────────────────────────────────────────────────────

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const session = await getSession();
    const token = (session as { accessToken?: string } | null)?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeader = await getAuthHeader();
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...authHeader },
    ...options,
  });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      // signOut limpa a sessão Auth.js antes de redirecionar,
      // evitando o loop: middleware vê sessão ativa → volta para /
      try {
        window.localStorage.removeItem('geldmacht_auth_version');
      } catch { /* ignore */ }
      await signOut({ callbackUrl: '/login', redirect: true });
      return undefined as T; // never reached
    }
    const detail = await res.text().catch(() => '');
    throw new Error(`API error ${res.status} — ${url}${detail ? `: ${detail}` : ''}`);
  }
  return res.json() as Promise<T>;
}

// ── API pública ───────────────────────────────────────────────────────────────

export const api = {

  /** Verifica se o backend está acessível. */
  health: (): Promise<boolean> =>
    fetch(ENDPOINTS.health, { signal: AbortSignal.timeout(3000) })
      .then(r => r.ok)
      .catch(() => false),

  /** Envia PDF/Excel/OFX para extração. NÃO persiste — apenas retorna preview. */
  uploadFile: async (
    file: File,
    opts?: { importKind?: ImportKind; bankAccountId?: number },
  ): Promise<UploadResponse> => {
    const authHeader = await getAuthHeader();
    const form = new FormData();
    form.append('file', file);
    if (opts?.importKind) {
      form.append('import_kind', opts.importKind);
    }
    if (opts?.bankAccountId != null) {
      form.append('bank_account_id', String(opts.bankAccountId));
    }
    const r = await fetch(ENDPOINTS.upload, { method: 'POST', body: form, headers: authHeader });
    if (!r.ok) {
      let msg = await r.text();
      try {
        const j = JSON.parse(msg) as { detail?: string | unknown };
        if (typeof j.detail === 'string') msg = j.detail;
        else if (Array.isArray(j.detail)) msg = JSON.stringify(j.detail);
      } catch { /* keep text */ }
      throw new Error(`Upload falhou (${r.status}): ${msg}`);
    }
    return r.json() as Promise<UploadResponse>;
  },

  /** Persiste as transações confirmadas no banco. */
  importTransactions: (payload: ImportPayload): Promise<ImportResponse> =>
    request<ImportResponse>(ENDPOINTS.import, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Lista transações salvas no banco com filtros opcionais. */
  getTransactions: (filters: TransactionFilters = {}): Promise<unknown[]> => {
    const params = new URLSearchParams();
    if (filters.account)          params.set('account',    filters.account);
    if (filters.month)            params.set('month',      filters.month);
    if (filters.category)         params.set('category',   filters.category);
    if (filters.start_date)       params.set('start_date', filters.start_date);
    if (filters.end_date)         params.set('end_date',   filters.end_date);
    if (filters.bank_account_id != null) params.set('bank_account_id', String(filters.bank_account_id));
    if (filters.transaction_type) params.set('transaction_type', filters.transaction_type);
    if (filters.limit  != null)   params.set('limit',      String(filters.limit));
    if (filters.offset != null)   params.set('skip',       String(filters.offset));
    const url = params.size
      ? `${ENDPOINTS.transactions}?${params}`
      : ENDPOINTS.transactions;
    return request<unknown[]>(url);
  },

  /** Lista fatura do cartão com summary calculado no backend. */
  getCardInvoice: (month: string): Promise<CardInvoiceResponse> => {
    const params = new URLSearchParams({ month });
    const url = `${ENDPOINTS.transactions}/invoice?${params}`;
    return request<CardInvoiceResponse>(url);
  },

  getCardInvoiceByCard: (cardId: number, month: string): Promise<CardInvoiceResponse> => {
    const params = new URLSearchParams({ month, card_id: String(cardId) });
    const url = `${ENDPOINTS.transactions}/invoice?${params}`;
    return request<CardInvoiceResponse>(url);
  },

  listBankAccounts: (includeInactive = false): Promise<BankAccountConfig[]> => {
    const q = includeInactive ? '?include_inactive=true' : '';
    return request<BankAccountConfig[]>(`${BASE}/api/bank-accounts${q}`);
  },

  listInstitutions: (): Promise<InstitutionConfig[]> =>
    request<InstitutionConfig[]>(`${BASE}/api/institutions`),

  createInstitution: (name: string): Promise<InstitutionConfig> =>
    request<InstitutionConfig>(`${BASE}/api/institutions`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getBankAccount: (id: number): Promise<BankAccountConfig> =>
    request<BankAccountConfig>(`${BASE}/api/bank-accounts/${id}`),

  listBankAccountImportBatches: (bankAccountId: number): Promise<ImportBatchListItem[]> =>
    request<ImportBatchListItem[]>(`${BASE}/api/bank-accounts/${bankAccountId}/import-batches`),

  createBankAccount: (payload: BankAccountPayload): Promise<BankAccountConfig> =>
    request<BankAccountConfig>(`${BASE}/api/bank-accounts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateBankAccount: (id: number, payload: Partial<BankAccountPayload>): Promise<BankAccountConfig> =>
    request<BankAccountConfig>(`${BASE}/api/bank-accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deactivateBankAccount: (id: number): Promise<{ deleted: boolean }> =>
    request<{ deleted: boolean }>(`${BASE}/api/bank-accounts/${id}`, { method: 'DELETE' }),

  createManualTransaction: (payload: ManualTransactionPayload): Promise<Transaction> =>
    request<Transaction>(ENDPOINTS.transactions, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listCards: (): Promise<CreditCardConfig[]> =>
    request<CreditCardConfig[]>(`${BASE}/api/cards`),

  getCard: (id: number): Promise<CreditCardConfig> =>
    request<CreditCardConfig>(`${BASE}/api/cards/${id}`),

  /**
   * Cria cartão. `credit_limit`:
   *   - omitido/null → cartão sem limite informado
   *   - >0 → valor do limite
   */
  createCard: (
    payload: Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'>
      & { credit_limit?: number | null; institution_id?: number | null },
  ): Promise<CreditCardConfig> =>
    request<CreditCardConfig>(`${BASE}/api/cards`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Edita cartão. `credit_limit` aceita sentinelas no PATCH:
   *   - undefined/ausente → não altera
   *   - 0 → remove limite (vira null)
   *   - >0 → define novo limite
   */
  updateCard: (
    id: number,
    payload: Partial<Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'>>
      & { credit_limit?: number | null },
  ): Promise<CreditCardConfig> =>
    request<CreditCardConfig>(`${BASE}/api/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteCard: (id: number): Promise<{ deleted: boolean }> =>
    request<{ deleted: boolean }>(`${BASE}/api/cards/${id}`, { method: 'DELETE' }),

  /**
   * Lista faturas reais (tabela Invoice) do cartão.
   * Retorna CardInvoice[] com due_date, ciclo, totais calculados.
   */
  getCardInvoices: (id: number): Promise<CardInvoice[]> =>
    request<CardInvoice[]>(`${BASE}/api/cards/${id}/invoices`),

  /** Dashboard agregado do cartão (visão geral). */
  getCardDashboard: (id: number): Promise<CardDashboard> =>
    request<CardDashboard>(`${BASE}/api/cards/${id}/dashboard`),

  /**
   * Retorna detalhes de uma fatura específica por invoice_id.
   * Inclui metadados completos (due_date, ciclo, issue_date) e summary.
   */
  getCardInvoiceDetail: (cardId: number, invoiceId: number): Promise<CardInvoiceDetail> =>
    request<CardInvoiceDetail>(`${BASE}/api/cards/${cardId}/invoices/${invoiceId}`),

  /**
   * Busca fatura do cartão por mês de vencimento (backward compat).
   * Usa o endpoint /cards/{cardId}/invoices-by-month/{due_month}.
   */
  getCardInvoiceByMonth: (cardId: number, dueMonth: string): Promise<CardInvoiceDetail> =>
    request<CardInvoiceDetail>(`${BASE}/api/cards/${cardId}/invoices-by-month/${dueMonth}`),

  /**
   * Retorna transactions de uma fatura usando invoice_id (prioritário)
   * ou card_id + month (legado).
   */
  getInvoiceTransactions: (params: {
    invoice_id?: number;
    card_id?: number;
    month?: string;
  }): Promise<CardInvoiceResponse> => {
    const p = new URLSearchParams();
    if (params.invoice_id != null) p.set('invoice_id', String(params.invoice_id));
    if (params.card_id != null)    p.set('card_id', String(params.card_id));
    if (params.month)              p.set('month', params.month);
    return request<CardInvoiceResponse>(`${ENDPOINTS.transactions}/invoice?${p}`);
  },

  listCategories: (scope?: 'credit_card' | 'bank', cardId?: number): Promise<Category[]> => {
    const p = new URLSearchParams();
    if (scope) p.set('scope', scope);
    if (cardId != null) p.set('card_id', String(cardId));
    const qs = p.toString();
    return request<Category[]>(`${BASE}/api/categories${qs ? `?${qs}` : ''}`);
  },

  createCategory: (payload: CategoryPayload): Promise<Category> =>
    request<Category>(`${BASE}/api/categories`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCategory: (id: number, payload: CategoryUpdatePayload): Promise<Category> =>
    request<Category>(`${BASE}/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteCategory: (id: number): Promise<{ deleted: boolean }> =>
    request<{ deleted: boolean }>(`${BASE}/api/categories/${id}`, { method: 'DELETE' }),

  /** Dados agregados para o Dashboard Anual. */
  getDashboardMonthly: () =>
    request(ENDPOINTS.dashboardMonthly),

  /** Edita descrição e/ou categoria de uma transação salva. */
  updateTransaction: (id: number, patch: { description?: string; category?: string; category_id?: number }): Promise<Transaction> =>
    request<Transaction>(`${ENDPOINTS.transactions}/${id}`, {
      method: 'PATCH',
      body:   JSON.stringify(patch),
    }),

  /**
   * Status do onboarding inicial para o usuário autenticado.
   * `should_show_onboarding=true` indica que o modal de boas-vindas deve aparecer.
   */
  getOnboardingStatus: (): Promise<{
    should_show_onboarding: boolean;
    onboarding_key: string;
    seen_at: string | null;
  }> => request(`${BASE}/api/onboarding/status`),

  /** Marca o onboarding inicial como visualizado (idempotente). */
  markOnboardingSeen: (): Promise<{ success: boolean; seen_at: string }> =>
    request(`${BASE}/api/onboarding/mark-seen`, { method: 'POST' }),

  /**
   * Lista acumulativa de release notes pendentes para o usuário.
   * Backend retorna `{ releases: [...] }` ordenadas da mais antiga para a
   * mais recente. Lista vazia quando não há pendências.
   */
  getPendingReleaseNotes: (): Promise<{ releases: ReleaseNote[] }> =>
    request<{ releases: ReleaseNote[] }>(`${BASE}/api/release-notes/pending`),

  /**
   * Marca múltiplas release notes como vistas (bulk, idempotente).
   * Use ao fechar o modal acumulativo.
   */
  markReleaseNotesSeen: (
    releaseNoteIds: number[],
  ): Promise<{ success: boolean; seen: boolean; marked_as_seen: number[] }> =>
    request(`${BASE}/api/release-notes/mark-seen`, {
      method: 'POST',
      body: JSON.stringify({ release_note_ids: releaseNoteIds }),
    }),

};

// ── Named exports para compatibilidade com telas existentes ──────────────────
export const uploadFile         = api.uploadFile;
export const importTransactions = api.importTransactions;
export const getTransactions    = api.getTransactions;
export const listBankAccountImportBatches = api.listBankAccountImportBatches;
export const checkHealth        = api.health;
