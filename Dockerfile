# 🏯 Agency OS - Docker Configuration
# =====================================
# Production-ready container for Cloud Run

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY core/ ./core/
COPY backend/ ./backend/

# Expose port (Cloud Run uses 8080)
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Run server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]

