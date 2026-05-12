# 📋 Progresso — Fase 2 (Backend)

> **Status: ✅ Fase 2 completa (29/04/2026) — todas as 3 etapas concluídas**

Acompanhamento do progresso da Fase 2, dividida em 3 etapas sequenciais.
Ver especificação completa em [`FASE-2-BACKEND.md`](./FASE-2-BACKEND.md).

---

## Etapa 2.1 — Backend + Parser Nubank PF

**Objetivo:** API rodando e conseguindo ler o extrato Nubank PF corretamente.
**Marco de validação:** enviar extrato PDF → ver transações extraídas no Postman/terminal.

| # | Item | Status |
|---|---|---|
| 1 | Estrutura `backend/` criada (FastAPI) | ✅ |
| 2 | Ambiente virtual Python + `requirements.txt` | ✅ |
| 3 | Banco SQLite com schema via Alembic | ✅ |
| 4 | Endpoint `POST /api/upload` | ✅ |
| 5 | Parser Nubank PF funcional | ✅ |
| 6 | Endpoint `GET /api/transactions` | ✅ |
| 7 | Detecção de transferências internas (`is_internal_transfer`) | ✅ |
| 8 | 26 testes passando (fixture sintética + PDF gerado) | ✅ |
| 9 | Marco validado: upload → preview JSON correto | ✅ |

**Iniciada em:** 28/04/2026
**Concluída em:** 28/04/2026

---

## Etapa 2.2 — Todos os Parsers

**Objetivo:** todos os tipos de arquivo que o Antonio usa sendo parseados.
**Marco de validação:** enviar cada tipo de arquivo → transações corretas para todos.

| # | Item | Status |
|---|---|---|
| 1 | Parser Nubank PJ | ✅ |
| 2 | Parser Itaú Uniclass | ✅ |
| 3 | Parser Mercado Pago | ✅ |
| 4 | Parser Fatura Cartão Nubank | ✅ |
| 5 | Parser B3 — Posição (`.xlsx`) | ⚫ (sem arquivo disponível) |
| 6 | Parser B3 — Movimentação (`.xlsx`) | ⚫ (sem arquivo disponível) |
| 7 | Parser B3 — Negociação (`.xlsx`) | ⚫ (sem arquivo disponível) |
| 8 | Detecção automática do tipo de arquivo | ✅ |
| 9 | Detecção de duplicatas | ⚫ (Etapa 2.3) |
| 10 | Categorização removida do backend (feita no frontend) | ✅ |
| 11 | Testes existentes passando (26/26) | ✅ |
| 12 | Documentação automática FastAPI (`/docs`) | ✅ |

**Iniciada em:** 29/04/2026
**Concluída em:** 29/04/2026

### Resultados com PDFs reais

| Parser | `account` | Arquivo | Txs extraídas |
|---|---|---|---|
| NubankPFParser | `nubank_pf` | teste-1.pdf (mar/2026) | 93 |
| NubankPJParser | `nubank_pj` | PJ.pdf (mar/2026) | 6 |
| ItauParser | `itau` | Itau.pdf (jan–abr/2026) | 20 |
| FaturaCartaoNubankParser | `nubank_cartao` | fatura.pdf (mar/2026) | 104 |
| MercadoPagoParser | `mercado_pago` | MercadoPago.pdf (mar/2026) | 53 |

---

## Etapa 2.3 — Tela de Upload + Seleção de Lançamentos

**Objetivo:** fluxo completo — upload → preview → selecionar → importar → ver no Dashboard.

| # | Item | Status |
|---|---|---|
| 1 | Tela `/upload` no frontend (drag-and-drop) | ✅ |
| 2 | Preview de lançamentos detectados | ✅ |
| 3 | Checkboxes individuais por lançamento | ✅ |
| 4 | "Selecionar todos" / "Desmarcar todos" | ✅ |
| 5 | Edição inline de categoria antes de confirmar | ✅ |
| 6 | Transferências internas: ⚠️ desmarcadas por padrão | ✅ |
| 7 | Filtros: Todos / Entradas / Saídas / Transferências + busca por texto | ✅ |
| 8 | Botão "Importar selecionados" | ✅ |
| 9 | Endpoint `POST /api/import` — deduplicação + persistência SQLite | ✅ |
| 10 | `frontend/src/lib/api.ts` — camada tipada frontend↔backend | ✅ |
| 11 | Item "Importar" na Sidebar | ✅ |
| 12 | Tela de confirmação com contagem + link "Ver no Dashboard" | ✅ |
| 13 | Build de produção limpo (zero erros TS/ESLint) | ✅ |
| 14 | Dashboard consume dados do banco (Fase 3) | ⚫ |

**Iniciada em:** 29/04/2026
**Concluída em:** 29/04/2026

---

## 📌 Notas de bastidores

**29/04/2026 — Etapa 2.2:**
- Categorização removida do backend — para MVP, `category` e `category_group` voltam `null`. Categorização será feita no frontend, evitando acoplamento de regras pessoais no servidor.
- `is_internal_transfer` mantido no backend — é detecção estrutural (baseada em números de conta), não preferência do usuário.
- `INTERNAL_ACCOUNT_HINTS` separado de `OWN_ACCOUNTS`: remove o nome do titular e o número da própria conta (aparecem em toda transferência como remetente/fonte), evitando falsos positivos.
- Footer legal do Nubank apendado em última transação → adicionados padrões ao `_SKIP_RE`.
- `NubankPJParser` herda `NubankPFParser` inteiramente (formatos idênticos) — apenas `ACCOUNT_KEY` e `_IDENTIFIERS` diferentes.
- `MercadoPagoParser` usa state machine com pré/pós-descrição: descrição da transação é particionada em 3 partes pelo pdfplumber (antes, inline, depois da linha de dados).
- Regra do sufixo no MercadoPago: só espera sufixo quando a linha de dados não tem descrição inline — caso contrário a próxima linha é pré-descrição da transação seguinte.
- `FaturaCartaoNubankParser.can_parse()` exige padrão `"FATURA DD MMM YYYY EMISSÃO"` — evita falso positivo com MercadoPago que contém "próxima fatura" no texto.
- Sinal das transações na fatura: compras = negativo, créditos/estornos (usando `−` U+2212) = positivo.
- Parsers B3 (xlsx) aguardam arquivos reais para implementação.

**28/04/2026 — Etapa 2.1:**
- Regex para "Itaú" exige `ita[uú]` (não `it[aá]u`) — "Itaú" usa acento no 'u', não no 'a'. Bug detectado e corrigido pelos próprios testes.
- Parser usa máquina de estados linha-a-linha: mais robusto que regex multi-linha para o formato do Nubank.
- Endpoint `/api/upload` retorna apenas preview (não persiste no banco) — persistência será adicionada na Etapa 2.3 com seleção de lançamentos.
- `pdfplumber.open()` requer `io.BytesIO(bytes)`, não bytes diretamente — a documentação do FASE-2-BACKEND.md tinha esse detalhe incorreto.
- Testes usam `unittest.mock.patch` para isolar o parser do pdfplumber — não dependem de PDFs reais para rodar em CI.
- Fixture sintética gerada com `fpdf2` (não entra no `requirements.txt` principal — só para desenvolvimento).

---

## 📌 Importação OFX (extrato conta) — extensão da Fase 2

**Marco:** upload de ficheiro `.ofx`/`.qfx` como `import_kind=bank_statement`, preview e importação para `Transaction` com conta bancária e `source_reference` (FITID).

| # | Item | Status |
|---|---|---|
| 1 | Parser `parse_bank_statement_ofx` (`app/parsers/ofx_bank_statement.py`) | ✅ |
| 2 | Formatos **SGML** (valor até fim de linha) e **XML por par** (`<TAG>valor</TAG>`, ex.: Nubank OFX) | ✅ (11/05/2026) |
| 3 | Leitura robusta de `<BANKACCTFROM>…</BANKACCTFROM>` + `BANKTRANLIST` / `STMTTRN` | ✅ |
| 4 | `/api/upload` e `/api/import` com `bank_account_id`; UI `/upload?type=bank_statement` e movimentações em `/contas/[id]` | ✅ |
| 5 | Testes: `tests/test_ofx_bank_statement.py` (incl. `test_xml_style_closed_tags_same_line`) | ✅ |

**11/05/2026 — Correção Nubank OFX (XML):** extratos da Nubank trazem cada campo em linhas do tipo `<TRNAMT>-10.50</TRNAMT>` e `<DTPOSTED>…</DTPOSTED>`. O parser inicial só reconhecia SGML com quebra de linha após o valor, o que gerava 422 “Nenhuma transação válida encontrada neste OFX”. Foi acrescentado o extract de pares `</TAG>` e o fallback SGML apenas para tags ainda não preenchidas; `BANKACCTFROM` fechado deixou de ser cortado pela primeira `<BANKID>`.

---

## 📌 Notas de bastidores

**29/04/2026 — Etapa 2.3:**
- `POST /api/import` criado em `backend/app/api/import_transactions.py` — detecta duplicatas por (data + valor + raw_description + account_id), cria Account automaticamente se não existir.
- `frontend/src/lib/api.ts` criado com funções tipadas: `uploadFile`, `importTransactions`, `getTransactions`, `checkHealth`.
- Variáveis de ambiente: `backend/.env` e `frontend/.env.local` criados; `NEXT_PUBLIC_API_URL=http://localhost:8000`.
- CORS já estava configurado desde a Etapa 2.1.
- `UploadPreview` em `src/components/Upload/UploadPreview.tsx` — transferências internas desmarcadas por padrão, filtros por tipo, busca por texto, edição inline de categoria.
- Sidebar atualizada com seção "Ferramentas" e item "Importar".
- Dashboard ainda consome mocks JSON — a conexão com o banco é a Fase 3.

---

## 🚀 Próximo passo

**Fase 3 — Dashboard consome dados reais do banco.**
Trocar `datasetLoaders` no `useFinancialData` de `import(json)` para `fetch('/api/...')`.
Ver [`FASE-3-INTEGRACAO.md`](./FASE-3-INTEGRACAO.md) e [`BACKLOG.md`](../BACKLOG.md).
