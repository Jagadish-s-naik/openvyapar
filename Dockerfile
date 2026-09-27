# ==========================================
# OpenVyapar Backend - Multi-Stage Dockerfile
# ==========================================

# ------------------------------------------
# Stage 1: Build & Compilation
# ------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root manifest and workspace package definitions
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install full dependencies across workspaces for compilation
RUN npm ci

# Copy TypeScript source code and assets
COPY shared/ ./shared/
COPY backend/ ./backend/

# Compile shared library and backend services
RUN npm --workspace=shared run build && npm --workspace=backend run build

# ------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy workspace manifests for lean production install
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install only production dependencies
RUN npm ci --omit=dev --workspace=shared --workspace=backend

# Copy compiled artifacts from builder stage
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist

# Copy backend static prompts and fallback data
COPY backend/prompts ./backend/prompts
COPY backend/data ./backend/data

# Expose backend API port
EXPOSE 3000

# Liveness probe check
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health/live').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the OpenVyapar Backend API server
CMD ["node", "backend/dist/src/server.js"]
