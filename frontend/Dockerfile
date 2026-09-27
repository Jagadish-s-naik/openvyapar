# ==========================================
# OpenVyapar Frontend - Multi-Stage Dockerfile
# ==========================================

# ------------------------------------------
# Stage 1: Build & Compilation
# ------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Optional build argument for backend API URL (defaults to http://localhost:3000)
ARG VITE_BACKEND_URL=http://localhost:3000
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install workspace dependencies
RUN npm ci

# Copy shared types and frontend source code
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build shared library then compile frontend production bundle
RUN npm --workspace=shared run build && npm --workspace=frontend run build

# ------------------------------------------
# Stage 2: Production High-Performance Nginx
# ------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove default nginx assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA bundle from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy optimized SPA nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose web server port
EXPOSE 80

# Liveness check
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/healthz || exit 1

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
