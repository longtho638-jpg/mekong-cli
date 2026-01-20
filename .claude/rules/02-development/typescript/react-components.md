# React Component Standards

Guidelines for building React components in the Antigravity ecosystem.

## Rules
- Use Functional Components with hooks; avoid Class Components.
- One component per file, named after the component (e.g., `UserCard.tsx`).
- Use `memo` for performance-critical components with stable props.
- Keep components small (<150 lines); split into sub-components if they grow too large.
- Adhere to MD3 (Material Design 3) for all UI components.
- Use Tailwind CSS for styling via the `ui-styling` skill.
