# Worker Deployment Guide

Workers are the consumers that process jobs from the Redis queue. You can run multiple workers in parallel to scale processing power.

## running Locally

To run a single worker process locally:

```bash
cd backend
source venv/bin/activate
python -m app.worker
```

To run multiple workers, simply open multiple terminal tabs and run the same command.

## Production Deployment

### 1. Systemd (Linux)

Create a service file `/etc/systemd/system/background-worker.service`:

```ini
[Unit]
Description=Background Job Worker
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/backend/venv/bin"
Environment="REDIS_URL=redis://localhost:6379/0"
ExecStart=/path/to/backend/venv/bin/python -m app.worker
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable background-worker
sudo systemctl start background-worker
```

### 2. Docker

Dockerfile for the worker:

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "-m", "app.worker"]
```

Run with Docker Compose:

```yaml
version: '3.8'
services:
  worker:
    build: ./backend
    command: python -m app.worker
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    deploy:
      replicas: 3  # Scale to 3 workers
```

## Customizing Tasks

To add new task types, edit `backend/app/worker.py` and add logic to the `execute_task` function:

```python
def execute_task(task_name: str, payload: Dict[str, Any]):
    if task_name == "my_new_task":
        # Your custom logic here
        process_data(payload["id"])
        return "Processed successfully"

    # ... existing tasks
```

This simple registry pattern keeps things easy to understand (KISS) and avoids complex dynamic imports unless necessary.
