# TypeScript Types

Guidelines for using advanced type features.

## Rules
- Prefer `type` for unions, intersections, and primitives.
- Use `unknown` instead of `any` for values of uncertain type.
- Avoid type assertions (`as Type`) unless absolutely necessary (e.g., interacting with external libraries).
- Leverage `Utility Types` (e.g., `Partial`, `Pick`, `Omit`) to derive types from existing ones.
- Define constant values using `as const` for literal type inference.
- Use template literal types for string pattern matching.
