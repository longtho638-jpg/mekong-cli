# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# --- Stage 2: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (override at build or provide defaults)
ARG NEXT_PUBLIC_BASE_URL=https://agencyos.dev
ARG NEXT_PUBLIC_POLAR_PRICE_STARTER=
ARG NEXT_PUBLIC_POLAR_PRICE_PRO=

ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_POLAR_PRICE_STARTER=$NEXT_PUBLIC_POLAR_PRICE_STARTER
ENV NEXT_PUBLIC_POLAR_PRICE_PRO=$NEXT_PUBLIC_POLAR_PRICE_PRO
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Stage 3: Production ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
