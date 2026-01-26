# Installation Guide

Follow these steps to get your Admin Dashboard up and running.

## Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

## Setup

1. **Unzip the project**
   Extract the `antigravity-admin-dashboard-lite.zip` file to your desired directory.

2. **Install dependencies**
   Open your terminal, navigate to the project folder, and run:

   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

To create an optimized production build:

```bash
npm run build
npm start
```

## Project Configuration

- **Tailwind Config**: Edit `tailwind.config.js` to customize colors, fonts, and spacing.
- **TypeScript**: Configured in `tsconfig.json`.
- **shadcn/ui**: Components are located in `components/ui/`.

## Common Issues

- **Missing modules**: If you see errors about missing modules, try deleting `node_modules` and `package-lock.json` and running `npm install` again.
- **Hydration errors**: Ensure you are not using browser-specific APIs (like `window`) in Server Components.

## Support

If you encounter any issues, please contact support via the Gumroad purchase page.
