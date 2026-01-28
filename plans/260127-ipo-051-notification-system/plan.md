# IPO-051 Notification System Implementation Plan

**Status:** In Progress
**Date:** 2026-01-27
**Author:** Antigravity (Claude Code)

## Overview
Upgrade the `NotificationService` from an in-memory mock to a robust, database-backed system supporting multi-channel delivery (In-app, Email) and user preferences.

## Phases

### Phase 1: Service Refactoring (Core)
- [ ] Refactor `NotificationService` to use `AsyncSession`.
- [ ] Implement `create_notification` using `Notification` model.
- [ ] Implement `get_notifications` with pagination.
- [ ] Implement `mark_as_read`.
- [ ] Implement `get_unread_count`.

### Phase 2: User Preferences
- [ ] Implement `get_preferences` and `update_preferences`.
- [ ] Ensure default preferences are created for new users.

### Phase 3: Multi-Channel Delivery
- [ ] Integrate `EmailService` for email notifications.
- [ ] Implement channel routing logic based on `UserNotificationPreferences`.
- [ ] Record delivery status in `NotificationDelivery` (optional, for Phase 4 or now if easy).

### Phase 4: API Endpoints
- [ ] Create `backend/api/routers/notifications.py`.
- [ ] Endpoints:
    - `GET /notifications`
    - `PATCH /notifications/{id}/read`
    - `POST /notifications/read-all`
    - `GET /notifications/unread-count`
    - `GET /notifications/preferences`
    - `PUT /notifications/preferences`

### Phase 5: Testing & Integration
- [ ] Unit tests for `NotificationService`.
- [ ] Integration tests for API endpoints.

## Dependencies
- `backend/models/notification.py` (Existing)
- `backend/services/email_service.py` (Existing)
