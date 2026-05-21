/**
 * importStore
 *
 * Armazena transitoriamente o arquivo selecionado + contexto de conta antes de
 * navegar para /upload. Necessário porque o Next.js App Router não suporta
 * passar um objeto File via router.push state.
 *
 * Padrão de uso:
 *   // Em ContaEmptyTransactions ao selecionar arquivo:
 *   setPendingImport(file, ctx);
 *   router.push(`/upload?type=bank_statement&bankAccountId=${ctx.accountId}`);
 *
 *   // Em upload/page.tsx no mount:
 *   const pending = consumePendingImport();
 *   if (pending) { handleFile(pending.file); setInstCtx(pending.ctx); }
 */

export interface ImportFileContext {
  accountId:    number;
  accountLabel: string;  // nome da conta, ex.: "Conta Uniclass"
  instName:     string;  // ex.: "Itaú Uniclass"
  instAbbr:     string;  // 1–2 chars para o avatar, ex.: "IU"
  instColor:    string;  // ex.: "#FF6B00"
  instSlug:     string;  // param da URL /carteira/[slug] para o botão Voltar
}

let _file: File | null = null;
let _ctx:  ImportFileContext | null = null;

/** Armazena arquivo + contexto para ser consumido em /upload. */
export function setPendingImport(file: File, ctx: ImportFileContext): void {
  _file = file;
  _ctx  = ctx;
}

/**
 * Lê e limpa o store.
 * Deve ser chamado uma única vez, no mount de /upload.
 */
export function consumePendingImport(): { file: File; ctx: ImportFileContext } | null {
  if (!_file || !_ctx) return null;
  const result = { file: _file, ctx: _ctx };
  _file = null;
  _ctx  = null;
  return result;
}
