# Customization Guide

## Colors

This kit uses standard Tailwind colors (slate, neutral, purple, blue, emerald).

To change the primary brand color:
1. Open `tailwind.config.js`
2. Update the `colors` object or the utility classes in the components.
3. For example, replace `text-purple-500` with `text-indigo-600` globally.

## Fonts

We use the default Tailwind font stack. To use a custom font (like Inter or Geist):

1. Import the font in your `layout.tsx`:
   ```tsx
   import { Inter } from 'next/font/google'
   const inter = Inter({ subsets: ['latin'] })
   ```
2. Apply it to the body:
   ```tsx
   <body className={inter.className}>
   ```

## Animations

Animations are powered by **Framer Motion**.

- **Scroll Animations**: Tweak `useScroll` ranges in `container-scroll-animation.tsx`.
- **Spotlight**: Adjust the `fill` prop or SVG path in `spotlight.tsx`.
- **Background Beams**: Modify the `animate` prop in `background-beams.tsx` to change speed or trajectory.

## Content

All components accept content via props or direct editing.
For the Starter kit, direct editing of the TSX files is the simplest way to update text, links, and images.

Example (`hero-scroll.tsx`):
```tsx
<h1 className="...">
  Build your next SaaS <br />
  <span className="...">With Superpowers</span>
</h1>
```
Change "With Superpowers" to your product's value prop.
