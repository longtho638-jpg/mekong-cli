---
name: nextjs
description: Expert Next.js 14+ development with App Router, Server Components, and modern patterns. Use for building production-ready React applications.
tools: Read, Write, Edit, Bash
---

# ⚡ Next.js Skill

Expert Next.js development with App Router and modern patterns.

## When to Use

- Creating new Next.js applications
- Building with App Router architecture
- Server Components and streaming
- API routes and middleware

## Tech Stack

- **Next.js**: 14+ (Turbopack)
- **Router**: App Router (app/ directory)
- **Components**: Server/Client separation
- **Data**: Server Actions, React Query
- **Deploy**: Vercel optimized

## Key Patterns

1. **Server Components** - Default for all components
2. **Client Components** - "use client" directive
3. **Loading States** - loading.tsx files
4. **Error Boundaries** - error.tsx files
5. **Layouts** - Nested layout composition

## File Conventions

```
app/
├── layout.tsx       # Root layout
├── page.tsx         # Home page
├── loading.tsx      # Loading UI
├── error.tsx        # Error boundary
├── not-found.tsx    # 404 page
└── [dynamic]/       # Dynamic routes
```

## Example Prompts

```
"Use nextjs to create a dashboard layout"
"Use nextjs to add API route with validation"
"Use nextjs to implement dynamic routing"
```
