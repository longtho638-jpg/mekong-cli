# Progressive Web App (PWA) Setup Guide

> **Strategic Value (Binh Pháp):** Adapting to the "Terrain" (Mobile) - Chapter 4 形 (Disposition).

## Overview
AgencyOS Dashboard is configured as a fully compliant Progressive Web App (PWA) offering a native-like experience on mobile devices.

### Key Features
- **Installable:** "Add to Home Screen" support (A2HS).
- **Offline Capable:** Service Worker caching strategies (Network First for APIs, Cache First for assets).
- **Push Notifications:** Integrated with Firebase Cloud Messaging (FCM).
- **Mobile Optimized:** Bottom Navigation, Safe Area support, Touch-optimized UI.

## Architecture

### 1. Manifest & Service Worker
- **Manifest:** `apps/dashboard/public/manifest.json` defines the app identity, icons, and display mode (standalone).
- **Service Worker:** `apps/dashboard/public/sw.js` handles:
  - Caching App Shell (HTML, CSS, JS).
  - Intercepting network requests.
  - Handling Push events.

### 2. Frontend Components
- **PWA Initialization:** `components/pwa-init.tsx` registers the Service Worker on mount.
- **Install Prompt:** `lib/pwa/install-prompt.ts` hook captures the `beforeinstallprompt` event.
- **Bottom Navigation:** `components/mobile/bottom-nav.tsx` provides mobile-only navigation and the "Install App" button.
- **Offline Indicator:** `components/mobile/offline-indicator.tsx` detects network status changes.

### 3. Push Notifications (FCM)
The system uses VAPID keys for identification and Firebase Admin for sending messages.

**Frontend:**
- `lib/pwa/push-notifications.ts`: Request permission & subscribe via PushManager.
- `app/api/push/subscribe/route.ts`: Endpoint to receive and save user subscriptions.

**Backend:**
- `backend/services/fcm_service.py`: Python service using `firebase-admin` to send messages.

## Configuration Requirements

### Environment Variables
Ensure these are set in your `.env`:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="<your-vapid-public-key>"

# Backend (.env)
VAPID_PRIVATE_KEY="<your-vapid-private-key>"
VAPID_MAILTO="mailto:admin@agencyos.com"
FIREBASE_CREDENTIALS_PATH="firebase-service-account.json"
```

### Generating VAPID Keys
You can generate keys using the `web-push` library:
```bash
npx web-push generate-vapid-keys
```

### Firebase Setup
1. Go to Firebase Console -> Project Settings -> Service Accounts.
2. Generate new private key (`firebase-service-account.json`).
3. Place this file in the `backend/` root (do not commit to git).

## Mobile Responsiveness Guidelines (MD3)

When developing new features, adhere to:
1. **Breakpoints:** Use `md:` prefixes for desktop-only styles.
2. **Navigation:** Add new primary routes to `BottomNav` (max 4-5 items).
3. **Safe Areas:** Use `pb-safe`, `pt-safe` from `globals.css` for fixed elements.
4. **Touch Targets:** Ensure buttons are at least 44x44px.

## Testing PWA
1. **Desktop:** Open DevTools -> Application -> Service Workers / Manifest.
2. **Mobile (iOS):** Open in Safari -> Share -> Add to Home Screen.
3. **Mobile (Android):** Open in Chrome -> Install AgencyOS.

## Troubleshooting
- **Install button not showing:** Ensure the site is served over HTTPS (or localhost) and `manifest.json` is valid.
- **Push blocked:** Check if user denied permission or if VAPID keys match.
- **Updates not seeing:** Service Worker updates on new visits; force refresh or close/reopen app.
