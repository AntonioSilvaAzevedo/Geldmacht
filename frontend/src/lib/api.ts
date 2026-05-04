/**
 * api.ts — Camada de comunicação com o backend Geldmacht (FastAPI).
 *
 * Todas as chamadas ao backend passam por este arquivo.
 * Nenhuma tela deve chamar fetch() diretamente para o backend.
 */

import { config } from '@/config/env';

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
  installment_current: number | null;
  installment_total: number | null;
  category: string | null;
  category_group: string | null;
}

/** Resposta do POST /api/upload. */
export interface UploadResponse {
  parser_used: string;
  source_file: string;
  total_transactions: number;
  transactions: PreviewTransaction[];
}

/** Payload enviado ao POST /api/import. */
export interface ImportPayload {
  source_file: string;
  parser_used: string;
  transactions: PreviewTransaction[];
}

/** Resposta do POST /api/import. */
export interface ImportResponse {
  imported: number;
  skipped: number;
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

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
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
  uploadFile: (file: File): Promise<UploadResponse> => {
    const form = new FormData();
    form.append('file', file);
    return fetch(ENDPOINTS.upload, { method: 'POST', body: form })
      .then(async r => {
        if (!r.ok) throw new Error(`Upload falhou (${r.status}): ${await r.text()}`);
        return r.json() as Promise<UploadResponse>;
      });
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
    return request<unknown[]>(url);
  },

  /** Dados agregados para o Dashboard Anual. */
  getDashboardMonthly: () =>
    request(ENDPOINTS.dashboardMonthly),

};

// ── Named exports para compatibilidade com telas existentes ──────────────────
export const uploadFile         = api.uploadFile;
export const importTransactions = api.importTransactions;
export const getTransactions    = api.getTransactions;
export const checkHealth        = api.health;
