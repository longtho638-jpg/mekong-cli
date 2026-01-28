# ============================================================================
# AgencyOS Dashboard - Production Dockerfile
# Optimized for Size and Performance
# ============================================================================

# 1. Base
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat

# 2. Pruner - isolates the dashboard and its dependencies
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=mekong-dashboard --docker

# 3. Dependencies
FROM base AS deps
WORKDIR /app
# Install build dependencies
RUN apk add --no-cache python3 make g++ gcc py3-setuptools
# Copy only the pruned package.json's and lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./
# Install dependencies
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN pnpm install --frozen-lockfile

# 4. Builder
FROM base AS builder
WORKDIR /app
# Copy entire workspace from deps to preserve nested node_modules
COPY --from=deps /app ./
# Copy pruned source code
COPY --from=pruner /app/out/full/ .
# Build specific app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Placeholder env vars for build time (Next.js needs them for static generation)
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
RUN pnpm --filter mekong-dashboard build

# 5. Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/public ./apps/dashboard/public

USER nextjs
EXPOSE 3000

# Health Check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "apps/dashboard/server.js"]
