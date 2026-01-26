# Phase 3: Backend API

**Status**: Complete
**Goal**: Handle feedback submission and storage.

## Models
- **Feedback**: id, content, type, rating, metadata (json), screenshot_url, created_at, status.

## Endpoints
- `POST /api/v1/feedback`: Submit feedback (multipart/form-data).
- `GET /api/v1/feedback`: List feedback (Admin).
- `PATCH /api/v1/feedback/{id}`: Update status.

## Deliverables
- API Endpoints.
- Image storage logic (Local/S3).
- SQLite database (simplest for kit).
