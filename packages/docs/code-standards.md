# Code Standards & Guidelines

## 1. General Principles
- **YAGNI (You Aren't Gonna Need It)**: Do not add functionality until deemed necessary.
- **KISS (Keep It Simple, Stupid)**: Simplicity should be a key goal in design and unnecessary complexity should be avoided.
- **DRY (Don't Repeat Yourself)**: Every piece of knowledge must have a single, unambiguous, authoritative representation within a system.

## 2. File Organization & Naming
- **File Naming**: Use `kebab-case` for all files (e.g., `user-profile-controller.ts`, `auth-middleware.ts`).
  - Names must be descriptive and self-documenting.
  - Length is secondary to clarity (e.g., `generate-monthly-revenue-report.ts` is better than `gen-report.ts`).
- **Directory Structure**:
  - Group by feature or domain, not just by type.
  - Keep related files close (co-location).
- **File Size**: Target under **200 lines** per file.
  - Modularize larger files into smaller, focused components.
  - Extract utilities and helpers.

## 3. TypeScript / JavaScript
- **Strict Mode**: `strict: true` in `tsconfig.json`.
- **Types**:
  - Avoid `any`. Use `unknown` if necessary and narrow types.
  - explicit return types for functions are recommended.
  - Use `interface` for object definitions and `type` for unions/intersections.
- **Async/Await**: Prefer `async/await` over raw Promises (`.then/.catch`).
- **Error Handling**:
  - Use `try/catch` blocks.
  - Custom error classes for domain-specific errors.
  - Never swallow errors silently.

## 4. Code Style (Prettier/ESLint)
- **Formatting**: Rely on Prettier for formatting (indentation, quotes, semi-colons).
- **Linting**: No unused variables, no console logs in production code.
- **Comments**:
  - "Why" not "What". Code should explain "What".
  - JSDoc for public APIs and complex logic.

## 5. React / Next.js (Frontend)
- **Components**: Functional components with Hooks.
- **Props**: Use interfaces for Prop definitions.
- **State Management**:
  - Local state: `useState`.
  - Global state: Context or specialized libraries (Zustand/Redux) only when needed.
- **Performance**:
  - Use `useMemo` and `useCallback` judiciously.
  - Lazy load heavy components (`React.lazy`).

## 6. Backend (Node.js/Fastify)
- **Architecture**: Controller-Service-Repository pattern.
- **Validation**: Use Zod for schema validation (inputs/env vars).
- **Database**:
  - Use Prisma ORM.
  - Migrations must be versioned and committed.

## 7. Testing
- **Unit Tests**: Test individual functions/classes in isolation.
- **Integration Tests**: Test API endpoints and database interactions.
- **Conventions**:
  - Test files adjacent to source or in `__tests__`.
  - Naming: `*.test.ts` or `*.spec.ts`.
- **Coverage**: Aim for high coverage on critical paths.

## 8. Version Control (Git)
- **Commits**: Conventional Commits format.
  - `feat: add user login`
  - `fix: resolve crash on startup`
  - `docs: update api documentation`
  - `refactor: simplify auth logic`
- **Branches**: Feature branches off `main` or `master`.

## 9. Documentation
- Update `docs/` folder when architecture or features change.
- Inline comments for hacky fixes or complex algorithms.
- `README.md` in every package/app explaining how to run/test.
