# Installation & Setup Guide

This guide covers the complete setup process for **Social Auth Kit**, from environment configuration to OAuth provider registration.

## 1. Prerequisites

- **Docker & Docker Compose** (Recommended for easiest setup)
- **Python 3.10+** (If running without Docker)
- **PostgreSQL 15+** (If running without Docker)
- **Node.js 18+** (For frontend examples)

## 2. Quick Start (Local Development)

The fastest way to get running is using Docker Compose.

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url> social-auth-kit
   cd social-auth-kit
   ```

2. **Configure Environment:**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` with your credentials (see Section 3).

3. **Start Services:**
   ```bash
   docker-compose up --build
   ```

   The backend will be available at `http://localhost:8000`.

## 3. OAuth Provider Setup

To use social login, you must register an application with each provider.

### 🔵 Google

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Credentials**.
4. Click **Create Credentials** -> **OAuth client ID**.
5. Select **Web application**.
6. Set **Authorized redirect URIs**:
   - `http://localhost:8000/api/v1/auth/callback/google` (Local)
   - `https://your-domain.com/api/v1/auth/callback/google` (Production)
7. Copy `Client ID` and `Client Secret` to your `.env` file:
   ```ini
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### ⚫ GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Fill in the form:
   - **Application Name**: Your App Name
   - **Homepage URL**: `http://localhost:3000` (Your frontend)
   - **Authorization callback URL**:
     - `http://localhost:8000/api/v1/auth/callback/github`
4. Register application.
5. Generate a **New Client Secret**.
6. Copy `Client ID` and `Client Secret` to your `.env` file:
   ```ini
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

### 🟣 Discord

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**.
3. Navigate to the **OAuth2** tab in the sidebar.
4. Under **Redirects**, add:
   - `http://localhost:8000/api/v1/auth/callback/discord`
5. Copy `Client ID` from **Client information**.
6. Click **Reset Secret** to get the `Client Secret`.
7. Update your `.env` file:
   ```ini
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_CLIENT_SECRET=your_client_secret
   ```

## 4. Database Setup (Manual)

If you are **not** using Docker, you need to set up PostgreSQL manually.

1. **Install PostgreSQL**:
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt install postgresql postgresql-contrib`

2. **Create Database & User**:
   ```sql
   CREATE DATABASE social_auth_kit;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE social_auth_kit TO postgres;
   ```

3. **Run Migrations**:
   The kit uses **Alembic** for migrations.
   ```bash
   cd backend
   pip install poetry
   poetry install
   poetry run alembic upgrade head
   ```

## 5. Verifying Installation

Once running, verify the API is accessible:

1. Open `http://localhost:8000/docs`.
2. You should see the Swagger UI with `auth` and `users` endpoints.
3. Try hitting the Health Check endpoint (if available) or `GET /`.

---
**Next Steps:**
- Check the [Integration Guide](INTEGRATION_GUIDE.md) to connect your frontend.
- Read the [API Reference](API_REFERENCE.md) for detailed endpoint usage.
