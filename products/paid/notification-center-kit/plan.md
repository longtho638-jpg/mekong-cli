# Plan: Notification Center Kit

## Goal
Build a self-hosted Notification Center system that provides a unified API for sending in-app (real-time) and email notifications, handling user preferences, and tracking read status.

## Architecture
- **Backend**: FastAPI + SQLite (Async) + WebSockets (for real-time).
- **Frontend**: React (Vite) + Tailwind CSS v4 + Headless UI (Bell Widget).
- **SDK**: TypeScript client for easy integration (`notification.connect()`).

## Features
1. **In-App Feed**: Real-time bell icon widget with unread badge.
2. **Channels**: Support for In-App and simulated Email (log/console for starter).
3. **Preferences**: Users can opt-in/out of specific notification types.
4. **Broadcasting**: Admin endpoint to send system-wide alerts.
5. **Tracking**: Mark as read, archive.

## Data Model
- `Notification`: id, user_id, type, title, body, data (json), is_read, created_at.
- `NotificationPreference`: user_id, type, channel (in_app, email), enabled.

## API Endpoints
- `POST /notifications/send`: Trigger a notification (Internal/Admin).
- `GET /notifications/`: Get user's feed.
- `PATCH /notifications/{id}/read`: Mark as read.
- `WS /ws/notifications/{user_id}`: Real-time socket.
- `GET /preferences/`: Get user settings.
- `POST /preferences/`: Update user settings.

## Pricing
- **$47** (One-time license)
