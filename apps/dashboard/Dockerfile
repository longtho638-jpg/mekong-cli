# Frontend Dockerfile (Next.js) - Monorepo Build
# Multi-stage build for production
# Build context: project root

# 1. Base
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 2. Dependencies
FROM base AS deps
WORKDIR /app
# Copy minimal files needed for pnpm install
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY . .
# Build specific app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter mekong-dashboard build

# 4. Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/public ./apps/dashboard/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/dashboard/server.js"]
