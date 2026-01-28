# IPO-051: Multi-Channel Notification System Implementation Plan

**Objective:** Implement a robust, multi-channel (Push, Email, SMS) notification system with template management, delivery tracking, and user preferences.

## Phase 1: Infrastructure & Database (Ch.4 形 Forms)
- [x] **Dependencies:** Add `pywebpush`, `firebase-admin`, `jinja2`, `apns2` (optional, can use FCM for iOS) to `requirements.txt` / `pyproject.toml`.
- [x] **Database Migrations:**
    - [x] Create migration for `notifications`, `user_preferences`, `push_subscriptions`, `notification_deliveries` (if not already present).
    - [x] Create migration for `notification_templates`.
- [x] **Configuration:**
    - [x] Update `backend/api/config/settings.py` with notification settings (FCM keys, Email providers).
    - [x] Create `backend/config/notification_config.yaml` for default templates/rules.

## Phase 2: Core Services (Ch.9 行軍 Logistics)
- [x] **Template Engine:**
    - [x] Create `backend/services/template_service.py` using Jinja2.
    - [x] Create `backend/templates/emails/` directory and default templates (welcome, reset, invoice, alert).
- [x] **Push Service Upgrade:**
    - [x] Refactor `backend/services/push_notification_service.py` to support FCM and APNs (via FCM or direct).
    - [x] Abstract provider logic.
- [x] **Email Service Upgrade:**
    - [x] Integrate `TemplateService` into `backend/services/email_service.py`.
    - [x] Ensure provider failover (SendGrid -> AWS SES -> SMTP).
- [x] **Rate Limiting:**
    - [x] Create `backend/services/notification_rate_limiter.py`.
- [x] **Orchestrator:**
    - [x] Create `backend/services/notification_orchestrator.py` to handle routing based on preferences and priority.

## Phase 3: API Layer (Ch.5 勢 Energy)
- [x] **Notification Router:**
    - [x] Update `backend/api/routers/notifications.py` (CRUD, mark as read).
- [x] **Preferences Router:**
    - [x] Create `backend/api/routers/notification_preferences.py`.
- [x] **Template Management Router:**
    - [x] Create `backend/api/routers/notification_templates.py` (Admin only).
- [x] **Push Subscription Router:**
    - [x] Add endpoints to register/unregister device tokens.

## Phase 4: Frontend Integration (Ch.2 作戦 Waging War)
- [x] **Service Worker:**
    - [x] Create/Update `apps/dashboard/public/sw.js` for handling background push.
- [x] **Hooks:**
    - [x] Update `apps/dashboard/hooks/usePushNotifications.ts` to register SW and tokens.
- [x] **Admin UI:**
    - [x] Create Template Editor at `apps/admin/app/notifications/templates/page.tsx`.
    - [x] Create Analytics Dashboard at `apps/admin/app/notifications/analytics/page.tsx`.

## Phase 5: Testing & Documentation (Ch.1 計 Estimations)
- [x] **Unit Tests:**
    - [x] Test Template rendering.
    - [x] Test Orchestrator routing logic.
    - [x] Test Rate Limiter.
- [x] **Integration Tests:**
    - [x] E2E Notification flow (Trigger -> Orchestrator -> Service -> Delivery Log).
- [x] **Documentation:**
    - [x] `docs/notification-system-guide.md`
    - [x] `docs/email-template-guide.md`

## Phase 6: Deployment & Verification
- [x] **Verify:** Run all tests.
- [ ] **Deploy:** Migration and code deployment.
- [ ] **Monitor:** Check delivery logs.

