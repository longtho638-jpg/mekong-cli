# TypeScript Interfaces

Guidelines for defining and using interfaces.

## Rules
- Prefer `interface` over `type` for object definitions that may be extended.
- Keep interfaces focused and small (Interface Segregation Principle).
- Use optional properties (`?`) sparingly; prefer union types or explicit nulls if a property must exist.
- Document complex interface properties with JSDoc comments.
- Export interfaces from central `types.ts` or `index.ts` files within a module.
- Use `readonly` for properties that should not be modified after initialization.
