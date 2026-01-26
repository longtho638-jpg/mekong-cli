# Installation Guide

This guide will help you set up and run Admin Dashboard PRO in your local development environment.

## Prerequisites

- **Node.js**: Version 18.17.0 or later
- **Package Manager**: npm, yarn, or pnpm
- **Git**: For version control

## Step-by-Step Installation

### 1. Extract the Project

Unzip the `antigravity-admin-dashboard-pro-v1.0.0.zip` file to your desired location.

### 2. Install Dependencies

Open your terminal, navigate to the project directory, and run the installation command:

```bash
cd admin-dashboard-pro

# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory by copying the example file:

```bash
cp .env.example .env.local
```

Open `.env.local` and update the variables if necessary:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APP_NAME="Admin Dashboard PRO"
```

### 4. Running Development Server

Start the local development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 5. Building for Production

To create an optimized production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Troubleshooting

### Common Issues

**Dependency Conflicts**
If you encounter peer dependency errors, try running:
```bash
npm install --legacy-peer-deps
```

**TypeScript Errors**
Ensure you are using a compatible TypeScript version. The project is configured for TypeScript 5.x.

**Port Already in Use**
If port 3000 is busy, Next.js will automatically try 3001. You can specify a port manually:
```bash
npm run dev -- -p 4000
```
