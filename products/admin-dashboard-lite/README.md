# 📊 Admin Dashboard Lite

> Clean, minimal admin dashboard with charts, tables, and dark mode. Perfect for MVPs and internal tools.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Recharts](https://img.shields.io/badge/Recharts-2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Features

- 📈 **Charts** - Line, Bar, Pie with Recharts
- 📋 **Data Tables** - Sort, filter, paginate
- 🌙 **Dark Mode** - System preference detection
- 📱 **Responsive** - Sidebar collapses on mobile
- 🎨 **Clean Design** - Minimal, professional look
- ⚡ **Fast** - No heavy dependencies
- 🧩 **Modular** - Easy to extend

## 📦 What's Included

```
admin-dashboard-lite/
├── app/
│   ├── layout.tsx
│   ├── page.tsx           # Dashboard overview
│   ├── analytics/page.tsx # Charts page
│   ├── users/page.tsx     # Users table
│   └── settings/page.tsx  # Settings page
├── components/
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── charts/
│   │   ├── line-chart.tsx
│   │   ├── bar-chart.tsx
│   │   └── pie-chart.tsx
│   ├── tables/
│   │   └── data-table.tsx
│   └── cards/
│       └── stat-card.tsx
└── lib/
    └── mock-data.ts
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev
```

## 🎨 Customization

### Add New Pages

1. Create folder in `app/`
2. Add `page.tsx`
3. Update sidebar links

### Add New Charts

```tsx
import { AreaChart } from "@/components/charts/area-chart";

<AreaChart data={yourData} />;
```

### Customize Theme

Edit `app/globals.css` for color variables.

## 📊 Components

| Component   | Description                |
| ----------- | -------------------------- |
| `StatCard`  | KPI display with icon      |
| `LineChart` | Time series data           |
| `BarChart`  | Comparison data            |
| `DataTable` | Sortable, filterable table |
| `Sidebar`   | Collapsible navigation     |

## 📄 License

MIT License - Use commercially, modify freely.

## 🤝 Support

- 📧 Email: billwill.mentor@gmail.com
- 💬 Twitter: @MekongDev

---

Built with ❤️ by MekongDev
