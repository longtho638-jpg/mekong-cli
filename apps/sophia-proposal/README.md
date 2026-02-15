```markdown
# Sophia Proposal

A modern web application built with Next.js 16, React 19, and Tailwind CSS v4.

## Features

- **Next.js 16** with App Router for optimal performance and SEO
- **React 19** with experimental React Compiler for enhanced developer experience
- **TypeScript** for type safety and better tooling
- **Tailwind CSS v4** for utility-first styling
- **Framer Motion** for smooth animations and transitions
- **Lucide React** for beautiful, consistent icons
- **ESLint** with Next.js configuration for code quality

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 |
| UI Library | React 19.2.3 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 12.31.0 |
| Icons | Lucide React 0.563.0 |
| Utilities | clsx, tailwind-merge |
| Linting | ESLint 9 |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build & Production

Build for production:

```bash
npm run build
# or
yarn build
```

Start the production server:

```bash
npm start
# or
yarn start
```

### Linting

Check code quality:

```bash
npm run lint
# or
yarn lint
```

## Project Structure

```
sophia-proposal/
├── app/                    # Next.js App Router pages and layouts
├── public/                 # Static assets (images, fonts, etc.)
├── claudedocs/            # Documentation for Claude AI integration
├── plans/                 # Project planning documents and proposals
├── .claude/              # Claude AI configuration
├── .cleo/                # Cleo configuration (if applicable)
├── .turbo/               # Turbo monorepo configuration
├── .vercel/              # Vercel deployment configuration
├── AGENTS.md             # AI agent documentation
├── CLAUDE.md             # Claude-specific documentation
├── GEMINI.md             # Gemini-specific documentation
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Project dependencies and scripts
├── postcss.config.mjs    # PostCSS configuration (Tailwind CSS v4)
└── tsconfig.json         # TypeScript configuration
```

## Key Configuration

- **React Compiler**: Enabled via `babel-plugin-react-compiler` (experimental)
- **Tailwind CSS v4**: Uses `@tailwindcss/postcss` plugin for modern CSS processing
- **TypeScript**: Strict mode enabled with React 19 types
- **ESLint**: Uses `eslint-config-next` for Next.js-specific linting rules

## Deployment

This project is configured for deployment on Vercel. The `.vercel` directory contains the project configuration.

### Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect the Next.js project and deploy it

Alternatively, use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Development Notes

- The project uses the **experimental React Compiler** which may require additional Babel configuration
- Tailwind CSS v4 introduces new configuration patterns compared to v3
- Next.js 16 includes various performance improvements and new features like Partial Prerendering (PPR) support
- All components should be built with React 19's new features in mind (e.g., `use` hook, Actions)

## Contributing

This is a private project. For internal team members:

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all linting passes
4. Create a pull request with a clear description
5. Wait for code review and approval

## License

This project is private and proprietary. All rights reserved.
```