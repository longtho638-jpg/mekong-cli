# ============================================================================
# AgencyOS Backend - Production Docker Image
# Multi-stage build optimized for size, security, and performance
# ============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Install dependencies and compile Python packages
# -----------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS builder

# Set build-time environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=100

WORKDIR /build

# Install system build dependencies (minimal set)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only dependency files first (layer caching optimization)
COPY requirements.txt .

# Install Python dependencies to isolated prefix
RUN pip install --prefix=/install --no-warn-script-location -r requirements.txt

# -----------------------------------------------------------------------------
# Stage 2: Runtime - Minimal production image
# -----------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS runtime

# Metadata labels
LABEL maintainer="AgencyOS <support@agencyos.dev>" \
      version="3.0.0" \
      description="AgencyOS Backend API - FastAPI Production Server" \
      org.opencontainers.image.source="https://github.com/yourusername/mekong-cli"

# Set runtime environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000 \
    ENVIRONMENT=production \
    WORKERS=4

WORKDIR /app

# Install minimal runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Create non-root user with specific UID/GID for security
RUN groupadd -r -g 1000 agencyos && \
    useradd -r -u 1000 -g agencyos -m -s /bin/bash agencyos && \
    mkdir -p /app/logs /app/data && \
    chown -R agencyos:agencyos /app

# Copy application code (minimal files only)
COPY --chown=agencyos:agencyos backend ./backend
COPY --chown=agencyos:agencyos api ./api
COPY --chown=agencyos:agencyos agents ./agents
COPY --chown=agencyos:agencyos controllers ./controllers
COPY --chown=agencyos:agencyos core ./core
COPY --chown=agencyos:agencyos middleware ./middleware
COPY --chown=agencyos:agencyos models ./models
COPY --chown=agencyos:agencyos routes ./routes
COPY --chown=agencyos:agencyos services ./services
COPY --chown=agencyos:agencyos utils ./utils
COPY --chown=agencyos:agencyos websocket ./websocket
COPY --chown=agencyos:agencyos main.py .
COPY --chown=agencyos:agencyos di_container.py .

# Copy essential config files
COPY --chown=agencyos:agencyos .env.example .env.example

# Switch to non-root user
USER agencyos

# Expose application port
EXPOSE 8000

# Health check with retry logic
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application with production settings
# Using uvicorn with multiple workers for production
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--loop", "uvloop", \
     "--http", "httptools", \
     "--access-log", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]

# -----------------------------------------------------------------------------
# Stage 3 (Optional): Development image with debugging tools
# -----------------------------------------------------------------------------
FROM runtime AS development

USER root

# Install development dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    vim \
    iputils-ping \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Install development Python packages
RUN pip install --no-cache-dir \
    pytest>=7.0.0 \
    pytest-cov>=4.0.0 \
    pytest-asyncio>=0.21.0 \
    black>=23.0.0 \
    flake8>=6.0.0 \
    mypy>=1.0.0 \
    ipython>=8.0.0

USER agencyos

# Override CMD for development with hot reload
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--reload", \
     "--reload-dir", "/app", \
     "--access-log"]
