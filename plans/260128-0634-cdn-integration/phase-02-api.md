# Phase 2: API Integration

## Goal
Expose CDN operations via API.

## Files to Create/Modify
- `backend/api/routers/cdn.py` (Create)
- `backend/api/main.py` (Modify)
- `backend/api/config/settings.py` (Modify)

## Implementation Details
- **CDNRouter**:
    - `POST /cdn/purge`: Purge cache (zone, tags, or urls).
    - `GET /cdn/config`: Get current CDN config.
    - `POST /cdn/optimize`: Trigger optimization task.
- **Main**: Register router.
- **Settings**: Add `CDN_API_KEY`, `CDN_ZONE_ID` etc.
