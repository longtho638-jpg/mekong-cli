# API Documentation

The Background Jobs Kit provides a RESTful API to manage jobs and monitor the queue.

Base URL: `http://localhost:8000/api`

## Endpoints

### 1. Enqueue Job

Add a new job to the queue.

- **URL**: `/jobs`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "task_name": "email_notification",
    "payload": {
      "email": "user@example.com",
      "subject": "Welcome"
    },
    "max_retries": 3
  }
  ```
- **Response**:
  ```json
  {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending"
  }
  ```

### 2. Get Job Status

Retrieve the current status and details of a specific job.

- **URL**: `/jobs/{job_id}`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "task_name": "email_notification",
    "payload": {...},
    "status": "completed",
    "created_at": 1706227200.0,
    "retries": 0,
    "max_retries": 3,
    "error": null
  }
  ```

### 3. Get Queue Stats

Get real-time statistics about the job queues.

- **URL**: `/stats`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "pending": 5,
    "processing": 2,
    "failed": 0,
    "total_jobs": 100
  }
  ```

### 4. Retry Job

Manually retry a job that has permanently failed (moved to Dead Letter Queue).

- **URL**: `/jobs/{job_id}/retry`
- **Method**: `POST`
- **Response**:
  ```json
  {
    "message": "Job retried successfully"
  }
  ```

### 5. Clear Failed Jobs

Clear all jobs from the Dead Letter Queue.

- **URL**: `/jobs/failed`
- **Method**: `DELETE`
- **Response**:
  ```json
  {
    "message": "Cleared 12 failed jobs"
  }
  ```
