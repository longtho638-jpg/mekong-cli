# AgencyOS Landing - Design Guidelines

> Deep Space Identity System

---

## Color Palette

### Primary Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `deep-space-950` | `#020010` | Deepest backgrounds, footer placeholders |
| `deep-space-900` | `#030014` | Body background, primary surface |
| `deep-space-800` | `#0a0a1f` | Elevated surfaces, cards |
| `deep-space-700` | `#11112e` | Subtle section dividers |
| `deep-space-600` | `#1a1a3e` | Hover states on dark surfaces |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `nebula-400` | `#A78BFA` | Secondary text highlights, subtle accents |
| `nebula-500` | `#8B5CF6` | Primary accent, gradients, CTAs |
| `nebula-600` | `#7C3AED` | Hover/active states on accent elements |
| `primary-cyan` | `#00F5FF` | Active nav indicators, terminal prompts |
| `amethyst-400` | `#C084FC` | Decorative accents |
| `amethyst-500` | `#A855F7` | Secondary accent for variety |
| `amethyst-600` | `#9333EA` | Deep accent states |

### Text Colors

| Token | Usage |
|-------|-------|
| `white` | Headings, brand names, strong emphasis |
| `starlight-50` | Near-white for maximum contrast text |
| `starlight-100` | Body text default (set on `<body>`) |
| `starlight-200` | Secondary body text, descriptions |
| `starlight-300` | Tertiary text, captions, meta info |
| `starlight-400` | Muted text, copyright, disabled states |

### Glass & Glow

| Token | Value | Usage |
|-------|-------|-------|
| `glass-50` | `white/5` | Lightest glass background |
| `glass-100` | `white/10` | Default glass card background |
| `glass-200` | `white/15` | Highlighted glass card |
| `glass-300` | `white/20` | Strong glass emphasis |
| `glow-purple` | `rgba(168,85,247,0.4)` | Purple glow effects |
| `glow-cyan` | `rgba(6,182,212,0.4)` | Cyan glow effects |

---

## Gradients

### Primary Gradient (Nebula)

```
from-nebula-500 to-blue-500
```

Used for: CTAs, icon containers, logo background, pricing buttons.

CSS custom property: `var(--gradient-nebula)`
Utility class: `.gradient-nebula`
Shadow companion: `shadow-nebula-500/25` (default), `shadow-nebula-500/40` (hover)

### Heading Gradient

```
from-white via-nebula-400 to-blue-200
```

Used for: Section headings with `gradient` prop on `<Heading>` component.

### Price Gradient

```
from-white to-starlight-200
```

Used for: Large price text with `bg-clip-text text-transparent`.

---

## Typography

### Font Stack

- **Primary**: Inter (Google Fonts), `latin` subset
- **Fallback**: System sans-serif via `adjustFontFallback`
- **Code**: System monospace (terminal animation)

### Heading Scale

| Size | Mobile | SM | MD | LG+ |
|------|--------|-----|-----|------|
| h1 | 4xl | 5xl | 7xl | 8xl |
| h2 | 3xl | 4xl | 5xl | 6xl |
| h3 | 2xl | 3xl | 4xl | 5xl |
| h4 | xl | 2xl | 3xl | -- |

### Body Text

- Default: `text-starlight-200` via `<Text>` component
- Line height: browser default (1.5 for body)

---

## Spacing & Layout

### Container

`GlassContainer` provides consistent horizontal padding:
- Mobile: `px-4`
- SM: `px-6`
- LG+: `px-8`
- Max width: `max-w-screen-2xl` (default)

### Section Spacing

- Vertical padding: `py-16 md:py-24`
- Scroll margin: `scroll-mt-20` (for anchor links clearing fixed navbar)

### Grid Patterns

- **Hero**: `grid lg:grid-cols-2 gap-12`
- **Features**: `grid grid-cols-1 md:grid-cols-3 gap-6`
- **Pricing**: `grid grid-cols-1 md:grid-cols-3 gap-8`
- **Footer**: `grid grid-cols-1 md:grid-cols-4 gap-8`

---

## Mobile Responsiveness

### Touch Targets

All interactive elements MUST have minimum 44x44px tap area:
- `GlassButton sm`: `min-h-[44px]`
- `GlassButton md`: `min-h-[48px]`
- `GlassButton lg`: `min-h-[56px]`
- Mobile menu items: `min-h-[44px]`
- Language switcher: `min-h-[44px] min-w-[44px]`
- Hamburger button: `min-h-[44px] min-w-[44px]`
- Footer links: `min-h-[44px]`

### Breakpoints (Tailwind defaults)

| Name | Width | Usage |
|------|-------|-------|
| sm | 640px | Text scaling, CTA visibility |
| md | 768px | Grid stacking, navigation |
| lg | 1024px | Hero 2-column, advanced layout |
| xl | 1280px | Max-width containers |
| 2xl | 1536px | Widest container cap |

### Viewport

Explicit viewport export in layout:
```ts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#030014',
};
```

---

## Glassmorphism System

### Glass Utilities

| Class | Effect |
|-------|--------|
| `.glass-effect` | `bg white/5`, `blur(10px)`, `border white/10` |
| `.glass-card` | `bg white/5`, `blur-xl`, `border white/10`, `shadow-xl` |
| `.glass-card-hover` | Glass card + hover elevation |
| `.glass-panel` | Stronger glass with inset highlight |
| `.glass-navbar` | Navbar-specific glass |
| `.glass-input` | Form input glass with focus ring |
| `.glow-border` | Animated gradient border via pseudo-element |
| `.glow-nebula` | Purple ambient glow shadow |
| `.glow-cyan` | Cyan ambient glow shadow |

### GlassCard Variants

| Variant | Visual |
|---------|--------|
| `default` | Subtle glass, `white/10` border |
| `highlighted` | Stronger glass, purple glow border |
| `interactive` | Default + hover scale + pointer |

### GlassButton Variants

| Variant | Visual |
|---------|--------|
| `primary` | Nebula gradient, white text |
| `glass` | Glass effect, white text |
| `outline` | Transparent + white/20 border |

---

## Animation Principles

- **Scroll animations**: `whileInView` with `viewport={{ once: true }}`
- **Stagger**: 0.1s delay per item index
- **Duration**: 0.5-0.8s for reveals, 0.2-0.3s for interactions
- **Spring configs**: `stiffness: 300-400`, `damping: 20-30`
- **Magnetic effect**: GlassButton with `magnetic` prop
- **Glow hover**: Variant-specific box-shadow on `whileHover`
- **Respect `prefers-reduced-motion`**: Use Framer Motion's built-in support

---

## Rules

1. **No hardcoded hex in components** -- use Tailwind theme tokens
2. **No `gray-*`** -- use `starlight-*` equivalents
3. **No `purple-*`** -- use `nebula-*` equivalents
4. **No `cyan-*`** -- use `primary-cyan` token
5. **Inline `rgba()` OK** only for glass effects, motion animations, or CSS utilities
6. **Inline `style={}` for background** -- prefer `bg-deep-space-900/{opacity}` over `rgba(3,0,20,*)`
7. **Grid spans must be responsive** -- use `md:col-span-2` not `col-span-2`
8. **All buttons/links need 44px+ touch target** on mobile
9. **Dark-only theme** -- no light mode toggle, no `.dark` class needed
