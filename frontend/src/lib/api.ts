/**
 * api.ts — Camada de comunicação com o backend Geldmacht (FastAPI).
 *
 * Variável de ambiente: NEXT_PUBLIC_API_URL (padrão: http://localhost:8000)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Transação retornada pelo preview de upload (ainda não salva no banco). */
export interface PreviewTransaction {
  date: string;                  // "YYYY-MM-DD"
  description: string;
  raw_description: string;
  amount: number;                // positivo = entrada, negativo = saída
  account: string;               // "nubank_pf" | "nubank_pj" | "itau" | ...
  is_internal_transfer: boolean;
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

/** Transação salva no banco (retornada pelo GET /api/transactions). */
export interface Transaction {
  id: number;
  date: string;
  description: string;
  raw_description: string;
  amount: number;
  account: string;
  is_internal_transfer: boolean;
  category: string | null;
  category_group: string | null;
}

/** Parâmetros de filtro para GET /api/transactions. */
export interface TransactionFilters {
  account?: string;
  category?: string;
  start_date?: string;  // "YYYY-MM-DD"
  end_date?: string;    // "YYYY-MM-DD"
  limit?: number;
  offset?: number;
}

// ─── Funções ──────────────────────────────────────────────────────────────────

/**
 * Envia um PDF ou Excel para o backend e recebe o preview das transações.
 * NÃO persiste no banco — apenas extrai e retorna.
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Upload falhou (${res.status}): ${detail}`);
  }

  return res.json() as Promise<UploadResponse>;
}

/**
 * Importa transações selecionadas pelo usuário para o banco SQLite.
 * Recebe apenas as transações que o usuário marcou para importar.
 */
export async function importTransactions(
  payload: ImportPayload
): Promise<ImportResponse> {
  const res = await fetch(`${API_BASE}/api/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Importação falhou (${res.status}): ${detail}`);
  }

  return res.json() as Promise<ImportResponse>;
}

/**
 * Busca as transações já salvas no banco com filtros opcionais.
 */
export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  const params = new URLSearchParams();

  if (filters.account)    params.set("account", filters.account);
  if (filters.category)   params.set("category", filters.category);
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date)   params.set("end_date", filters.end_date);
  if (filters.limit != null)  params.set("limit", String(filters.limit));
  if (filters.offset != null) params.set("offset", String(filters.offset));

  const url = `${API_BASE}/api/transactions${params.size ? `?${params}` : ""}`;
  const res = await fetch(url);

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Erro ao buscar transações (${res.status}): ${detail}`);
  }

  return res.json() as Promise<Transaction[]>;
}

/**
 * Verifica se o backend está acessível (health check).
 * Útil para mostrar estado de conexão na UI.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
