# 🦞 LOBSTER EMPIRE — DOANH TRẠI TÔM HÙM

> **ROI-as-a-Service Platform | Year of the Horse 2026**

A high-performance RaaS (ROI-as-a-Service) monorepo built to generate $1M/year through fully automated AI agent operations.

## ⚡ Quick Start

```bash
# One command to start everything
./scripts/start.sh

# Or use Makefile
make install
make dev
```

## 🏗️ Architecture

```
doanh-trai-tom-hum/
├── apps/
│   ├── web/                  # Next.js 14 — Cyberpunk Enterprise UI
│   └── api/                  # Hono.js — Ultrafast API Gateway
├── packages/
│   ├── db/                   # Prisma ORM — PostgreSQL Schema
│   └── openclaw-agents/      # AI Agent Framework
├── docker-compose.yml        # Full-stack containerization
├── Makefile                  # Operational commands
└── turbo.json                # Turborepo pipeline
```

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | Next.js 14, TypeScript, Tailwind    |
| Backend   | Hono.js, TypeScript                 |
| Database  | PostgreSQL 16 + Prisma ORM          |
| Agents    | OpenClaw Agent Framework             |
| Monorepo  | Turborepo + pnpm workspaces         |
| Containers| Docker Compose                       |

## 🎯 Commands

```bash
make help       # Show all commands
make dev        # Start dev servers
make up         # Docker production deploy
make down       # Stop containers
make build      # Build all packages
make clean      # Clean everything
make db-studio  # Prisma Studio (DB GUI)
```

## 🚀 Endpoints

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000         |
| Backend  | http://localhost:8000         |
| Health   | http://localhost:8000/health  |
| Database | localhost:5432               |

---

*🦞 Doanh Trại Tôm Hùm — Built by OpenClaw*
