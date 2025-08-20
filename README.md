# Tintas MCP

Projeto desenvolvido para o desafio Loomi, focado em gerenciamento de tintas e suas propriedades.

## 🚀 Descrição

Este projeto é uma API desenvolvida em Node.js para cadastro, consulta e manipulação de tintas. Utiliza PostgreSQL como banco de dados e integrações modernas para garantir escalabilidade e facilidade de uso.

## 🛠️ Tecnologias Utilizadas

- Node.js
- TypeScript
- Express
- PostgreSQL
- Docker
- Prisma ORM
- OpenAI API

## 📦 Estrutura de Pastas

```
tintas-mcp/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── prisma/
│   └── schema.prisma
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## 📥 Como baixar e rodar o projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/igorcenziai/desafio-loomi.git
   cd desafio-loomi/tintas-mcp
   ```

2. **Configure as variáveis de ambiente:**
   - Renomeie `.env.example` para `.env` e ajuste conforme necessário.

3. **Suba os containers com Docker:**
   ```bash
   docker-compose up
   ```

4. **Instale as dependências (caso rode localmente):**
   ```bash
   npm install
   ```

5. **Execute as migrações do banco:**
   ```bash
   npx prisma migrate dev
   ```

6. **Inicie a aplicação:**
   ```bash
   npm run dev
   ```

## 📚 Documentação

- As rotas e funcionalidades estão documentadas via Swagger (caso implementado) ou diretamente nos controllers.

## 🤝 Contribuição

Sinta-se livre para abrir issues ou pull requests!

---
Desenvolvido por [Igor Cenzi](https://github.com/igorcenziai)
