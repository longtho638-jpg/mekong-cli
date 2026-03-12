FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY pyproject.toml poetry.lock* ./
RUN pip install poetry && poetry config virtualenvs.create false && poetry install --no-dev --no-interaction

# Copy application
COPY src/ ./src/
COPY factory/ ./factory/

# Expose port
EXPOSE 8000

# Run
CMD ["uvicorn", "src.core.gateway:app", "--host", "0.0.0.0", "--port", "8000"]
