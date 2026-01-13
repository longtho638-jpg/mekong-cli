---
title: /design:good
description: "Documentation"
section: docs
category: commands/design
order: 43
published: true
ai_executable: true
---

# /design:good

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/commands/design/good
```



Create exceptional, production-ready designs that captivate users and win awards. Research-driven design process studying Dribbble, Behance, and Awwwards winners to deliver immersive, high-fidelity experiences with meticulous attention to detail.

## Syntax

```bash
/design:good [detailed design brief]
```

## How It Works

The `/design:good` command follows a comprehensive design process:

### 1. Research & Inspiration

- Studies award-winning designs on Dribbble, Behance, Awwwards
- Analyzes current design trends and best practices
- Reviews competitor designs in your industry
- Identifies successful patterns and unique opportunities
- Creates mood boards and visual direction

### 2. Strategic Planning

- Invokes **ui-ux-designer** agent for deep analysis
- Defines design system (colors, typography, spacing, components)
- Plans information architecture and user flows
- Identifies key micro-interactions and animations
- Establishes accessibility and performance goals

### 3. Design System Creation

- Develops comprehensive color palette with semantic tokens
- Designs typography system with type scale and hierarchy
- Creates spacing scale for consistent rhythm
- Defines component library with variants and states
- Establishes animation principles and timing

### 4. High-Fidelity Design

- Creates pixel-perfect layouts with attention to detail
- Implements custom illustrations or graphics
- Designs sophisticated micro-interactions
- Adds meaningful animations that enhance UX
- Ensures brand consistency throughout

### 5. Responsive & Accessible

- Designs for all breakpoints (mobile, tablet, desktop, ultra-wide)
- Implements WCAG 2.1 AA accessibility standards
- Tests color contrast ratios (4.5:1 minimum)
- Ensures keyboard navigation and screen reader support
- Adds focus indicators and skip links

### 6. Motion Design

- Creates purposeful animations (300-500ms for UI)
- Implements smooth transitions and easing curves
- Adds micro-interactions for delight
- Designs loading states and skeleton screens
- Respects prefers-reduced-motion

### 7. Production Ready

- Generates clean, maintainable code
- Includes comprehensive documentation
- Provides design system documentation
- Adds inline comments for complex logic
- Ensures performance optimization

## Examples

### Premium SaaS Landing Page

```bash
/design:good [SaaS landing page for AI writing assistant - modern, professional, showcasing product capabilities with interactive demo section, social proof, and elegant micro-interactions]
```

**Research Phase:**
```
Inspiration Research:
├── Analyzed: Linear, Notion, Stripe, Vercel landing pages
├── Trend: Gradient mesh backgrounds, glass morphism
├── Pattern: Hero with product preview, feature tabs, pricing comparison
└── Opportunity: Interactive writing demo with real-time AI suggestions

Mood Board Created:
├── Colors: Deep purples, bright blues, warm accents
├── Style: Modern, clean, sophisticated
├── Typography: Display fonts for headlines, readable sans-serif for body
└── Imagery: Abstract gradients, subtle 3D elements
```

**Design System:**
```
Color Palette:
├── Primary:
│   ├── 50: #F5F3FF → 900: #4C1D95 (9 shades)
│   └── Main: #7C3AED (violet-600)
├── Secondary:
│   ├── 50: #EFF6FF → 900: #1E3A8A (9 shades)
│   └── Main: #3B82F6 (blue-500)
├── Accent:
│   ├── Warm: #F59E0B (amber-500)
│   └── Cool: #06B6D4 (cyan-500)
└── Neutrals:
    ├── Gray scale: 50 → 900
    └── Semantic: success, error, warning, info

Typography System:
├── Display: "Cal Sans" (custom, headlines only)
├── Body: "Inter Variable" (400, 500, 600, 700)
├── Code: "JetBrains Mono" (code blocks)
└── Scale:
    ├── xs: 12px | sm: 14px | base: 16px
    ├── lg: 18px | xl: 20px | 2xl: 24px
    ├── 3xl: 30px | 4xl: 36px | 5xl: 48px
    └── 6xl: 60px | 7xl: 72px (display only)

Spacing Scale:
├── Base unit: 4px
├── Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px
└── Container: 1280px max-width, 32px padding

Animation Principles:
├── Duration: 200ms (micro) | 300ms (standard) | 500ms (complex)
├── Easing: cubic-bezier(0.4, 0.0, 0.2, 1) for UI
├── Purpose: Provide feedback, guide attention, create delight
└── Respect: prefers-reduced-motion
```

**Implementation:**
```
Generated Components:
✓ Hero Section
  ├── Gradient mesh background (animated)
  ├── Headline with gradient text effect
  ├── Animated CTA buttons (hover: scale + glow)
  ├── Product preview (browser mockup + live demo)
  └── Social proof ticker (auto-scrolling logos)

✓ Interactive Demo Section
  ├── Split view: input textarea | AI output
  ├── Real-time typing animation
  ├── Suggestion cards with hover effects
  ├── "Try it yourself" interactive mode
  └── Smooth transitions between demo states

✓ Feature Tabs
  ├── Tab navigation with animated indicator
  ├── Content fade-in with stagger effect
  ├── Feature illustrations (custom SVG)
  ├── Code examples with syntax highlighting
  └── Scroll-triggered animations

✓ Social Proof
  ├── Testimonial carousel (smooth auto-play)
  ├── Customer logos (grayscale → color on hover)
  ├── Statistics counter (animated on scroll into view)
  └── Video testimonials (modal overlay)

✓ Pricing Section
  ├── Comparison table with feature highlights
  ├── Toggle (monthly/annual) with slider animation
  ├── Recommended plan highlight
  ├── Tooltip icons for feature explanations
  └── CTA buttons with loading states

✓ Footer
  ├── Multi-column layout with links
  ├── Newsletter signup with validation
  ├── Social icons with hover animations
  └── Legal links and copyright

Micro-Interactions:
✓ Button hovers: scale(1.02) + shadow increase
✓ Card hovers: lift effect + border glow
✓ Input focus: border color transition + scale
✓ Scroll progress indicator (top bar)
✓ Smooth scroll with offset for fixed header
✓ Toast notifications (slide + fade)
✓ Loading spinners (pulsing brand logo)

Animations:
✓ Hero gradient: slow animation (20s loop)
✓ Text reveal: fade up with stagger (100ms)
✓ Demo typing: realistic typing speed (60ms/char)
✓ Feature tabs: slide + fade (300ms)
✓ Scroll reveals: intersection observer (fade up)
✓ Pricing toggle: smooth width transition
✓ Logo ticker: seamless infinite scroll

Performance:
✓ Lazy loading for images and videos
✓ Preload critical assets
✓ Optimize gradient rendering (GPU)
✓ Debounce scroll animations
✓ Use will-change for animations
✓ Code splitting by section
✓ Total bundle: <150KB gzipped

Accessibility:
✓ Semantic HTML throughout
✓ ARIA labels for interactive elements
✓ Keyboard navigation (Tab, Enter, Esc)
✓ Focus visible indicators (2px blue outline)
✓ Color contrast: all text 4.5:1 minimum
✓ Skip to main content link
✓ Screen reader announcements
✓ Captions for video content
✓ Reduced motion support

Generated Files:
✓ src/pages/Landing.tsx (main page)
✓ src/components/Hero.tsx
✓ src/components/InteractiveDemo.tsx
✓ src/components/FeatureTabs.tsx
✓ src/components/SocialProof.tsx
✓ src/components/PricingTable.tsx
✓ src/components/Footer.tsx
✓ src/animations/gradientMesh.ts
✓ src/animations/scrollReveal.ts
✓ src/styles/design-system.css
✓ src/utils/intersectionObserver.ts
✓ docs/design-system.md

Time: 6-8 hours
Quality: Production-ready, award-worthy
```

### E-commerce Product Page

```bash
/design:good [luxury watch product page with 3D viewer, detailed specifications, size comparison tool, and immersive shopping experience]
```

**Implementation Highlights:**
```
Premium Features:
✓ 3D Product Viewer (Three.js)
  ├── 360° rotation with momentum
  ├── Zoom to see details (2x, 4x)
  ├── Material switcher (metal, leather)
  ├── Lighting presets (studio, outdoor, dramatic)
  └── AR preview button

✓ Image Gallery
  ├── Main large image (zoom on hover)
  ├── Thumbnail carousel (smooth scroll)
  ├── Full-screen lightbox (swipe gestures)
  ├── Video integration
  └── Lazy loading with blur placeholders

✓ Product Details
  ├── Accordion specifications (smooth expand)
  ├── Size comparison tool (interactive overlay)
  ├── Material information with tooltips
  ├── Care instructions
  └── Warranty details

✓ Purchase Section
  ├── Size selector with stock availability
  ├── Quantity selector (+ / - with validation)
  ├── Add to cart (with animation feedback)
  ├── Add to wishlist (heart animation)
  ├── Price display (sale price highlight)
  └── Shipping calculator

✓ Social Features
  ├── Share buttons (copy link, social)
  ├── Review section (5-star with filters)
  ├── Q&A section
  └── Recently viewed products

Design Excellence:
✓ Luxury aesthetic (generous whitespace, serif accents)
✓ Premium photography (high resolution, consistent lighting)
✓ Smooth animations (buttery 60 FPS)
✓ Attention to detail (every state designed)
✓ Mobile-optimized (thumb-friendly zones)

Time: 10-14 hours
```

### Creative Portfolio

```bash
/design:good [creative portfolio for photographer with full-screen image galleries, custom cursor, smooth page transitions, and unique navigation]
```

**Creative Implementation:**
```
Unique Features:
✓ Custom Cursor
  ├── Default: small dot + large ring
  ├── Hover links: expands with "View" text
  ├── Hover images: becomes magnifier icon
  ├── Smooth follow (slight delay for effect)
  └── Hide on touch devices

✓ Page Transitions
  ├── Smooth fade + scale effect (500ms)
  ├── Loading animation (brand logo)
  ├── Route-based transitions
  └── Preload next page content

✓ Hero Section
  ├── Full-screen background video
  ├── Parallax text overlay
  ├── Scroll indicator (animated)
  └── Signature/logo placement

✓ Project Gallery
  ├── Masonry grid layout (responsive)
  ├── Hover: project title + category reveal
  ├── Click: expand to full-screen detail
  ├── Smooth transitions between views
  └── Keyboard navigation (arrow keys)

✓ Project Detail Page
  ├── Full-screen image viewer
  ├── Swipe/arrow navigation
  ├── Project information sidebar (slide in/out)
  ├── Next project preview (bottom)
  └── Back button with transition

✓ About Page
  ├── Split layout: large portrait | bio
  ├── Animated stats counter
  ├── Services list with icons
  ├── Client logos
  └── Contact CTA

✓ Contact Page
  ├── Full-screen split design
  ├── Animated contact form
  ├── Alternative contact methods
  ├── Social links
  └── Availability calendar widget

Artistic Details:
✓ Typography: Mix of serif + sans-serif
✓ Whitespace: Generous, breathing room
✓ Animations: Subtle, refined, never distracting
✓ Photography: Hero treatment, full bleed
✓ Color: Monochrome with accent color

Performance:
✓ Image optimization (WebP, lazy load)
✓ Progressive image loading (blur up)
✓ Route preloading
✓ Efficient animations (GPU accelerated)
✓ Fast page transitions

Time: 12-16 hours
```

## When to Use /design:good

### ✅ Use /design:good for:

- **Customer-Facing Products**: Landing pages, marketing sites
- **Brand-Critical Pages**: Homepage, product pages, about pages
- **Portfolio/Showcase**: Personal brand, creative work
- **Premium Products**: Luxury brands, high-end services
- **Competitive Markets**: Stand out with exceptional design
- **Award Submissions**: Awwwards, CSS Design Awards, FWA
- **Long-Term Projects**: Worth the investment in quality
- **Learning Excellence**: Study and apply best practices

### ❌ Don't use /design:good for:

- **Quick Prototypes**: Use `/design:fast` instead
- **Internal Tools**: Quality vs. speed tradeoff
- **Time Constraints**: Requires 6-16 hours minimum
- **Low-Traffic Pages**: ROI consideration
- **Temporary Pages**: Not worth the effort

## Design Excellence Standards

### Visual Hierarchy

```
Clear hierarchy in every design:
├── Primary action: most prominent
├── Secondary actions: visible but secondary
├── Tertiary: minimal, supportive
└── Content: F-pattern or Z-pattern reading flow
```

### Micro-Interactions

Every interaction designed:
- Button hover: scale + shadow
- Input focus: border + scale
- Form submit: loading state + success animation
- Error: shake animation + icon
- Success: checkmark animation + confetti (subtle)

### Loading States

Never leave users waiting without feedback:
- Skeleton screens (not spinners)
- Progressive image loading
- Optimistic UI updates
- Loading percentage indicators
- Smooth content reveals

### Empty States

Beautiful empty states:
- Illustration or icon
- Helpful message
- Primary action (CTA)
- Examples or suggestions

### Error States

Friendly error handling:
- Clear error messages
- Suggestions to fix
- Visual indicators
- Retry actions
- Support contact info

## Research Sources

### Inspiration Platforms

**Dribbble** (dribbble.com)
- Latest design trends
- UI/UX patterns
- Micro-interactions
- Color schemes

**Behance** (behance.net)
- Full project case studies
- Design process insights
- Brand guidelines
- Complete design systems

**Awwwards** (awwwards.com)
- Award-winning websites
- Cutting-edge interactions
- Technical excellence
- Innovation in web design

**Mobbin** (mobbin.com)
- Mobile app patterns
- User flows
- Screen designs
- iOS/Android patterns

**Land-book** (land-book.com)
- Landing page inspiration
- Contemporary web design
- Clean, modern aesthetics

### Design Systems to Study

**Industry Leaders:**
- Material Design (Google)
- Human Interface Guidelines (Apple)
- Fluent Design (Microsoft)
- Polaris (Shopify)
- Carbon (IBM)
- Ant Design (Alibaba)

**Startups with Great Design:**
- Linear (linear.app)
- Stripe (stripe.com)
- Vercel (vercel.com)
- Notion (notion.so)
- Figma (figma.com)

## Quality Checklist

Before delivery, verify:

### Visual Design
- [ ] Pixel-perfect alignment
- [ ] Consistent spacing (design system)
- [ ] Color harmony and contrast
- [ ] Typography hierarchy clear
- [ ] High-quality assets
- [ ] Brand consistency

### Interaction Design
- [ ] All states designed (hover, active, disabled, loading, error)
- [ ] Smooth transitions (60 FPS)
- [ ] Purposeful animations
- [ ] Clear feedback on actions
- [ ] Intuitive navigation
- [ ] Micro-interactions polished

### Responsive Design
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px - 1919px)
- [ ] Ultra-wide (1920px+)
- [ ] Touch-friendly targets
- [ ] Readable text sizes

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Color contrast 4.5:1 minimum
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] Focus indicators visible
- [ ] Semantic HTML
- [ ] ARIA labels where needed
- [ ] Skip links present

### Performance
- [ ] Optimized images
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Fast load time (<3s)
- [ ] Smooth animations
- [ ] Efficient rendering

### Code Quality
- [ ] Clean, readable code
- [ ] Type safety (TypeScript)
- [ ] Commented where needed
- [ ] Reusable components
- [ ] Design system documented
- [ ] No console errors

## Best Practices

### Provide Detailed Briefs

✅ **Excellent:**
```bash
/design:good [E-learning platform homepage targeting college students. Modern, friendly aesthetic with purple/blue gradient brand colors. Include: hero with video demo, course categories grid with hover effects, student testimonials carousel, pricing comparison table, and FAQ accordion. Emphasize trust and accessibility. Inspired by: Coursera, Udemy, but more youthful and dynamic.]
```

✅ **Good:**
```bash
/design:good [Portfolio site for UI designer showcasing 6 projects. Minimal, elegant design with black/white/accent color. Smooth page transitions, custom cursor, full-screen project images.]
```

❌ **Too vague:**
```bash
/design:good [make a nice website]
```

### Include References

```bash
/design:good [Dashboard similar to Linear.app but for project management. Include: task kanban board, timeline view, team activity feed. Use their modern aesthetic with shadows and subtle animations.]
```

### Specify Brand Guidelines

```bash
/design:good [Corporate website following brand guidelines:
- Colors: Navy #1E3A8A (primary), Orange #F97316 (accent)
- Font: "Proxima Nova" for all text
- Style: Professional, trustworthy, innovative
- Sections: Hero, services, case studies, team, contact]
```

## After Delivery

### Documentation Provided

```
docs/
├── design-system.md        # Complete design system documentation
├── components.md           # Component library reference
├── animations.md           # Animation specifications
└── accessibility.md        # Accessibility compliance notes
```

### Design Tokens

```css
/* Generated design system CSS */
:root {
  /* Colors */
  --color-primary-50: #F5F3FF;
  --color-primary-500: #7C3AED;
  --color-primary-900: #4C1D95;

  /* Typography */
  --font-display: "Cal Sans", sans-serif;
  --font-body: "Inter Variable", sans-serif;
  --text-xs: 0.75rem;
  --text-base: 1rem;
  --text-4xl: 2.25rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-4: 1rem;
  --space-8: 2rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Animation */
  --duration-fast: 200ms;
  --duration-base: 300ms;
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

## Troubleshooting

### Takes Too Long

**Problem:** Design process taking longer than expected

**Solution:**
- Consider `/design:fast` for non-critical pages
- Focus quality on high-impact pages only
- Iterate: start fast, upgrade to good later

### Need Revisions

**Problem:** Design doesn't match vision

**Solution:**
```bash
# Be specific about changes
/design:good [revise hero section - make headline more prominent, reduce CTA button size, use purple gradient instead of blue]

# Provide reference
/design:good [update pricing section to match this style: [reference-image.png]]
```

### Performance Issues

**Problem:** Animations causing lag

**Solution:**
```bash
/fix:ui [optimize animations - reduce complexity while maintaining smooth feel]
```

## Next Steps

- [/design:fast](/docs/commands/design/fast) - Quick prototypes first
- [/design:describe](/docs/commands/design/describe) - Analyze award winners
- [/design:3d](/docs/commands/design/3d) - Add 3D elements
- [/fix:ui](/docs/commands/fix/ui) - Polish final details

---

**Key Takeaway**: `/design:good` creates exceptional, award-worthy designs by researching best-in-class examples and applying meticulous attention to every detail. Worth the time investment for customer-facing, brand-critical pages. Excellence matters.
