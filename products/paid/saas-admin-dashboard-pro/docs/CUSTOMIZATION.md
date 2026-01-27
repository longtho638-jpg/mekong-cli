# Customization Guide

How to tailor the dashboard to your brand and requirements.

## 1. Branding & Theme

The theme is configured in `src/theme/theme.ts`.

### Colors
Modify the `palette` object to match your brand colors:
```typescript
primary: {
  main: '#YOUR_BRAND_COLOR', // e.g., #6366f1
  light: '#...',
  dark: '#...',
},
```

### Typography
Change the font by importing a different font from `next/font/google` in `src/theme/theme.ts` and `src/app/layout.tsx`.

## 2. Navigation

To modify the sidebar menu, edit `src/components/layout/Sidebar.tsx`:

```typescript
const MENU_ITEMS = [
  { text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  // Add new items here
  { text: 'My New Page', icon: Star, path: '/my-page' },
];
```

## 3. Connecting Real Data

The template uses mock data located in `src/lib/api.ts`. To connect to a real backend:

1.  **Replace Mock API calls**:
    Edit `src/lib/api.ts` to use `fetch` or `axios` calls to your API endpoints.

    ```typescript
    // Before
    getAll: async () => MOCK_USERS,

    // After
    getAll: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    ```

2.  **Update React Query**:
    The components use React Query (`useQuery`), so they will automatically handle loading and error states once you switch the promise in `api.ts`.

## 4. Role-Based Access Control (RBAC)

Permissions are defined in `src/types/rbac.ts`.

-   **Add Resources**: Update `PermissionResource` type.
-   **Add Actions**: Update `PermissionAction` type.
-   **Enforce in UI**: Use the `Guard` component:
    ```tsx
    <Guard resource="reports" action="create">
      <Button>Create Report</Button>
    </Guard>
    ```

## 5. Adding New Pages

1.  Create a new folder in `src/app/(dashboard)/` (e.g., `reports/`).
2.  Add a `page.tsx` file inside it.
3.  Export a default React component.
4.  Add the route to the `Sidebar` configuration.
