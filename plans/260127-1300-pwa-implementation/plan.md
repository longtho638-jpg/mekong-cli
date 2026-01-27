# Plan: IPO-027-Mobile: Progressive Web App with mobile responsiveness

**TASK ID:** TASK-ef421e40
**Priority:** Critical
**Binh Pháp Chapter 4 形 (Disposition of Army)**

## Context
Implementing PWA features for AgencyOS (apps/dashboard) to provide a mobile-first, app-like experience. This includes Manifest, Service Worker, Offline Support, Push Notifications, and Mobile UI components.

## Phase 1: Configuration & Manifest
- [x] Create `public/manifest.json` with required icons and configuration.
- [x] Create `public/sw.js` (Service Worker) with caching strategies.
- [x] Register Service Worker in the application entry point (`components/pwa-init.tsx`).

## Phase 2: PWA Logic & Hooks
- [x] Implement `usePWAInstall` hook for A2HS prompt.
- [x] Implement `subscribeToPush` utility for push notifications.
- [x] Setup Push Notification API endpoint (`app/api/push/subscribe/route.ts`).
- [x] Setup Backend Service (`backend/services/fcm_service.py`).

## Phase 3: Mobile UI Components
- [x] Create `BottomNav` component for mobile navigation.
- [x] Create `OfflineIndicator` component.
- [x] Implement responsive layout adjustments (Safe area insets).
- [x] Update `DashboardShell` for mobile responsiveness.

## Phase 4: Integration & Verification
- [x] Integrate components into `app/layout.tsx` (RootLayout) and `components/ClientLayout.tsx`.
- [x] Updated `globals.css` with safe area utilities.

## Technical Details
- Target App: `apps/dashboard`
- Icons: Placeholder icons assumed or copied.
- MD3 Standards: Adhere to Material Design 3 for UI components.

## Win-Win-Win
- **Anh (Owner):** Mobile-ready for IPO, wider reach.
- **Agency:** Reusable PWA stack.
- **Client:** Better experience, offline access.

**Status:** COMPLETE ✅
