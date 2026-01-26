# Usage Examples

Common patterns for using the Background Jobs Kit.

## 1. Sending an Email (Python Client)

You can enqueue jobs programmatically from any Python script using `requests` or `httpx`.

```python
import requests

API_URL = "http://localhost:8000/api/jobs"

payload = {
    "task_name": "email_notification",
    "payload": {
        "email": "customer@example.com",
        "subject": "Order Confirmation",
        "body": "Thank you for your order!"
    },
    "max_retries": 3
}

response = requests.post(API_URL, json=payload)
print(f"Job Enqueued: {response.json()['job_id']}")
```

## 2. Processing Data (Batch)

Enqueue multiple jobs for parallel processing.

```python
import requests

items = range(100)

for item_id in items:
    requests.post("http://localhost:8000/api/jobs", json={
        "task_name": "data_processing",
        "payload": {"data": [item_id]},
        "max_retries": 5
    })
```

## 3. Defining a New Task

In `backend/app/worker.py`:

```python
import time

def execute_task(task_name, payload):
    # ...
    elif task_name == "generate_pdf":
        user_id = payload["user_id"]
        logger.info(f"Generating PDF for user {user_id}")
        time.sleep(5) # Simulate heavy work
        return f"/tmp/reports/{user_id}.pdf"
    # ...
```

Then enqueue it:

```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"task_name": "generate_pdf", "payload": {"user_id": 123}}'
```

## 4. Error Handling & Retries

If a task raises an exception, the worker catches it and automatically retries based on `max_retries`.

Example of a fragile task in `worker.py`:

```python
import random

def execute_task(task_name, payload):
    if task_name == "flaky_api_call":
        if random.random() < 0.5:
            raise RuntimeError("API unavailable")
        return "Success"
```

Enqueue with retries:
```json
{
  "task_name": "flaky_api_call",
  "max_retries": 5
}
```

The system will retry up to 5 times before moving the job to the Failed list (Dead Letter Queue).
