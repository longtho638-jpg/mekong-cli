# Phase 01: Foundation & Architecture

> **Status**: Pending
> **Priority**: Critical
> **Dependencies**: None

## Overview
Establish the core infrastructure, project structure, and abstraction layers for the Email Marketing Kit. This phase sets the groundwork for provider-agnostic email sending and secure configuration management.

## Key Insights
- **Provider Agnostic**: The system must not lock the user into one provider (SES, SendGrid, etc.). An adapter pattern is essential.
- **Async First**: Email sending is I/O bound; using `asyncio` with FastAPI and background workers is crucial for performance.
- **Security**: SPF/DKIM/DMARC are DNS settings, but the kit should provide utilities to verify or generate valid configurations.

## Requirements
### Functional
- Initialize FastAPI project structure with strict typing.
- Implement Database models (SQLAlchemy) for core configurations.
- Create `EmailProvider` abstract base class.
- Implement specific providers: SMTP, AWS SES, SendGrid, Console (for dev).
- Configuration management (Env vars + DB overrides).

### Non-Functional
- High cohesion, low coupling.
- 100% Type hints (mypy strict).
- Comprehensive logging.

## Architecture
### Tech Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (Production) / SQLite (Dev) via SQLAlchemy 2.0 (Async)
- **Validation**: Pydantic v2
- **Migrations**: Alembic

### Component Design
`core/`
  - `config.py`: Settings management using `pydantic-settings`.
  - `providers/`: The adapter layer.
    - `base.py`: Abstract Base Class.
    - `smtp.py`: Standard SMTP implementation.
    - `ses.py`: AWS SES implementation (boto3/aioboto3).
    - `sendgrid.py`: SendGrid API implementation.

## Implementation Steps
1. **Project Setup**
   - Initialize poetry/pip environment.
   - Create directory structure (`app/core`, `app/api`, `app/models`, `app/schemas`).
   - Setup `pre-commit` hooks (ruff, mypy).

2. **Database Initialization**
   - Setup `AsyncSession` with SQLAlchemy.
   - Configure Alembic for async migrations.
   - Create `Configuration` model for dynamic settings.

3. **Provider Architecture**
   - Define `EmailSender` protocol/ABC.
   - Implement `SMTPProvider` using `aiosmtplib`.
   - Implement `MockProvider` for testing.

4. **DNS/Security Utilities**
   - Create helper scripts to generate SPF/DKIM records based on domain.
   - Implement DNS verification utility (check if records exist).

## Success Criteria
- [ ] Project compiles and starts (`uvicorn app.main:app`).
- [ ] Database migrations run successfully.
- [ ] Can send a test email via SMTP and Mock provider.
- [ ] `mypy` passes with no errors.

## Security Considerations
- Store SMTP credentials encrypted (if in DB) or strictly via env vars.
- Validate TLS/SSL connections for SMTP.
