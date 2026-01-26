# Deployment Guide

This guide details how to deploy the Email Marketing Kit in a production environment.

## 📋 Prerequisites

- A Linux server (Ubuntu 22.04 LTS recommended)
- Docker Engine & Docker Compose installed
- A domain name pointing to your server
- An SMTP provider (AWS SES, SendGrid, Mailgun, etc.)

## ⚙️ Configuration

1.  **Environment Variables**
    Create a `.env` file in the root directory based on `.env.example`.

    **Critical Settings:**
    ```ini
    # Database
    DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/emailkit

    # Security
    SECRET_KEY=your-super-secure-random-key
    ACCESS_TOKEN_EXPIRE_MINUTES=11520

    # Domain (Used for tracking links)
    DOMAIN=https://marketing.yourdomain.com

    # Email Provider (Choose one)
    EMAIL_PROVIDER=smtp
    SMTP_HOST=smtp.example.com
    SMTP_PORT=587
    SMTP_USER=apikey
    SMTP_PASSWORD=your-api-key
    SMTP_FROM_EMAIL=newsletter@yourdomain.com
    ```

2.  **Reverse Proxy (Nginx/Traefik)**
    It is highly recommended to run the application behind a reverse proxy to handle SSL/TLS termination.

## 🚀 Docker Compose Deployment

1.  **Build and Run**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```
    *(Note: Create a `docker-compose.prod.yml` similar to `docker-compose.yml` but without exposed DB ports and with restart policies).*

2.  **Run Migrations**
    Initialize the database schema.
    ```bash
    docker-compose exec app alembic upgrade head
    ```

3.  **Seed Data (Optional)**
    ```bash
    docker-compose exec app python scripts/seed.py
    ```

## 🛡️ Production Checklist

- [ ] **SSL/TLS**: Ensure HTTPS is enabled for the API domain.
- [ ] **Secret Key**: Change the default `SECRET_KEY` to a strong random string.
- [ ] **Database Backups**: Configure automated backups for PostgreSQL.
- [ ] **Rate Limiting**: Configure Nginx or API Gateway rate limits.
- [ ] **Monitoring**: Set up uptime monitoring for the `/health` endpoint.
- [ ] **Email Auth**: Configure SPF, DKIM, and DMARC for your sending domain to ensure deliverability.

## 🔄 Updates

To update the application:
1.  Pull the latest code/image.
2.  Run `docker-compose down`.
3.  Run `docker-compose up -d --build`.
4.  Run migrations: `docker-compose exec app alembic upgrade head`.
