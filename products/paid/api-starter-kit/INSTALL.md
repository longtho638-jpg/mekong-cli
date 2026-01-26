# Installation Guide

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis >= 6

## Step-by-Step Setup

### 1. Database Setup (PostgreSQL)

Create a new database for the project:

```sql
CREATE DATABASE api_starter;
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/api_starter?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secure-secret"
```

### 3. Dependencies

Install Node.js dependencies:

```bash
npm install
```

### 4. Database Migrations

Initialize the database schema:

```bash
npx prisma migrate dev --name init
```

This command will:
1. Create tables in your database
2. Generate the Prisma Client

### 5. Running the Server

**Development Mode:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

## Docker Deployment (Optional)

You can run the entire stack using Docker Compose. Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/api_starter?schema=public
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: api_starter
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:alpine

volumes:
  pgdata:
```

Then run:
```bash
docker-compose up -d
```
