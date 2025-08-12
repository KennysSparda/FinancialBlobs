# api/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Instala dependências
COPY api/package*.json ./
RUN npm ci --only=production || npm ci

# Copia o código
COPY api/ .

ENV PORT=3001
EXPOSE 3001

# Sobe o servidor Express
CMD ["node", "server.js"]
