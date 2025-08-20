# Tintas MCP

Projeto desenvolvido para o desafio Loomi, focado em gerenciamento de tintas e suas propriedades.

## 🚀 Descrição

Este projeto é um chat inteligente que recomenda tintas e exibe imagens simulando a aplicação das cores. Desenvolvido com Node.js, utiliza LangChain e OpenAI para processamento de linguagem natural, além de tools personalizadas integradas ao MCP Server para gerar recomendações e visualizações realistas.

## 🛠️ Tecnologias Utilizadas

- Node.js
- TypeScript
- Express
- PostgreSQL
- Docker
- TypeORM
- OpenAI API
- Langchain
- Model Context Protocol


## 📥 Como baixar e rodar o projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/igorcenziai/desafio-loomi.git
   cd desafio-loomi/tintas-mcp
   ```

2. **Configure as variáveis de ambiente:**
   - Renomeie `.env.example` para `.env` e ajuste conforme necessário.
   - Renomeio `env-example.json` para `env.json` e ajuste conforme necessário.

3. **Suba os containers com Docker:**
   ```bash
   docker-compose up
   ```

4. **Instale as dependências (caso rode localmente):**
   ```bash
   npm install
   ```

5. **Inicie a aplicação:**
   ```bash
   npm start
   ```

**Para rodar com docker**

Execute o comando:
 ```bash
   docker-compose up -d --build
   ```

## 📚 Documentação

- As rotas e funcionalidades estão documentadas via Swagger.

## 🤝 Contribuição

Sinta-se livre para abrir issues ou pull requests!

---
Desenvolvido por [Igor Cenzi](https://github.com/igorcenziai)
