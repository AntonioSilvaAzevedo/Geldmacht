# 🔌 Fase 3 — Integração e Dados Reais

> **Status: 🔴 Em andamento — Etapa 3.1 é a próxima**
> Acompanhamento detalhado em `docs/PROGRESSO-FASE-3.md`.

---

## 🎯 Objetivo Revisado

Conectar o frontend ao backend com **dados reais do Nubank PF de Abril/2026**.
Foco total em fazer o fluxo funcionar de ponta a ponta com um único tipo de arquivo
antes de expandir para os demais.

---

## ✅ Decisões de escopo (MVP)

| Item | Decisão | Motivo |
|---|---|---|
| Categorização | ❌ Descartada do MVP | Complexidade desnecessária agora — vai para Fase 4 |
| B3 / Carteira / Proventos | ❌ Descartados desta fase | Aguardam parsers xlsx — vai para Fase 4 |
| Outros bancos (Itaú, MP, PJ) | ⏳ Após Nubank PF funcionar | Expandir progressivamente |
| Nubank PF extrato | ✅ Foco do MVP | Maior volume de transações do dia a dia |

---

## ✅ O que já está pronto (herdado da Fase 2)

- `POST /api/upload` — extrai transações de PDF sem salvar
- `POST /api/import` — salva transações confirmadas no banco com deduplicação
- `GET /api/transactions` — lista transações com filtros
- `frontend/src/lib/api.ts` — camada tipada frontend↔backend
- Tela `/upload` — drag-and-drop, preview, checkboxes
- CORS configurado, variáveis de ambiente definidas

---

## 🗂️ Etapas da Fase 3 (revisadas)

### ✅ Etapa 3.0 — Base de dados real (CONCLUÍDA — 29/04/2026)
Banco zerado, mocks arquivados, dados reais importados.

### 🔴 Etapa 3.1 — Dashboard consome Nubank PF real (ATUAL)
**Objetivo:** banco limpo → importar extrato Nubank PF Abril → Dashboard exibe dados reais.

Passos:
1. Zerar banco novamente (partir do zero, limpo)
2. Importar APENAS extrato Nubank PF de Abril/2026 via `/upload`
3. Criar endpoints de agregação no backend
4. Refatorar `useFinancialData` para `fetch()`
5. Dashboard e Visão Mensal exibem transações reais
6. Build limpo

### ⚫ Etapa 3.2 — Expandir para outros bancos
Após Nubank PF funcionando: importar Nubank PJ, Itaú, Mercado Pago, Fatura.

### ⚫ Etapa 3.3 — Categorização (Fase 4+)
Motor de regras configurável — fora do MVP atual.

### ⚫ Etapa 3.4 — B3 / Carteira / Proventos (Fase 4+)
Aguarda parsers xlsx — fora do MVP atual.

---

## 🌐 Portas padrão

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |

---

## 🚀 Arquitetura de Deploy (produção)

| Camada | Plataforma | Observações |
|---|---|---|
| Frontend | **Vercel** | Domínio `geldmacht.com` já configurado |
| Backend | **Railway** | Novo serviço, build via Nixpacks |
| Banco | **Supabase PostgreSQL** | Separado do projeto antigo |

### Arquivos de configuração criados

| Arquivo | Descrição |
|---|---|
| `vercel.json` (raiz) | Build/output do Next.js + rewrite `/api/*` → Railway |
| `railway.toml` (raiz) | Build Nixpacks + `uvicorn` no `$PORT` + healthcheck |
| `backend/.env.example` | Referência das vars de ambiente do backend |
| `frontend/.env.example` | Referência das vars de ambiente do frontend |

### Mudanças de código para produção

- `backend/requirements.txt` — `psycopg2-binary` adicionado (driver PostgreSQL)
- `backend/app/config.py` — campo `cors_origins` (string CSV, default local)
- `backend/app/main.py` — CORS lê `settings.cors_origins` em vez de lista hardcoded
- `backend/app/database.py` — `connect_args` condicional: só passa `check_same_thread=False` para SQLite
- `.gitignore` — adicionados `.next/`, `.vercel`, `frontend/.env.local`

### Workflow de deploy

1. Desenvolvimento local continua igual (SQLite, porta 8000/3000)
2. Ao fazer push no GitHub:
   - Vercel detecta o push → builda e deploya o frontend automaticamente
   - Railway detecta o push → builda e deploya o backend automaticamente
3. Antes do primeiro deploy, configurar no Railway: `DATABASE_URL` (Supabase) e `CORS_ORIGINS=https://geldmacht.com`
4. Substituir `SEU_BACKEND.up.railway.app` no `vercel.json` pela URL real do Railway
5. Rodar `alembic upgrade head` no Railway (via CLI ou shell do serviço) para criar as tabelas no Supabase
