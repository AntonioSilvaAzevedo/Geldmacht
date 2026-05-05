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
  raw_description: string;
  amount: number;
  account: string;
  is_internal_transfer: boolean;
  is_payment: boolean;
  category_id: number | null;
  installment_current: number | null;
  installment_total: number | null;
  category: string | null;
  category_group: string | null;
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
  summary?: InvoiceSummary;
}

/** Payload enviado ao POST /api/import. */
export interface ImportPayload {
  source_file: string;
  parser_used: string;
  card_id?: number | null;
  reference_month?: string | null;   // legado — usar invoice.due_month quando disponível
  invoice?: InvoiceCreate | null;
  transactions: PreviewTransaction[];
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
}

export interface CardInvoiceResponse {
  transactions: Transaction[];
  summary: InvoiceSummary;
}

export interface CreditCardConfig {
  id: number;
  user_id: number;
  name: string;
  institution: string | null;
  closing_day: number;
  due_day: number;
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
  scope: 'credit_card';
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryPayload {
  name: string;
  scope: 'credit_card';
  color?: string | null;
  icon?: string | null;
}

export interface CategoryUpdatePayload {
  name?: string;
  color?: string | null;
  icon?: string | null;
}

/** Parâmetros de filtro para GET /api/transactions. */
export interface TransactionFilters {
  account?:    string;
  month?:      string;   // "YYYY-MM"
  category?:   string;
  start_date?: string;   // "YYYY-MM-DD"
  end_date?:   string;   // "YYYY-MM-DD"
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

  /** Envia PDF/Excel para extração. NÃO persiste — apenas retorna preview. */
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const authHeader = await getAuthHeader();
    const form = new FormData();
    form.append('file', file);
    const r = await fetch(ENDPOINTS.upload, { method: 'POST', body: form, headers: authHeader });
    if (!r.ok) throw new Error(`Upload falhou (${r.status}): ${await r.text()}`);
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
    if (filters.limit  != null)   params.set('limit',      String(filters.limit));
    if (filters.offset != null)   params.set('offset',     String(filters.offset));
    const url = params.size
      ? `${ENDPOINTS.transactions}?${params}`
      : ENDPOINTS.transactions;
    return request<unknown[]>(url).then(data => {
      console.log('[api.getTransactions]', { url, data });
      return data;
    });
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

  listCards: (): Promise<CreditCardConfig[]> =>
    request<CreditCardConfig[]>(`${BASE}/api/cards`),

  getCard: (id: number): Promise<CreditCardConfig> =>
    request<CreditCardConfig>(`${BASE}/api/cards/${id}`),

  createCard: (payload: Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'>): Promise<CreditCardConfig> =>
    request<CreditCardConfig>(`${BASE}/api/cards`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCard: (id: number, payload: Partial<Pick<CreditCardConfig, 'name' | 'institution' | 'closing_day' | 'due_day'>>): Promise<CreditCardConfig> =>
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

  listCategories: (scope?: 'credit_card'): Promise<Category[]> => {
    const params = scope ? `?${new URLSearchParams({ scope })}` : '';
    return request<Category[]>(`${BASE}/api/categories${params}`);
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

};

// ── Named exports para compatibilidade com telas existentes ──────────────────
export const uploadFile         = api.uploadFile;
export const importTransactions = api.importTransactions;
export const getTransactions    = api.getTransactions;
export const checkHealth        = api.health;
