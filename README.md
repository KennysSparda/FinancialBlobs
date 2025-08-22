# FinancialBlobs

**Gerencie suas entidades financeiras mês a mês.**

---

## 🚀 Sobre o Projeto

O **FinancialBlobs** é uma aplicação que permite o controle de entidades financeiras, com suporte à criação, edição, listagem e remoção de registros. Além disso, é possível gerar automaticamente os dados para o próximo mês com base nas entidades atuais.

---

# API Endpoints

## 📁 Entidades Financeiras

| Método | Rota                                      | Descrição                                                |
|--------|-------------------------------------------|-----------------------------------------------------------|
| GET    | `/api/v1/entities`                        | Lista todas as entidades                                 |
| GET    | `/api/v1/entities/:id`                    | Retorna uma entidade específica                          |
| GET    | `/api/v1/entities/:id/items`              | Lista os itens vinculados a uma entidade específica      |
| POST   | `/api/v1/entities`                        | Cria uma nova entidade                                   |
| PUT    | `/api/v1/entities/:id`                    | Atualiza uma entidade existente                          |
| DELETE | `/api/v1/entities/:id`                    | Remove uma entidade                                      |

---

## 📄 Itens Financeiros

| Método | Rota                     | Descrição                    |
|--------|--------------------------|------------------------------|
| GET    | `/api/v1/items`          | Lista todos os itens         |
| GET    | `/api/v1/items/:id`      | Retorna um item específico   |
| POST   | `/api/v1/items`          | Cria um novo item            |
| PUT    | `/api/v1/items/:id`      | Atualiza um item existente   |
| DELETE | `/api/v1/items/:id`      | Remove um item               |

---

## ▶️ Como Rodar o Projeto
1. API (Back-end)

Configure o arquivo [.env](/api/.env) primeiro
```bash
  cd api
  npm install
  npm run start
```
A API estará disponível em http://localhost:3001.

## 🧪 Testes E2E
Para testar os endpoints:
```bash
  cd api
  npm test
```

## 📝 Requisitos

- Node.js >= 18

- MySQL (com usuario configurado e banco de dados criado as tabelas são inseridas automaticamente )

- Navegador web para acessar a interface (front-end simples incluído)


## Atualizando o banco para nova versao:
```sql
ALTER TABLE financial_entities ADD COLUMN user_id INT NULL;
UPDATE financial_entities SET user_id = 1 WHERE user_id IS NULL;
ALTER TABLE financial_entities MODIFY user_id INT NOT NULL;
ALTER TABLE financial_entities ADD CONSTRAINT fk_entities_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_entities_user_id ON financial_entities(user_id);

```
