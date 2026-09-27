# ==========================================
# OpenVyapar Backend - Multi-Stage Dockerfile
# ==========================================

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci

COPY shared/ ./shared/
COPY backend/ ./backend/

RUN npm --workspace=shared run build && npm --workspace=backend run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN npm ci --omit=dev --workspace=shared --workspace=backend

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist

COPY backend/prompts ./backend/prompts
COPY backend/data ./backend/data

EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health/live').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "backend/dist/src/server.js"]
