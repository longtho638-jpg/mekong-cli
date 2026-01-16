---
name: docker
description: Expert Docker containerization and orchestration. Use for creating production Dockerfiles and compose configurations.
tools: Read, Write, Edit, Bash
---

# 🐳 Docker Skill

Expert Docker containerization for production deployments.

## When to Use

- Creating Dockerfiles
- Multi-stage builds
- Docker Compose setups
- Container optimization

## Key Patterns

1. **Multi-Stage Builds** - Smaller final images
2. **Layer Caching** - Optimize build times
3. **Security** - Non-root users, minimal base
4. **Compose** - Multi-container apps

## Dockerfile Template

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

## Example Prompts

```
"Use docker to create production Dockerfile"
"Use docker to set up multi-service compose"
"Use docker to optimize build size"
```
