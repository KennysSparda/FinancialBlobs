# FinancialBlobs

**Gerencie suas entidades financeiras mês a mês.**

---

## 🚀 Sobre o Projeto

O **FinancialBlobs** é uma aplicação que permite o controle de entidades financeiras, com suporte à criação, edição, listagem e remoção de registros. Além disso, é possível gerar automaticamente os dados para o próximo mês com base nas entidades atuais.

---

# API Endpoints

## 📁 Entidades Financeiras

| Método | Rota                    | Descrição                         |
|--------|-------------------------|----------------------------------|
| GET    | `/api/v1/entities`             | Lista todas as entidades          |
| GET    | `/api/v1/entities/:id`         | Retorna uma entidade específica   |
| POST   | `/api/v1/entities`             | Cria uma nova entidade            |
| PUT    | `/api/v1/entities/:id`         | Atualiza uma entidade existente   |
| DELETE | `/api/v1/entities/:id`         | Remove uma entidade               |
| POST   | `/api/v1/entities/generate-next-month` | Gera os dados do próximo mês (recebe `{ fromMonth: "YYYY-MM-DD" }`) |

---

## 📄 Itens Financeiros

| Método | Rota            | Descrição                       |
|--------|-----------------|---------------------------------|
| GET    | `/api/v1/items`        | Lista todos os itens            |
| GET    | `/api/v1/items/:id`    | Retorna um item específico      |
| POST   | `/api/v1/items`        | Cria um novo item              |
| PUT    | `/api/v1/items/:id`    | Atualiza um item existente      |
| DELETE | `/api/v1/items/:id`    | Remove um item                 |

---

## ▶️ Como Rodar o Projeto
1. API (Back-end)

Configure o arquivo [loginInfo](/api/utils/loginInfo.js) primeiro
```bash
  cd api
  npm install
  npm run start
```
A API estará disponível em http://localhost:3001.

## 🧪 Testes de Endpoints
Para testar os endpoints manualmente com um script:
```bash
  cd api
  node test/testApiEntity.js
  node test/testApiItems.js
```

## 📝 Requisitos

- Node.js >= 18

- MySQL (com usuario configurado e banco de dados criado as tabelas são inseridas automaticamente )

- Navegador web para acessar a interface (front-end simples incluído)