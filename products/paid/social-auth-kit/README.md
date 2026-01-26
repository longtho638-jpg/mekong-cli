# Social Auth Kit

**A production-ready, drop-in authentication microservice for SaaS applications.**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)

Social Auth Kit handles the complexity of OAuth2 so you don't have to. It provides a secure, standalone service for Google, GitHub, and Discord authentication with a normalized user profile and secure session management.

## 🚀 Features

- **Multi-Provider Support**: Google, GitHub, and Discord out of the box.
- **Secure by Default**:
  - Short-lived JWT Access Tokens (15 min).
  - Rotated, Database-backed Refresh Tokens (HttpOnly Cookies).
  - CSRF Protection via OAuth State validation.
- **Unified Profile**: Normalized user data schema across all providers.
- **Frontend Ready**: Includes React hooks (`useAuth`) and UI components.
- **Developer Experience**: Fully typed (Python/TypeScript), Dockerized, and tested.

## 🔌 Supported Providers

| Provider | Status | Key Features |
|----------|--------|--------------|
| **Google** | ✅ Ready | Email, Avatar, Name |
| **GitHub** | ✅ Ready | Email, Avatar, Username |
| **Discord**| ✅ Ready | Email, Avatar, Discriminator |

## 🏁 Quick Start (< 5 Minutes)

### 1. Prerequisites
- Docker & Docker Compose
- [OAuth Client IDs](docs/INSTALLATION.md#3-oauth-provider-setup)

### 2. Configure
Copy the example environment file and add your credentials:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```ini
SECRET_KEY=generate_a_secure_key_here
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 3. Run
Start the service with Docker Compose:

```bash
docker-compose up --build
```

**That's it!** The API is running at `http://localhost:8000`.
- **Swagger UI**: `http://localhost:8000/docs`
- **Login Endpoint**: `http://localhost:8000/api/v1/auth/login/google`

## 📖 Documentation

Everything you need to integrate and deploy.

- **[Installation & Setup](docs/INSTALLATION.md)** - Detailed setup guide and provider configuration.
- **[Integration Guide](docs/INTEGRATION_GUIDE.md)** - How to connect your frontend and backend.
- **[API Reference](docs/API_REFERENCE.md)** - Comprehensive endpoint documentation.
- **[Examples](docs/EXAMPLES.md)** - Code snippets for React, Next.js, and more.
- **[Deployment](docs/DEPLOYMENT.md)** - Production checklist and Docker deployment.

## 📦 Project Structure

```
social-auth-kit/
├── backend/                # FastAPI Application (The Service)
│   ├── app/
│   │   ├── api/            # REST Endpoints
│   │   ├── core/           # Security & Config
│   │   ├── models/         # Database Models
│   │   ├── providers/      # OAuth Providers Logic
│   │   └── schemas/        # Pydantic Models
├── frontend-examples/      # Reference Implementations
│   ├── react/              # React/Vite Example
│   └── src/                # Shared Types & Client
└── docs/                   # Full Documentation
```

## 🛠 Tech Stack

- **Backend**: FastAPI (Python 3.12)
- **Database**: PostgreSQL (Async SQLAlchemy)
- **Migrations**: Alembic
- **Validation**: Pydantic v2

## 📄 License
This project is licensed under the MIT License.
