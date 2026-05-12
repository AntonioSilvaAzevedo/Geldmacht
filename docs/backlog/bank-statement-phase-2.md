# Backlog — Extratos bancários — Fase 2

Documento vivo — Único ponto de referência para o que foi planejado e entregue no **extrato via conta bancária** (parser OFX MVP e evoluções 2.x). Histórico: entregues primeiro o **MVP Fase 2**, depois **lotes/hash/dedupe/histórico** (antes documentados como «Fase 2.1», agora fundidos aqui).

**Contexto de produto:** a [Fase 1](./bank-statement-phase-1.md) definiu conta bancária, categorias `scope=bank`, lançamento manual e `Transaction` ancilares.

---

## Objetivo (Fase 2)

Importação real de extrato usando **OFX genérico** (parser MVP), com preview, categorias `bank`, persistência em `Transaction` com `bank_account_id` e `source=bank_statement_import`, mais **rastreabilidade** (`ImportBatch`, `file_hash`), **dedupe reforçada** (FITID + fingerprint quando sem FITID) e **histórico de importações** na conta.

---

## Implementado — núcleo OFX (MVP inicial)

- Parser MVP OFX (`app/parsers/ofx_bank_statement.py`) — datas ISO, TRNAMT → income/expense, MEMO/NAME, FITID em `source_reference` e metadados OFX no preview. Suporta **SGML por linhas** (`<TAG>valor` + `\n`) e **XML por par na mesma linha** (`<TAG>valor</TAG>`, formato típico Nubank); `BANKACCTFROM` com fechamento `</BANKACCTFROM>`.
- `POST /api/upload` com `Form` `import_kind=bank_statement` + `.ofx`/`.qfx` — `parser_used=bank_statement_ofx`, `statement_metadata`, `transactions`.
- `POST /api/import` com `import_kind=bank_statement`, `bank_account_id`, sem `invoice`/cartão; categorias apenas `scope=bank`.
- Coluna `transactions.source_reference` (+ evoluções abaixo).
- `GET /api/transactions` com `bank_account_id`, `transaction_type`, `start_date`, `end_date` (movimentações só da conta — exclusão de `card_id`/`invoice_id`).
- Frontend: `/upload?type=bank_statement`, seleção de conta, OFX, preview em `UploadPreview` com categorias `bank`, bloco de metadados do extrato.
- Página `/contas/[id]` com listagem simples de movimentações e filtros entrada/saída.
- `api.ts`: `uploadFile` com `import_kind`, tipos de extrato/preview/import.

---

## Implementado — lotes, hash e dedupe (extensão 2.x / antiga «2.1»)

- **`ImportBatch`** (`import_batches`): `user_id`, `bank_account_id`, `import_kind` (`bank_statement`), `source_type` (`ofx` no MVP), `file_name`, `file_hash`, `parser_used`, `status` (`imported` \| `partially_imported` \| `failed`), contadores (`total_transactions`, `imported_count`, `skipped_count`), `period_start` / `period_end` (quando enviados a partir do `statement_metadata` do preview), `imported_at`, timestamps. FK conta `ON DELETE RESTRICT`.
- **`Transaction.import_batch_id`** (nullable FK `RESTRICT`): preenchido nas importações de extrato confirmadas; manual/fatura = `null`.
- **`transaction_fingerprint`** (nullable, SHA256 hex): quando não há FITID; dedupe secundária (`user_id` + conta + `source=bank_statement_import`).
- **`file_hash`**: SHA256 (hex 64) calculado no **backend** em `POST /api/upload` (ramo extrato OFX).
- **`POST /api/upload`** (`bank_statement`): exige **`bank_account_id`** no Form; `file_hash`; se já existe lote concluído para o mesmo utilizador/conta/hash → `already_imported` + `existing_import_batch`.
- **`POST /api/import`** (`bank_statement`): exige **`file_hash`** (hex 64); **409** se o mesmo conteúdo já foi importado na conta; cria **`ImportBatch`**, contadores/status, resposta **`import_batch_id`**; opcional `period_start` / `period_end`.
- **Dedupe** (`app/services/bank_statement_import.py`): prioridade **`source_reference`** (FITID) `(user_id, bank_account_id, source, source_reference)`; senão **`transaction_fingerprint`** (descrição normalizada + data + montante padronizado).
- **`GET /api/bank-accounts/{id}/import-batches`**: histórico por conta/utilizador, mais recentes primeiro.
- Frontend: multipart com `bank_account_id`; alerta «arquivo já importado»; **`listBankAccountImportBatches`**; **`/contas/[id]`** — secção «Histórico de importações».
- Migração Alembic **`i9j0k1l2m3n4`**; testes em `tests/test_bank_accounts_and_manual_tx.py`, `tests/test_ofx_bank_statement.py`.

---

## Pendente ou evoluções futuras

- Endpoint **`GET /api/import-batches/{id}`** (detalhe + transações).
- Reimportação forçada com override explícito e auditoria.
- Parsing OFX mais rico (**cartão / investimento** `CREDITCARDMSGSRSV1`, `INV*`).
- CSV ou PDF pontual por banco.
- Conciliação bancária; transferências entre contas como tipo completo.

---

## Fora do escopo (esta fase / roadmap distinto)

- Deduplicação «perfeita» (fingerprints podem colidir para lançamentos genuinamente repetidos iguais no mesmo dia).
- Lançamento por voz.

---

## Decisões técnicas consolidadas

- Identificação de ficheiro por **conteúdo** (`file_hash`), não pelo nome do ficheiro.
- Reimportação do **mesmo** conteúdo na **mesma** conta (mesmo utilizador) bloqueada no preview e com **409** no import (MVP). Outra conta ou outro utilizador → permitido.
- Entre preview e confirmar o cliente reenvia o **`file_hash`** (sem novo upload de bytes neste MVP).
- Cada `POST /api/import` de extrato cria **`ImportBatch`** mesmo que todas as linhas sejam skip (histórico).
- Esta dedupe **não** substitui conciliação contabilística nem **rollback** automatizado.

---

## Limitações conhecidas

- **Fingerprint**: falsos positivos possíveis sem FITID.
- **FITID** preferível quando presente no OFX.
- **Sem desfazer importação**: futuro produto/trabalho manual.

---

## Referências

- Planeamento conta/categorias: `docs/backlog/bank-statement-phase-1.md`.
- Backend: parsers `ofx_bank_statement`, serviço `bank_statement_import`, rotas `upload`, `import_transactions`, `bank_accounts`.
- Análises exploratórias antigas foram substituídas por este backlog após implementação.
