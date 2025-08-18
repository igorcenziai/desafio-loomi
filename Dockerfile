# ============================
# 1ª Etapa: Build da aplicação
# ============================
FROM node:20 AS builder

WORKDIR /app

# Copia apenas os manifests primeiro (para cache de dependências)
COPY package*.json tsconfig*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Compila o projeto
RUN npm run build


# ============================
# 2ª Etapa: Runtime (imagem final enxuta)
# ============================
FROM node:20-slim AS runner

WORKDIR /app

# Copia apenas os artefatos necessários
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Variáveis de ambiente
ENV NODE_ENV=production

# Porta exposta (ajuste conforme sua aplicação)
EXPOSE 3000

# Comando de inicialização
CMD ["node", "dist/index.js"]
