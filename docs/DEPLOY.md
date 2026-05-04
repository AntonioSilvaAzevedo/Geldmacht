# 🚀 Deploy — Geldmacht em Produção

> Guia completo para subir o sistema em produção.
> Atualizar conforme cada etapa for concluída.

---

## Arquitetura

```
geldmacht.com  (Vercel)
      │
      ├── /          → Next.js (frontend)
      └── /api/*     → Railway (backend FastAPI)  ← rewrite no vercel.json
                              │
                              └── Supabase PostgreSQL (banco)
```

---

## ✅ O que já está pronto (código)

| Item | Arquivo | Detalhe |
|---|---|---|
| Driver PostgreSQL | `backend/requirements.txt` | `psycopg2-binary>=2.9.9` |
| Build Vercel | `vercel.json` (raiz) | buildCommand, outputDirectory, framework |
| Rewrite `/api/*` | `vercel.json` | Placeholder `SEU_BACKEND.up.railway.app` — substituir após criar serviço |
| Build Railway | `railway.toml` (raiz) | Nixpacks + `uvicorn ... --port $PORT` + healthcheck `/health` |
| `/health` endpoint | `backend/app/main.py` | `GET /health → {"status":"ok"}` |
| CORS via env var | `backend/app/main.py` | Lê `CORS_ORIGINS` (CSV) em vez de lista hardcoded |
| `cors_origins` config | `backend/app/config.py` | Default local; sobrescrever em produção |
| PostgreSQL-safe engine | `backend/app/database.py` | `connect_args` condicional — só SQLite usa `check_same_thread=False` |
| `.env.example` backend | `backend/.env.example` | Referência completa com comentários |
| `.env.example` frontend | `frontend/.env.example` | Referência completa com comentários |
| `.gitignore` atualizado | `.gitignore` | `.next/`, `.vercel`, `frontend/.env.local` |

---

## ❌ O que falta fazer (por plataforma)

### GitHub

- [ ] Criar repositório `geldmacht` (público ou privado)
- [ ] Fazer o primeiro `git push` com todo o código atual
- [ ] Confirmar que `geldmacht.db` e `data/*.pdf` **não** foram commitados (checar `.gitignore`)

---

### Railway (backend)

- [ ] Criar conta em [railway.app](https://railway.app) (se não tiver)
- [ ] New Project → Deploy from GitHub repo → selecionar `geldmacht`
- [ ] Railway detecta `railway.toml` automaticamente — confirmar build Nixpacks
- [ ] Configurar variáveis de ambiente no painel Railway:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME   ← vem do Supabase
CORS_ORIGINS=https://geldmacht.com
APP_NAME=Geldmacht API
DEBUG=false
```

- [ ] Aguardar o primeiro deploy concluir
- [ ] Copiar a URL gerada (`xxxx.up.railway.app`)
- [ ] **Substituir o placeholder** no `vercel.json`:

```json
"destination": "https://xxxx.up.railway.app/api/:path*"
```

- [ ] Commit + push da alteração

---

### Supabase (banco de dados)

- [ ] Criar conta em [supabase.com](https://supabase.com) (se não tiver)
- [ ] New Project → anotar: host, porta, usuário, senha, nome do banco
- [ ] Montar a connection string:

```
postgresql://postgres:[SENHA]@db.[REF].supabase.co:5432/postgres
```

- [ ] Colar no Railway como `DATABASE_URL`
- [ ] Rodar as migrations no Supabase — via Railway shell ou CLI:

```bash
# No shell do serviço Railway (ou localmente com DATABASE_URL do Supabase):
cd backend && alembic upgrade head
```

- [ ] Validar no Supabase Table Editor: tabelas `accounts` e `transactions` criadas com todas as colunas (incluindo `installment_current`, `installment_total`)

---

### Vercel (frontend)

- [ ] Criar conta em [vercel.com](https://vercel.com) (se não tiver)
- [ ] New Project → Import from GitHub → selecionar `geldmacht`
- [ ] Vercel detecta `vercel.json` automaticamente — confirmar framework Next.js
- [ ] **Não** é necessário configurar `NEXT_PUBLIC_API_URL` em produção — o rewrite do `vercel.json` já encaminha `/api/*` para o Railway
- [ ] Aguardar o build concluir
- [ ] Configurar domínio `geldmacht.com`:
  - Settings → Domains → Add → `geldmacht.com`
  - Configurar DNS conforme instrução da Vercel (registro A ou CNAME)
- [ ] Testar `https://geldmacht.com/` e `https://geldmacht.com/upload`

---

## Checklist final pós-deploy

- [ ] `https://geldmacht.com` abre o Dashboard
- [ ] `https://geldmacht.com/api/health` retorna `{"status":"ok"}`
- [ ] Importar um PDF via `/upload` → transações salvas no Supabase
- [ ] `GET /api/transactions` retorna as transações importadas
- [ ] Recarregar a página e confirmar que os dados persistem (banco real, não SQLite)

---

## Variáveis de ambiente — referência rápida

### Railway (backend)

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://...` (Supabase) |
| `CORS_ORIGINS` | `https://geldmacht.com` |
| `APP_NAME` | `Geldmacht API` |
| `DEBUG` | `false` |

### Vercel (frontend)

> Em produção não é necessária nenhuma variável — o rewrite cuida do roteamento para o Railway.

---

## Desenvolvimento local (não muda)

```bash
# Backend
cd backend && source venv/bin/activate
alembic upgrade head          # só na primeira vez ou após nova migration
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

O SQLite local (`backend/geldmacht.db`) nunca vai para produção — está no `.gitignore`.
