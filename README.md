# FinancialBlobs

**Gerencie suas entidades financeiras mês a mês.**

---

## 🚀 Visão Geral

O **FinancialBlobs** é um app simples e rápido para organizar suas finanças por **entidade** (cartões, contas, salário, cofrinho etc.) e por **mês**.  
Você pode criar entidades, lançar **itens** (entradas/saídas), marcar como **recorrente** (24 meses) ou **parcelado** (n parcelas), e acompanhar **totais** e **saldo final** mês a mês.

A aplicação é composta por:

- **API (Node.js + Express + MySQL/MariaDB)** com autenticação JWT, controle de acesso por usuário (ownership) e regras de geração de itens sem duplicar;
- **Front-end estático (Bootstrap 5)** com tema **Pastel (light)** / **Cyberpunk (dark)** e opção **Auto** (segue o sistema), tabela com **primeira coluna fixa** e layout responsivo.

---

## ✨ Principais Recursos

- 🔐 **Auth JWT**: registro, login e perfil (`/auth/register`, `/auth/login`, `/auth/me`)
- 👤 **Ownership**: cada entidade pertence a um usuário (`user_id`); usuários não veem dados de outros
- ➕ **Itens recorrentes** (24 meses) e **parcelados** (de `installment_now` até `installment_max`)
- 🧯 **Anti-duplicação**: proteção lógica e por **índice único** no banco (retorna **409** quando nada novo é criado)
- 📊 **Totais por mês** e **Saldo final** (entradas + saídas negativas) por coluna
- 🧊 **Tabela com 1ª coluna fixa** (layout split) e rolagem horizontal dos meses
- 🎨 **Temas**: claro/pastel, escuro/cyberpunk e **Auto** (segue SO)
- 🧪 **Testes E2E** (Jest + Axios) para auth, entidades e itens

---

## 🧱 Arquitetura (pastas principais)

```
api/
  controllers/     # regras HTTP
  middleware/      # auth JWT
  models/          # queries SQL (MySQL2)
  services/        # regras de domínio (itens recorrentes/parcelas, dedupe)
  routes/          # rotas Express (auth, entities, items)
  utils/db.js      # pool + criação de tabelas (bootstrap)

web/
  assets/css/      # CSS modular (base, theme, layout, components.*)
  src/             # JS modular (navbar, modals, tabela, tema, auth, API client)
  index.html       # shell do front
```

---

## 🔌 API – Endpoints

### 🔐 Autenticação
| Método | Rota                      | Descrição |
|-------:|---------------------------|-----------|
| POST   | `/api/v1/auth/register`   | Cria usuário (`name`, `email`, `password`) |
| POST   | `/api/v1/auth/login`      | Retorna `{ token }` |
| GET    | `/api/v1/auth/me`         | Dados do usuário logado |
| PUT    | `/api/v1/auth/me`         | Atualiza perfil (`name`) |
| PUT    | `/api/v1/auth/me/password`| Troca senha (`current_password`, `new_password`) |

> **Uso do token**: envie `Authorization: Bearer <TOKEN>` nas rotas protegidas.

### 📁 Entidades Financeiras
| Método | Rota                           | Descrição |
|-------:|--------------------------------|-----------|
| GET    | `/api/v1/entities`             | Lista entidades **do usuário** |
| GET    | `/api/v1/entities/:id`         | Retorna entidade (se for do usuário) |
| GET    | `/api/v1/entities/:id/items`   | Lista itens da entidade (se for do usuário) |
| POST   | `/api/v1/entities`             | Cria entidade (`name`, `description`) |
| PUT    | `/api/v1/entities/:id`         | Atualiza entidade (ownership checada) |
| DELETE | `/api/v1/entities/:id`         | Remove entidade (ownership checada) |

### 📄 Itens Financeiros
| Método | Rota                 | Descrição |
|-------:|----------------------|-----------|
| GET    | `/api/v1/items`      | Lista itens **do usuário** |
| GET    | `/api/v1/items/:id`  | Retorna item (ownership checada) |
| POST   | `/api/v1/items`      | Cria item (recorrente/parcelado, com dedupe) |
| PUT    | `/api/v1/items/:id`  | Atualiza item (ownership checada) |
| DELETE | `/api/v1/items/:id`  | Remove item (se parcelado, remove o grupo inteiro) |

#### POST `/api/v1/items` – Regras e respostas
- **Corpo** obrigatório:  
  `entity_id`, `description`, `type` (`entrada` | `saida`), `value`, `month_ref` (YYYY-MM-01), `recurring` (bool), `installment_now`, `installment_max`
- **201**: `{ message, created_count, skipped_count, ids, skipped }`
- **409** (nada novo criado): `{ error, details: { skipped_count, skipped } }`
- **422**: dados incompletos
- **404**: entidade não pertence ao usuário

> A “não duplicação” é por **entidade** e **mês** (mesmo `description`, `type`, `value`, `installment_max`, `month_ref`).

---

## ⚙️ Como Rodar

### 1) API (back-end)
1. Crie `api/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   DB_NAME=financeiro
   JWT_SECRET=um-segredo-bem-aleatorio
   ```
2. Instale e suba:
   ```bash
   cd api
   npm install
   npm run start
   # ou: npm run dev (nodemon)
   ```
   A API ficará em **http://localhost:3001**.

### 2) Front (web)
É estático. Você pode usar qualquer servidor (ex.: Python HTTP server):
```bash
cd web
python -m http.server 8000
# abra http://localhost:8000
```

---

## 🧪 Testes

Execute os E2E da API:
```bash
cd api
npm test
```

Os testes cobrem:
- Auth (`/auth`)
- Entidades (`/entities`)
- Itens (`/items`), incluindo:
  - recorrentes (24 meses)
  - parcelados (n parcelas)
  - **não duplicar** quando já existem (resposta 409)

---

## 🗄️ Banco de Dados

### Criação “do zero” (auto-bootstrap)
O arquivo `api/utils/db.js` cria as tabelas se não existirem (em ambiente novo):

- `financial_users` (id, name, email único, password_hash, created_at)
- `financial_entities` (id, user_id FK → `financial_users`, name, description)
- `financial_items` (id, entity_id FK → `financial_entities`, description, type, value, flags de recorrência/parcelas, `month_ref`)
- Índices auxiliares (`idx_entities_user_id`, `idx_items_entity_id`, `idx_items_month_ref`)

> **Anti-duplicação** por índice único (por entidade/mês):
```sql
ALTER TABLE financial_items
  MODIFY type ENUM('entrada','saida') NOT NULL,
  MODIFY month_ref DATE NOT NULL;

ALTER TABLE financial_items
  ADD UNIQUE KEY uniq_item_month
  (entity_id, type, value, month_ref, installment_max, description(191));
```

### Escopo da deduplicação
- **Padrão (recomendado)**: **por entidade** (chave inclui `entity_id`)
- Opcional: **por usuário** (exige `user_id` em `financial_items` + índice com `user_id`)

---

## 🖼️ Front – detalhes de UI/UX

- Tema **light (pastel)** / **dark (cyberpunk)** / **Auto** (segue o sistema)
- Navbar minimalista com **busca central** (placeholder funcional) + **menu** com ações e switch de tema
- Tabela “**split**”: 1ª coluna fixa (entidades) + meses roláveis lateralmente (sincronização de alturas por `ResizeObserver`)
- Valores em BRL com **símbolo responsivo** (oculta em telas muito pequenas)
- Modais de **auth**, **entidades** e **itens** theme-aware

---

## 🔐 Segurança e Erros (API)

- **Ownership** checado em todas as operações (entidade/item precisa pertencer ao usuário autenticado)
- **JWT obrigatório** nas rotas privadas (`Authorization: Bearer ...`)
- **Status codes** padronizados:
  - `201` — criado (com sumário de `created_count` e `skipped_count` em itens)
  - `409` — nada novo criado (duplicata), inclui `details.skipped`
  - `404` — entidade/item não encontrado para o usuário
  - `422` — payload inválido
  - `500` — erro interno

---

## 🛠️ Variáveis de Ambiente (API)

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (obrigatório — usado para assinar tokens)

---

## 📦 Scripts úteis

- **API**: `npm run start` / `npm run dev` (nodemon) / `npm test`
- **Front**: `python -m http.server 8000` (ou qualquer servidor estático)

---

## 📜 Licença

Livre para uso pessoal/educacional.

---

## 🗺️ Roadmap (curto prazo)

- Página/landing com **prints** do dashboard (borrados) e dos modais
- Busca funcional no front
- Export (CSV/Excel) por mês/entidade
- PWA (instalável) e cache offline básico
