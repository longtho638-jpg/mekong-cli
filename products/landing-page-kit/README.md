# 🚀 Landing Page Kit - Next.js 15

> Premium conversion-focused landing page template with dark mode, animations, and Polar.sh integration

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## ✨ Features

- 🌙 **Dark Mode** - Beautiful dark theme by default
- ⚡ **Next.js 15** - Latest React Server Components
- 🎨 **Tailwind CSS 4** - Modern utility-first styling
- 💳 **Polar.sh Ready** - Payment integration included
- 📱 **Responsive** - Mobile-first design
- 🔍 **SEO Optimized** - Meta tags, sitemap ready
- ⚡ **Fast** - 100 Lighthouse performance

## 📦 What's Included

```
landing-page-kit/
├── app/
│   ├── layout.tsx      # Root layout with fonts
│   ├── page.tsx        # Hero landing page
│   ├── checkout/       # Payment checkout flow
│   ├── docs/           # Documentation page
│   └── api/            # API routes for payments
├── lib/                # Utilities
├── public/             # Static assets
└── package.json        # Dependencies
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build
```

## 💰 Polar.sh Setup

1. Create account at [polar.sh](https://polar.sh)
2. Get API keys from dashboard
3. Add to `.env.local`:

```env
POLAR_ACCESS_TOKEN=your_token_here
POLAR_ORG_ID=your_org_id
```

## 🎨 Customization

### Colors

Edit `tailwind.config.ts` to change the color palette.

### Content

Modify `app/page.tsx` for hero content and CTAs.

### Pricing

Update `app/checkout/page.tsx` for your pricing tiers.

## 📄 License

MIT License - Use commercially, modify freely.

## 🤝 Support

- 📧 Email: billwill.mentor@gmail.com
- 💬 Twitter: @MekongDev

---

Built with ❤️ by MekongDev
