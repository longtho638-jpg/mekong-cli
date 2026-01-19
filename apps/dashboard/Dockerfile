# 🏯 AgencyOS Dashboard - Dockerfile
# Next.js development container

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source (for production, not needed for dev with volumes)
# COPY . .

# Environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Development command
CMD ["npm", "run", "dev"]
