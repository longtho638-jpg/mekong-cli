# React Props Standards

Guidelines for passing data to components.

## Rules
- Explicitly define prop types using interfaces or types.
- Destructure props in the component signature for clarity.
- Provide default values for optional props.
- Avoid passing too many props; consider context or state management for deep prop drilling.
- Use the `children` prop for layout or wrapper components.
- Keep props immutable; do not modify props within the component.
