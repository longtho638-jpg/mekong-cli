# Antigravity API Starter Kit

> Production-ready REST API starter kit with authentication, rate limiting, and caching.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Authentication**: JWT-based auth with refresh tokens, API Key support.
- **Authorization**: Role-based access control (RBAC).
- **Database**: Prisma ORM with PostgreSQL support.
- **Caching**: Redis-backed caching middleware.
- **Rate Limiting**: Redis-backed distributed rate limiting.
- **Security**: Helmet, CORS, input sanitization.
- **Logging**: Structured logging with Winston.
- **Validation**: Request validation using Zod.
- **Documentation**: Auto-generated Swagger/OpenAPI docs.
- **Type Safety**: 100% TypeScript.

## Quick Start

1.  **Install dependencies**
    ```bash
    npm install
    ```

2.  **Configure environment**
    ```bash
    cp .env.example .env
    ```
    Update `.env` with your database and Redis credentials.

3.  **Start Database**
    If you don't have Postgres/Redis locally, you can use Docker:
    ```bash
    docker-compose up -d
    ```

4.  **Run Migrations**
    ```bash
    npm run prisma:migrate
    ```

5.  **Start Server**
    ```bash
    npm run dev
    ```

6.  **Visit Documentation**
    Open [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Project Structure

```
src/
├── config/         # Configuration (DB, Redis, Swagger)
├── controllers/    # Route controllers (Request handling)
├── middlewares/    # Express middlewares (Auth, Logging, etc.)
├── routes/         # API Route definitions
├── services/       # Business logic layer
├── utils/          # Utilities (Logger, Response helpers)
└── server.ts       # Application entry point
```

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh-token` - Refresh access token

### Users
- `GET /api/v1/users/me` - Get profile
- `PATCH /api/v1/users/me` - Update profile
- `GET /api/v1/users` - List users (Admin only)

## Testing

Run the test suite:

```bash
npm test
```

## License

MIT
