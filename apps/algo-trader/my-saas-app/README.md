# My SaaS App

Next.js 15 SaaS application with authentication (email/password + OAuth).

## Stack

- **Framework**: Next.js 15.1.6 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: better-auth
- **Database**: PostgreSQL + Prisma ORM

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Setup database

Run PostgreSQL locally (requires Docker):

```bash
docker run -d --name postgres-saas \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=my_saas_db \
  -p 5432:5432 \
  postgres:15
```

### 3. Configure environment

```bash
cp .env.example .env
```

### 4. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Run development server

```bash
npm run dev
```

## OAuth Setup

### Google OAuth
- Redirect URI: `http://localhost:3000/api/auth/callback/google`

### GitHub OAuth
- Callback URL: `http://localhost:3000/api/auth/callback/github`

## Next Steps

1. Install shadcn/ui: `npx shadcn-ui init`
2. Create login/signup pages
3. Add protected dashboard
4. Add subscription billing (Polar.sh)
