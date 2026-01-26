# Multi-stage build for smaller image
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies (build-essential for some python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Copy files
COPY pyproject.toml poetry.lock* ./

# Export requirements.txt (to avoid installing poetry in final image)
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

# Final Stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime deps (Node.js for MJML)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g mjml \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install python deps
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Create non-root user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Default command (overridden in docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
