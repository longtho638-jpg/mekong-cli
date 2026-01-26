# Antigravity Admin Dashboard Lite

A production-ready, high-performance admin dashboard template built with Next.js 14, Tailwind CSS, and shadcn/ui. Designed for SaaS founders and developers who need a clean, responsive, and accessible admin panel.

![Dashboard Preview](https://public-files.gumroad.com/variants/preview.png)

## Features

- **Tech Stack**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS.
- **UI Library**: shadcn/ui components (fully typed and accessible).
- **Charts**: Recharts integration for beautiful data visualization.
- **Responsive**: Mobile-first design with collapsible sidebar and mobile drawer.
- **Dark Mode**: Native dark mode support via `next-themes`.
- **Layouts**:
  - Dashboard Overview (Stats, Charts, Recent Activity)
  - Analytics (Line charts, Pie charts, Date range picker)
  - User Management (Data tables with actions)
  - Settings (Profile, Account, Appearance tabs)
- **Components**:
  - Stats Cards with trends
  - Data Tables
  - Form elements
  - Navigation Sidebar
  - Header with Search and User Menu

## Project Structure

```
.
├── app/                  # Next.js App Router
├── components/
│   ├── layout/           # Sidebar, Header, Layout wrappers
│   ├── ui/               # shadcn/ui primitive components
│   ├── charts/           # Recharts wrappers
│   ├── stats/            # Statistic cards
│   └── ...
├── lib/                  # Utilities and helper functions
├── hooks/                # Custom React hooks (useSidebar, etc.)
├── pages/                # Page templates (for reference)
└── public/               # Static assets
```

## Getting Started

See [INSTALL.md](./INSTALL.md) for detailed installation instructions.

## Customization

See [CUSTOMIZATION.md](./CUSTOMIZATION.md) for theming and configuration guides.

## License

Standard Commercial License. You can use this for unlimited personal and commercial projects. You cannot resell or redistribute the source code as a standalone product.

---
Built with ❤️ by Antigravity Team
