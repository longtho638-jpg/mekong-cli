# Design Guidelines: Sophia Proposal (Deep Space Edition)

## 1. Visual Identity ("Deep Space")

The design language is built around the concept of "Deep Space" — a premium, high-tech, and futuristic aesthetic that conveys automation, speed, and endless potential.

### 1.1 Color Palette

| Usage | Color Name | Hex | Tailwind Class | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | Deep Space | `#030014` | `bg-deep-space` | The void of space. Richer than pure black. |
| **Primary** | Neon Cyan | `#00F5FF` | `text-primary` | High-energy accents, call-to-actions. |
| **Secondary** | Electric Purple | `#8B5CF6` | `text-secondary` | Gradients, secondary highlights. |
| **Accent** | Hot Pink | `#EC4899` | `text-accent` | Special alerts, "wow" moments. |
| **Surface** | Glass | `white/5` | `bg-white/5` | Frosted glass effect for cards. |
| **Border** | Stardust | `white/10` | `border-white/10` | Subtle definition for components. |

### 1.2 Typography

**Headings: Space Grotesk**
- A proportional sans-serif with a futuristic, tech-forward personality.
- Used for `h1`, `h2`, `h3`, and prominent numbers.
- Weights: `Bold (700)`, `Medium (500)`.

**Body: Inter**
- Clean, highly readable sans-serif.
- Used for paragraphs, lists, and UI controls.
- Weights: `Regular (400)`, `Medium (500)`.

### 1.3 Effects & Textures

- **Noise Texture:** A subtle SVG noise overlay (`opacity: 0.03`) is applied globally to prevent the dark background from looking "flat" or "plastic".
- **Glows:** Radial gradients (`from-primary/20` to `transparent`) used behind hero elements and pricing cards to simulate light sources.
- **Glassmorphism 2.0:**
  - Background: `bg-deep-space/60` (or lighter for cards)
  - Blur: `backdrop-blur-xl` or `backdrop-blur-md`
  - Border: `1px solid white/10`
  - Inner Shadow: `inset 0 0 20px rgba(255,255,255,0.02)`

---

## 2. Component Library

### 2.1 Buttons

**Primary Button**
- Gradient background: `bg-gradient-to-r from-primary to-secondary`
- Text: White, Bold
- Hover: Scale `1.05`, Shadow Glow

**Secondary Button**
- Background: `bg-white/10` (Glass)
- Border: `1px solid white/20`
- Hover: `bg-white/20`

### 2.2 GlassCard

The core container for content.
```tsx
<GlassCard className="p-8">
  <h3 className="text-xl font-heading">Content</h3>
</GlassCard>
```
- Includes automatic hover effects (lift + bloom) for interactive cards.

### 2.3 Floating Elements

Used in the Hero section to create depth.
- 3D perspective floating animation.
- Parallax effect on scroll.

---

## 3. Motion System

Powered by `framer-motion` with `LazyMotion` for performance.

### 3.1 Entrance Animations
- **FadeIn:** Standard entry for sections.
  - `direction="up"`: Default for cards and text blocks.
  - `duration={0.5}`: Snappy but smooth.
- **StaggerContainer:** Used for lists (features, pricing benefits).
  - `staggerChildren={0.1}`: Creates a cascading effect.

### 3.2 Micro-interactions
- **Buttons:** Scale down (`0.95`) on tap, scale up (`1.05`) on hover.
- **Inputs/Sliders:** Neon glow border on focus.

### 3.3 Scroll Effects
- Elements use `viewport={{ once: true, margin: "-50px" }}` to trigger animations only when they enter the viewport.

---

## 4. Accessibility (a11y)

- **Contrast:** All text on the dark background must meet WCAG AA standards (4.5:1).
- **Reduced Motion:** Animations should respect `prefers-reduced-motion` (implemented via Framer Motion's `useReducedMotion` or CSS media queries).
- **Focus States:** High-visibility cyan outlines for keyboard navigation.
