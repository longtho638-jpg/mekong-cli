# API Rate Limiter Kit

**A production-ready, distributed rate limiting solution for FastAPI applications using Redis.**

![Status](https://img.shields.io/badge/status-production--ready-green)
![FastAPI](https://img.shields.io/badge/fastapi-0.109-green)
![Redis](https://img.shields.io/badge/redis-7.0-red)
![React](https://img.shields.io/badge/react-18-blue)

## Features

- 🛡️ **Dual Strategy**: Support for both **Fixed Window** and **Sliding Window** algorithms.
- 🚀 **Distributed**: Backed by Redis, scalable across multiple worker processes.
- ⚙️ **Dynamic Configuration**: Add/Edit/Delete rate limit rules on the fly without restarting the server.
- 📊 **Admin Dashboard**: React-based UI to manage rules and monitor system status.
- 🐳 **Docker Ready**: One-command deployment with `docker-compose`.
- 🔌 **Drop-in Middleware**: Easy integration into existing FastAPI apps.

## Quick Start

### 1. Start the Stack

We provide a `docker-compose.yml` to run the backend, redis, and dashboard together.

```bash
cd api-rate-limiter-kit
docker-compose up -d --build
```

- **Backend API**: `http://localhost:8000`
- **Dashboard**: `http://localhost:3000`

### 2. Configure a Rule

1. Open the Dashboard at `http://localhost:3000`.
2. Click **Add Rule**.
3. Enter details:
   - Method: `GET`
   - Path: `/api/v1/limited`
   - Limit: `5`
   - Window: `60` (seconds)
   - Strategy: `Fixed Window`
4. Save.

### 3. Test it

Use curl or Postman to hit the endpoint:

```bash
curl -v http://localhost:8000/api/v1/limited
```

After 5 requests, you will receive a `429 Too Many Requests` response.

## Project Structure

```
api-rate-limiter-kit/
├── backend/            # FastAPI Service
│   ├── app/
│   │   ├── api/        # API Routes (Admin)
│   │   ├── core/       # Config
│   │   ├── limiter/    # Core Rate Limiter Logic (Lua scripts)
│   │   ├── middleware/ # Global Middleware
│   │   ├── models/     # Pydantic Models
│   │   └── services/   # Business Logic
│   └── Dockerfile
├── dashboard/          # React Admin UI
│   ├── src/
│   │   ├── components/
│   │   └── lib/        # API Client
│   └── Dockerfile
├── docs/               # Documentation
└── docker-compose.yml  # Orchestration
```

## Documentation

- [Integration Guide](docs/INTEGRATION.md) - How to add this to your existing project.
- [API Documentation](http://localhost:8000/docs) - Swagger UI (when running).

## License

Commercial License. You can use this in your own projects or client projects. You cannot resell the kit itself.
