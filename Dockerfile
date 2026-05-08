# Monorepo: app Next.js em frontend/
# Railway / Railpack detectam este Dockerfile na raiz e geram a imagem sem precisar
# configurar "Root Directory" no painel.
#
# NEXT_PUBLIC_* deve estar disponível no build (variáveis do Railway no estágio de build).

FROM node:20-alpine AS builder
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build \
  && npm prune --omit=dev \
  && npm cache clean --force

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app ./

EXPOSE 3000

USER node

CMD ["npm", "start"]
