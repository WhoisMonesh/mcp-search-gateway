# ============================================================
# Multi-stage Dockerfile for mcp-search-gateway
# Supports: linux/amd64, linux/arm64 via Docker buildx
# Runs as non-root user (mcp) for security hardening
# ============================================================

# ---- Stage 1: Builder ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools (needed for some native modules)
RUN apk add --no-cache python3 make g++

# Copy dependency manifests and install ALL deps (including devDeps for build)
COPY package*.json ./
RUN npm install

# Copy source and build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:22-alpine

# Security: create a dedicated non-root user
RUN addgroup -S mcp && adduser -S mcp -G mcp

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy config examples (mounted at runtime via volume or env)
COPY config ./config

# Runtime environment defaults (all overridable via env vars)
ENV NODE_ENV=production
ENV MCP_PORT=8080
ENV MCP_BIND=0.0.0.0
ENV LOG_LEVEL=info

# Expose HTTP port
EXPOSE 8080

# Drop to non-root user
USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
