```markdown
# AgencyOS Landing Page

A modern, high-performance landing page for AgencyOS — a next-generation AI agency platform powered by advanced language models and automation.

![AgencyOS Landing Page](https://via.placeholder.com/1200x600?text=AgencyOS+Landing+Page+Preview)

## Overview

AgencyOS Landing is the public-facing website for [AgencyOS](https://agencyos.ai), designed to showcase AI-powered agency workflows, agent ecosystems, and enterprise automation capabilities. Built with Next.js 16, React 19, and Tailwind CSS 4, it delivers blazing-fast performance, internationalization support, and seamless animations for an immersive user experience.

## Tech Stack

- **Framework**: Next.js 16.1.6 (with Turbopack)
- **Runtime**: React 19.2.3 + React DOM 19.2.3
- **Styling**: Tailwind CSS 4 + `tailwind-merge` + `class-variance-authority` + `clsx`
- **Animation**: Framer Motion 12.33.0 + Lenis (smooth scrolling)
- **Internationalization**: next-intl 4.8.2
- **Validation**: Zod 4.3.6
- **Icons**: Lucide React 0.563.0
- **Accordion**: Radix UI Accordion 1.2.12
- **Testing**: Vitest 3.1.1
- **Linting**: ESLint 9 + `eslint-config-next`
- **Type Safety**: TypeScript 5 + @types/react 19
- **Build Analyzer**: @next/bundle-analyzer
- **Compiler**: Babel Plugin React Compiler (experimental)

## Features

- ✅ Server-side rendering & static site generation
- ✅ Full internationalization (i18n) support
- ✅ Smooth scrolling with Lenis
- ✅ Responsive, mobile-first design
- ✅ Animated components with Framer Motion
- ✅ Type-safe forms and validation with Zod
- ✅ Optimized asset loading and image handling
- ✅ ESLint + TypeScript for enterprise-grade code quality
- ✅ Built-in test suite with Vitest
- ✅ Dockerized for consistent deployment
- ✅ Vercel & Docker deployment ready

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/agencyos/agencyos-landing.git
cd agencyos-landing

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

### Build & Production

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Linting & Type Checking

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npm run typecheck
```

### Testing

```bash
# Run tests
npm run test
```

## Deployment

### Vercel

Deploy with one click using the [Vercel Platform](https://vercel.com/new):

- Push to GitHub
- Import repository into Vercel
- Environment variables will be auto-detected from `.env.local`

### Docker

Build and run with Docker:

```bash
docker build -t agencyos-landing .
docker run -p 3000:3000 agencyos-landing
```

## Documentation

- **Agent Ecosystem**: See [AGENTS.md](AGENTS.md) for details on AI agents integrated into AgencyOS
- **Claude Integration**: Learn about Claude-specific configurations in [CLAUDE.md](CLAUDE.md)
- **Gemini Integration**: Details on Google Gemini usage in [GEMINI.md](GEMINI.md)
- **Audit & Compliance**: Review security and compliance practices in [AUDIT.md](AUDIT.md)
- **Developer Docs**: Visit the [docs/](docs/) directory for architecture and API references

## Contributing

Contributions are welcome! Please read our [Contribution Guidelines](CONTRIBUTING.md) (to be added) and open an issue or PR.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

© 2025 AgencyOS. Built with ❤️ for the future of AI agencies.
```