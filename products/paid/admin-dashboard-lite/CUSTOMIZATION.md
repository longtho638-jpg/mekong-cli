# Customization Guide

## Theming

The dashboard uses CSS variables for theming, located in `styles/globals.css`. It supports both light and dark modes out of the box.

### Changing Colors

To change the primary color (default is slate-900), update the `--primary` and `--primary-foreground` variables in `styles/globals.css`.

Example (Blue theme):

```css
:root {
  /* ... other vars */
  --primary: 221.2 83.2% 53.3%; /* Blue 600 */
  --primary-foreground: 210 40% 98%;
}

.dark {
  /* ... other vars */
  --primary: 217.2 91.2% 59.8%; /* Blue 500 */
  --primary-foreground: 222.2 47.4% 11.2%;
}
```

### Radius

To change the border radius of components, update the `--radius` variable:

```css
:root {
  --radius: 0.5rem; /* 8px */
}
```

## Sidebar

The sidebar configuration is located in `components/layout/sidebar.tsx`.

To add new menu items:

```tsx
const sidebarItems = [
  // ... existing items
  {
    title: "New Page",
    href: "/new-page",
    icon: NewIcon, // Import from lucide-react
  },
]
```

## Charts

We use Recharts for data visualization. Chart components are located in `components/charts/`.

To customize the colors of a chart:

1. Open the specific chart file (e.g., `components/charts/overview-chart.tsx`).
2. Update the `fill` or `stroke` properties of the `<Bar />` or `<Line />` components.
3. Or update the data array to include dynamic colors.

## Fonts

The project uses `next/font` which is configured in `app/layout.tsx`. To change the font:

1. Import your desired font from `next/font/google`.
2. Apply it to the `body` class name.
