FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Install OpenSSL for Prisma
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/packages/db
RUN pnpm db:generate
RUN pnpm build

# Build API
WORKDIR /app
RUN pnpm --filter @lobster/api build

# Deploy to /prod/api
RUN pnpm --filter @lobster/api deploy /prod/api

# Fix: Copy generated Prisma Client artifacts from builder to prod
# pnpm deploy skips generation, so we must manually copy the .prisma folder
RUN cp -r /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma /prod/api/node_modules/.pnpm/@prisma+client*/node_modules/

WORKDIR /prod/api


FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 honojs

# Copy the deployed application
COPY --from=builder --chown=honojs:nodejs /prod/api ./
# Ensure dist is copied
COPY --from=builder --chown=honojs:nodejs /app/apps/api/dist ./dist

USER honojs
EXPOSE 8000
ENV PORT=8000

CMD ["node", "dist/index.js"]
