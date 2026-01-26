# Phase 5: Admin Dashboard

> **Priority**: Medium
> **Status**: Pending

## Objectives
Create a simple dashboard for product owners to view, filter, and manage feedback submissions.

## Requirements

### Access Control
- [ ] Simple login (Admin/Password) or integration with main auth
- [ ] Protected routes

### Feedback Management
- [ ] List view with columns (Date, Type, Email, Screenshot thumbnail)
- [ ] Detail view (Full screenshot, metadata, browser info)
- [ ] Status toggle (New, In Progress, Resolved)

### Settings
- [ ] API Key generation/revocation
- [ ] Email notification settings

## Implementation Steps

1. **Dashboard UI**
   - Use `shadcn/ui` or similar for rapid development
   - Layout: Sidebar + Content Area

2. **Data Integration**
   - `GET /api/v1/feedbacks`
   - `PATCH /api/v1/feedbacks/{id}`
   - `POST /api/v1/api-keys`

3. **Screenshot Viewer**
   - Lightbox for viewing screenshots
   - Zoom/Pan capability

## Todo List
- [ ] Auth UI
- [ ] Feedback Table
- [ ] Detail View
- [ ] Settings Page
- [ ] API Integration

## Success Criteria
- Admins can log in
- Admins can view and manage all feedback
- Screenshots load correctly
