# Customization Guide

Admin Dashboard PRO is built to be easily customized to match your brand and requirements.

## Theming

### Colors

We use Tailwind CSS variables for theming. Open `src/app/globals.css` (or wherever your base styles are) to customize the color palette.

The colors follow the `shadcn/ui` convention using HSL values:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;

  /* ... other variables */
}
```

### Typography

To change the font, update `src/app/layout.tsx`. By default, we use `Inter`.

```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
```

You can replace this with any other Google Font or local font.

## Components

### extending UI Components

All base UI components reside in `src/components/ui`. These are unstyled by default (headless) or styled via `class-variance-authority` (CVA).

To modify a button's default style, edit `src/components/ui/button.tsx`:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center ...", // base classes
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Add your new variant here
        custom: "bg-purple-600 text-white hover:bg-purple-700",
      },
      // ...
    },
  }
)
```

## Adding New Pages

1. **Create Route**: Add a new folder in `src/app`, e.g., `src/app/products`.
2. **Create Page**: Add a `page.tsx` file inside that folder.
3. **Add to Sidebar**: Open `src/components/layout/Sidebar.tsx` and add your new link to the navigation menu.

## API Integration

The project uses a mock API utility by default. To connect to a real backend:

1. Update `NEXT_PUBLIC_API_URL` in `.env`.
2. Modify `src/lib/api.ts` to use `fetch` or `axios` against your real endpoints.
3. Ensure your backend response structure matches the TypeScript interfaces in `src/types`.

## WebSocket

To customize real-time events:

1. Edit `src/lib/websocket.ts` to define your event listeners.
2. Update `src/hooks/useWebSocket.ts` to expose new data states to your components.
