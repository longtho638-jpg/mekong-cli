# Installation Guide

This kit is designed to be dropped into a **Next.js** project using **Tailwind CSS**.

## Prerequisites

- Node.js 18+
- A Next.js project (App Router recommended)
- Tailwind CSS installed and configured

## Step 1: Install Dependencies

We use `framer-motion` for animations and `clsx`/`tailwind-merge` for class utility management.

```bash
npm install framer-motion clsx tailwind-merge lucide-react
# or
yarn add framer-motion clsx tailwind-merge lucide-react
# or
pnpm add framer-motion clsx tailwind-merge lucide-react
```

## Step 2: Setup Utilities

Ensure you have a `cn` utility function. If you don't, create `lib/utils.ts` and paste:

```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Step 3: Configure Tailwind

Copy the `extend` object from the provided `styles/tailwind.config.js` to your project's `tailwind.config.js` to enable the custom animations and colors.

## Step 4: Add Components

Copy the `components` directory from this kit into your project (e.g., `src/components` or `app/components`).

## Step 5: Use a Template

Open one of the template files in `templates/` (e.g., `saas-classic.tsx`) and copy the code into your `page.tsx`.

```tsx
import { Hero } from "@/components/hero-sections/hero-scroll";
// ... other imports

export default function Home() {
  return (
    <main>
      <Hero />
      {/* ... */}
    </main>
  )
}
```

## Troubleshooting

- **"Module not found"**: Check your import paths. If you use `@/components/...` alias, ensure it's configured in `tsconfig.json`.
- **Styles looking wrong**: Ensure your global CSS file includes the Tailwind directives (`@tailwind base;`, etc.) and that `tailwind.config.js` content array includes the path to your new components.
