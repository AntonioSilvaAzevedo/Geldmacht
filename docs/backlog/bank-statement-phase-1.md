# Backlog — Extratos bancários e lançamentos manuais — Fase 1

Documento vivo: registra o que a Fase 1 entregou e o que ficou explicitamente para a Fase 2. Data de referência: 2026-05-11.

## Objetivo da Fase 1

Criar a base de domínio e UX para:

- cadastro de **contas bancárias** pelo usuário;
- **lançamentos manuais** nessas contas, com categorias de escopo `bank`;
- extensão do model **`Transaction`** com `bank_account_id`, `source`, `transaction_type` e `notes`;
- **`import_kind`** no contrato de importação, sem implementar parser/upload de extrato real.

Sem conciliação, deduplicação avançada, OFX/CSV/PDF de extrato nem vínculo automático de imports antigos a `BankAccount`.

## Implementado nesta fase

### Backend (`geldmacht-api`)

- Model e tabela **`bank_accounts`** (`app/models/bank_account.py`).
- Migration **`g2h3i4j5k6l7`**: `bank_accounts` + colunas em `transactions`: `bank_account_id`, `source`, `transaction_type`, `notes`.
- **`GET/PATCH/POST/DELETE /api/bank-accounts`** (`DELETE` = soft delete, `is_active=false`).
- **`POST /api/transactions`** para lançamento manual em conta (`source=manual`, valida conta ativa e categoria `scope=bank` quando informada).
- **`POST /api/import`**: campo opcional **`import_kind`**; valor **`bank_statement`** → **501** (explicitamente não implementado). Inferência anterior mantida quando `import_kind` ausente. **`import_kind=credit_card_invoice`** exige compatibilidade com fatura de cartão.
- Transações criadas por import de **fatura** passam a receber **`source=pdf_invoice_import`** e **`transaction_type`** inferido (inclusive `payment` para pagamento de fatura).
- **`Category.scope`** aceita **`bank`**. Post com `scope=bank` não permite `card_id`.
- **`PATCH /api/transactions/{id}`**: regras de categoria conforme vínculo (`bank_account_id` → categorias `bank`; cartão → `credit_card`).
- Testes em **`tests/test_bank_accounts_and_manual_tx.py`**.

### Frontend (`geldmacht`)

- **`/contas`** — CRUD visual de contas bancárias, empty/loading/erro, aviso Fase 2.
- **`/lancamentos/novo`** — fluxo manual + atalhos para fatura / extrato futuro.
- Sidebar: **Contas**, ferramenta **Novo lançamento**.
- **`api.ts`**: `listBankAccounts`, `createBankAccount`, `updateBankAccount`, `deactivateBankAccount`, `createManualTransaction`, tipos **`ImportKind`** / **`ImportPayload`**, categorias **`scope` `bank`**.
- **`UploadPreview`**: envia **`import_kind: 'credit_card_invoice'`** no fluxo de fatura quando aplicável.
- **`/categorias`**: abas **Cartão de crédito** / **Conta bancária** para listar e criar categorias `bank`.

## Preparado para a Fase 2 (ainda não implementado)

_Tudo abaixo foi entregue na Fase 2 — ver `docs/backlog/bank-statement-phase-2.md`._

- ~~`/upload?type=bank_statement` + OFX + `BankAccount`~~
- ~~`import_kind=bank_statement` + persistência~~
- ~~Reuso do `UploadPreview` no modo extrato~~
- Deduplicação avançada / `ImportBatch` / hash de ficheiro (próximas fases).

## Fora do escopo da Fase 1

- Parser ou upload real de extrato bancário.
- Conciliação bancária.
- Categorização automática.
- Lançamento manual em **cartão** com resolução de fatura automática (pode vir em fase própria).
- Transferências entre contas como tipo de primeira classe.
- `ImportBatch` completo.

## Próxima fase recomendada

1. Implementar **`POST /api/import`** para `import_kind=bank_statement` com **`bank_account_id`** obrigatório e **`source=bank_statement_import`** nas linhas criadas.
2. UI de upload extrato + preview reutilizando **`UploadPreview`** (props `importKind`, seleção de conta, categorias `bank`).
3. Parser MVP (um formato estável ou um PDF de um banco).
4. Lista ou detalhe de movimentos por conta (se produto exigir).

## Decisões técnicas registadas

- **`BankAccount`** é entidade nova, distinta da tabela **`accounts`** (parser/legado tipo `nubank_pf`).
- **`DELETE` conta** apenas desativa; transações preservadas.
- **Entrada manual**: `amount` > 0; **saída**: `amount` < 0; `transaction_type` espelha o pedido (`income` / `expense`).
- **`import_kind` ausente** no JSON mantém compatibilidade com clientes que ainda não enviam o campo.
- Categorias de cartão e de banco são escopos separados (`credit_card` vs `bank`).
