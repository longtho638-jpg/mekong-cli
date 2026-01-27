# ============================================================================
# AgencyOS Backend - Production Dockerfile
# Optimized for Size, Security, and Performance
# ============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Compile Python dependencies
# -----------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS builder

# Set build-time environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=100

WORKDIR /build

# Install minimal build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from root context
COPY requirements.txt .

# Install dependencies to isolated location
RUN pip install --prefix=/install --no-warn-script-location -r requirements.txt

# -----------------------------------------------------------------------------
# Stage 2: Runtime - Minimal Production Image
# -----------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS runtime

# Metadata
LABEL maintainer="AgencyOS <support@agencyos.dev>" \
      version="3.0.0" \
      description="AgencyOS Backend API - Production Server"

# Set runtime environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000 \
    ENVIRONMENT=production

WORKDIR /app

# Install runtime dependencies (curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security (UID 1000)
RUN groupadd -r agencyos && \
    useradd -r -g agencyos -u 1000 -m -s /bin/bash agencyos

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy application code
# Assumes build context is project root
COPY --chown=agencyos:agencyos backend /app/backend
COPY --chown=agencyos:agencyos .env.example /app/.env.example

# Set proper permissions
RUN chown -R agencyos:agencyos /app

# Switch to non-root user
USER agencyos

# Expose application port
EXPOSE 8000

# Health Check (Interval: 30s, Timeout: 5s, Retries: 3)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start Application with Uvicorn (Production Workers)
CMD ["uvicorn", "backend.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
