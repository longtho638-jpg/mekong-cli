# Phase 2: Backend Core & Security

> **Priority**: High
> **Status**: Pending

## Objectives
Implement the core backend logic for handling feedback submissions, secure file uploads, and API authentication.

## Requirements

### Authentication
- [ ] Implement API Key validation for widget clients
- [ ] API Key management (CRUD) for admins (future-proofing)

### Data Models
- [ ] `Feedback` model (text, metadata, screenshot_url, browser_info)
- [ ] `ApiKey` model (key, domain_whitelist, is_active)

### File Handling
- [ ] Secure file upload endpoint (validate mime-type, size)
- [ ] Storage abstraction (Local file system for dev, S3 interface for prod)
- [ ] Image optimization/compression

### Notification
- [ ] Email notification service (SMTP/SES) on new feedback

## Implementation Steps

1. **Database Schema**
   - Create SQLAlchemy models
   - Generate Alembic migrations

2. **API Key Logic**
   - Middleware to validate `X-API-Key` header
   - Check `Origin` header against domain whitelist

3. **Feedback Endpoint**
   - `POST /api/v1/feedback`
   - Accepts JSON payload + file
   - Validates input using Pydantic schemas

4. **Storage Service**
   - Implement `IStorage` interface
   - Create `LocalStorage` and `S3Storage` implementations
   - Generate unique filenames (UUID)

5. **Notification Service**
   - Background task for sending emails (don't block response)
   - HTML email template for new feedback

## Security Considerations
- Validate file types (only images)
- Limit file size (e.g., 5MB)
- Store API keys hashed? (Or encrypted, since they need to be displayed once)
- Rate limiting to prevent spam

## Todo List
- [ ] Models & Migrations
- [ ] API Key Middleware
- [ ] Upload Endpoint
- [ ] Storage Service
- [ ] Email Service
- [ ] Rate Limiting

## Success Criteria
- Secure API endpoints protected by keys
- Files successfully uploaded and retrievable
- Feedback stored in DB
- Emails sent upon submission
