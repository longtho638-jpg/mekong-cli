# Stage 1: Build
FROM node:20-alpine AS builder

# Install system dependencies
RUN apk add --no-cache curl openssl

# Install global tools
RUN npm install -g pnpm@8 pm2

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace packages required by algo-trader
COPY packages/trading-core ./packages/trading-core
COPY packages/vibe-arbitrage-engine ./packages/vibe-arbitrage-engine
COPY packages/vibe-billing-trading ./packages/vibe-billing-trading

# Copy app source
COPY apps/algo-trader ./apps/algo-trader

# Install dependencies
RUN pnpm install --frozen-lockfile --filter algo-trader...

# Generate Prisma Client
RUN pnpm --filter algo-trader exec prisma generate

# Build application
RUN pnpm --filter algo-trader build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache curl dumb-init

# Install PM2 globally
RUN npm install -g pm2

WORKDIR /app

# Create non-root user
RUN addgroup -S trader && adduser -S trader -G trader

# Copy built artifacts from builder
COPY --from=builder /app/apps/algo-trader/dist ./dist
COPY --from=builder /app/apps/algo-trader/package.json ./package.json
COPY --from=builder /app/apps/algo-trader/prisma ./prisma
COPY --from=builder /app/apps/algo-trader/ecosystem.config.js ./ecosystem.config.js
COPY --from=builder /app/node_modules ./node_modules

# Create logs directory
RUN mkdir -p logs && chown -R trader:trader /app

# Switch to non-root user
USER trader

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start with PM2
CMD ["pm2-runtime", "ecosystem.config.js"]
