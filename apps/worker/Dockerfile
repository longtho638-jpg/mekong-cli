# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
# Install all dependencies
RUN npm install

# Stage 2: Builder (Prisma Generate)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
# Generate Prisma Client
RUN npx prisma generate

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY src ./src

# Create non-root user for security
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs

CMD ["npm", "start"]
