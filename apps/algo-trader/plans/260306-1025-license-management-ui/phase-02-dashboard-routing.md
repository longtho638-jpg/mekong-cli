---
phase: 2
title: "Dashboard Routing & Shell Integration"
complexity: SIMPLE
effort: 0.5h
status: pending
---

# Phase 2: Dashboard Routing — Add License Page Route

## Context

Dashboard uses React Router with existing pages: Dashboard, Backtests, Marketplace, Reporting, Settings.

Need to add `/licenses` route for admin-only license management.

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `dashboard/src/App.tsx` | Modify | Add `/licenses` route |
| `dashboard/src/components/sidebar-navigation.tsx` | Modify | Add nav link |
| `dashboard/src/pages/license-page.tsx` | Create | New page component (Phase 3) |

## Implementation Steps

### 2.1 Add Route to App.tsx (lines 12-19)

Import and add route:

```typescript
import { LicensePage } from './pages/license-page';

// Inside Routes:
<Route path="/licenses" element={<LicensePage />} />
```

### 2.2 Add Nav Link to Sidebar (lines 15-71)

Add to `NAV_ITEMS` array:

```typescript
{
  label: 'Licenses',
  path: '/licenses',
  icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <rect x="8" y="11" width="8" height="3" rx="1" />
    </svg>
  ),
},
```

## Success Criteria

- [ ] `/licenses` route accessible
- [ ] "Licenses" nav item appears in sidebar
- [ ] Active state works (highlight on current page)
- [ ] Redirect to `/licenses` from invalid paths works

## Component Structure

```
LicensePage (new)
├── LicenseListContainer
│   ├── FiltersBar
│   └── LicenseTable
├── CreateLicenseModal
├── AuditLogPanel
└── UsageAnalyticsCard
```

## Related Files

- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/App.tsx`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/components/sidebar-navigation.tsx`
