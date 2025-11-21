# Extract Design Guidelines from Existing Assets

Reverse-engineer design principles from existing images or videos to establish design guidelines.

## Purpose

- Analyze competitor designs to understand their approach
- Extract design systems from inspiration screenshots
- Learn from high-quality design examples
- Create documented guidelines based on visual analysis
- Establish consistent aesthetic direction from references

## Use Cases

- Analyzing competitor websites or apps
- Learning from inspiration galleries (Dribbble, Awwwards, Mobbin)
- Extracting design systems from brand materials
- Reverse-engineering successful interfaces
- Creating design documentation from visual references

## Extraction Workflow

### Step 1: Capture Reference Assets

Use `chrome-devtools` skill or collect existing images/videos:

```bash
# If analyzing a website, use chrome-devtools skill to capture
# Full-screen screenshots (NOT full-page) for accurate representation

# Example: Capture screenshot with chrome-devtools
# (Use chrome-devtools skill commands for actual capture)
```

**Capture Guidelines**:
- Use actual viewport size, not full-page scrolls
- Capture at device-specific resolutions (desktop 1920x1080, mobile 390x844)
- Ensure accurate color reproduction (disable browser color management if needed)
- Capture multiple states: default, hover, active, responsive breakpoints

### Step 2: Comprehensive Design Analysis

Extract all design elements systematically:

```bash
python scripts/gemini_batch_process.py \
  --files docs/inspiration/reference-design.png \
  --task analyze \
  --prompt "Extract comprehensive design guidelines from this interface:

## Aesthetic Identification
- Design Style: Identify the aesthetic movement (minimalism, brutalism, maximalism, glassmorphism, neo-brutalism, organic, luxury, editorial, etc.)
- Overall Mood: Professional, playful, serious, energetic, calm, bold, refined
- Differentiation Factor: What makes this design memorable and distinctive?

## Typography System
- Display Font: Predict font family (favor Google Fonts: Playfair Display, Bebas Neue, DM Serif, Archivo Black, etc.). Provide 2-3 alternatives if uncertain.
- Body Font: Identify or suggest similar alternatives
- Font Sizes: Estimate in px for h1, h2, h3, body, small text
- Font Weights: Used weights (300, 400, 500, 600, 700)
- Line Heights: Estimate leading ratios
- Letter Spacing: Tight, normal, or wide tracking

## Color System (CRITICAL)
- Extract 8-12 distinct colors with accurate hex codes
- Classify: Primary (1-2), Secondary (1-2), Accent (2-3), Neutral/Gray (3-5), Background (1-2)
- Note color relationships and usage patterns
- Identify gradients (provide start/end hex codes and direction)

## Spatial Composition
- Layout Type: Grid-based, asymmetric, centered, multi-column, magazine-style
- Grid System: Estimate column count and gutter widths
- Spacing Scale: Identify spacing rhythm (4px, 8px, 16px, 24px, etc.)
- White Space Strategy: Generous, tight, varied
- Section Hierarchy: How content is organized and prioritized

## Visual Elements
- Border Styles: Radius values (sharp, subtle rounded, fully rounded)
- Shadows: Box-shadow characteristics (elevation, spread, blur)
- Backgrounds: Solid, gradients, patterns, textures, images
- Effects: Blur, overlays, transparency, grain, noise
- Decorative Elements: Lines, shapes, illustrations, icons

## Component Patterns
- Button Styles: Shape, size, states, hover effects
- Card Design: Borders, shadows, padding, content structure
- Navigation: Style, position, behavior
- Forms: Input styles, validation, spacing
- Interactive Elements: Hover states, transitions

## Motion & Animation (if video)
- Transition Timing: Fast (100-200ms), medium (200-400ms), slow (400-600ms+)
- Easing Functions: Linear, ease-out, ease-in, cubic-bezier specifics
- Animation Types: Fade, slide, scale, rotate, stagger
- Scroll Interactions: Parallax, reveal-on-scroll, sticky elements

## Accessibility Considerations
- Color Contrast: Evaluate text/background combinations
- Font Sizes: Minimum sizes used
- Interactive Targets: Button/link sizes
- Visual Hierarchy: Clear content prioritization

## Design Highlights
- Top 3 standout design decisions
- What makes this design effective
- Potential improvements or considerations

Output as structured markdown for easy reference." \
  --output docs/design-guidelines/extracted-design-system.md \
  --model gemini-2.5-flash
```

### Step 3: Multi-Screen Analysis (for complete systems)

Analyze multiple screens to extract consistent patterns:

```bash
python scripts/gemini_batch_process.py \
  --files docs/inspiration/home.png docs/inspiration/about.png docs/inspiration/product.png \
  --task analyze \
  --prompt "Analyze these multiple screens to extract the consistent design system:

For each screen:
1. Identify consistent design tokens (colors, typography, spacing)
2. Note variations and their rationale
3. Extract reusable component patterns

Then synthesize:
- Core design system: Consistent colors, fonts, spacing scales
- Component library: Buttons, cards, navigation, forms
- Layout patterns: Grid systems, responsive behavior
- Visual language: Shared aesthetic principles
- Design tokens: Create CSS variable recommendations

Provide as a unified design system specification." \
  --output docs/design-guidelines/complete-design-system.md \
  --model gemini-2.5-flash
```

### Step 4: Video Analysis for Motion Guidelines

Extract animation and interaction patterns from videos:

```bash
python scripts/gemini_batch_process.py \
  --files docs/inspiration/interaction-demo.mp4 \
  --task analyze \
  --prompt "Analyze this video to extract motion design guidelines:

1. Transition Timing: Measure duration of key animations (in ms)
2. Easing Curves: Describe acceleration/deceleration (ease-in, ease-out, spring)
3. Animation Types: List all animation styles used
4. Micro-interactions: Button hovers, form focus states, feedback
5. Page Transitions: How screens change
6. Scroll Interactions: Parallax, sticky headers, reveal animations
7. Loading States: Skeleton screens, spinners, progressive reveals
8. Stagger Effects: Sequential animation delays and patterns

Provide implementable specifications with timing values." \
  --output docs/design-guidelines/motion-system.md \
  --model gemini-2.5-flash
```

### Step 5: Competitive Analysis

Compare multiple competitor designs:

```bash
python scripts/gemini_batch_process.py \
  --files competitor-a.png competitor-b.png competitor-c.png \
  --task analyze \
  --prompt "Comparative design analysis of 3 competitors:

For each competitor:
1. Design style and aesthetic approach
2. Color strategy and brand perception
3. Typography choices and hierarchy
4. Layout and information architecture
5. Unique design elements
6. Strengths and weaknesses

Synthesis:
- Common industry patterns (what everyone does)
- Differentiation opportunities (gaps to exploit)
- Best practices observed (proven approaches)
- Design recommendations (how to stand out)

Provide strategic design direction based on analysis." \
  --output docs/design-guidelines/competitive-analysis.md \
  --model gemini-2.5-flash
```

## Extraction Best Practices

### 1. Capture Quality Screenshots
- Use high-resolution (at least 1920px wide for desktop)
- Accurate color reproduction (disable browser extensions that alter colors)
- Multiple screens from same site to identify patterns

### 2. Analyze Multiple Examples
- Single screenshots miss patterns
- Analyze 3-5 screens minimum for pattern recognition
- Include different page types (home, product, about, contact)

### 3. Request Specifics
❌ Accept: "Uses blue and gray colors"
✓ Demand: "Primary: #1E40AF, Secondary: #6B7280, Accent: #F59E0B"

❌ Accept: "Modern sans-serif font"
✓ Demand: "Inter, weight 600, 48px for h1, tracking -0.02em"

### 4. Document Rationale
Understand *why* design decisions work, not just *what* they are:
- Why does this color palette create trust?
- Why does this spacing scale improve readability?
- Why does this typography hierarchy guide user attention?

### 5. Create Actionable Guidelines
Output should be directly implementable in code:

```css
/* Immediately usable CSS from extraction */
:root {
  --font-display: 'Bebas Neue', sans-serif;
  --font-body: 'Inter', sans-serif;

  --color-primary-600: #1E40AF;
  --color-accent-500: #F59E0B;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  --radius-sm: 4px;
  --radius-md: 8px;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}
```

### 6. Cross-Reference
- Validate font predictions against Google Fonts library
- Use font identification tools (WhatFont, Font Ninja) for accuracy
- Manually verify extracted colors with eyedropper tools

### 7. Iterate Analysis
First pass may miss subtleties:
- Run initial comprehensive analysis
- Review output, identify gaps
- Run focused follow-up queries for specific elements

## Output Documentation Templates

### Template 1: Complete Design System Document

```markdown
# [Project/Competitor] Design System

## Aesthetic Direction
- **Style**: Neo-brutalism with organic elements
- **Mood**: Bold, confident, approachable
- **Differentiation**: High contrast typography with soft color accents

## Typography
### Display Font
- Family: Archivo Black (Google Fonts)
- Sizes: h1: 72px, h2: 48px, h3: 36px
- Weights: 400 (regular)
- Line Height: 1.1
- Letter Spacing: -0.02em

### Body Font
- Family: Inter (Google Fonts)
- Sizes: body: 16px, small: 14px
- Weights: 400, 500, 600
- Line Height: 1.6
- Letter Spacing: 0

## Color Palette
```css
:root {
  /* Primary Colors */
  --color-primary-900: #0A1628;
  --color-primary-600: #1E40AF;
  --color-primary-400: #60A5FA;

  /* Accent Colors */
  --color-accent-500: #F59E0B;
  --color-accent-300: #FCD34D;

  /* Neutral Colors */
  --color-neutral-900: #111827;
  --color-neutral-700: #374151;
  --color-neutral-500: #6B7280;
  --color-neutral-300: #D1D5DB;
  --color-neutral-100: #F3F4F6;

  /* Background */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F9FAFB;
}
```

## Spacing System
- Base: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px
- Usage: Consistent 8px rhythm for most components

## Component Specifications

### Button (Primary)
```css
.button-primary {
  background: var(--color-primary-600);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: background 200ms ease-out;
}
.button-primary:hover {
  background: var(--color-primary-900);
}
```

### Card
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: box-shadow 200ms ease-out;
}
.card:hover {
  box-shadow: 0 10px 15px rgba(0,0,0,0.1);
}
```

## Motion Guidelines
- Transition timing: 200ms for micro-interactions, 400ms for page transitions
- Easing: ease-out for entrances, ease-in for exits
- Stagger delay: 50ms between sequential elements
```

### Template 2: Competitive Analysis Report

```markdown
# Competitive Design Analysis

## Competitors Analyzed
1. Competitor A - [URL]
2. Competitor B - [URL]
3. Competitor C - [URL]

## Comparative Summary

| Aspect | Competitor A | Competitor B | Competitor C |
|--------|--------------|--------------|--------------|
| Aesthetic | Minimalist | Maximalist | Editorial |
| Primary Color | #1E40AF | #7C3AED | #DC2626 |
| Typography | Inter | Poppins | Playfair Display |
| Layout | Grid-based | Asymmetric | Magazine |

## Common Patterns (Industry Standard)
- All use sans-serif for body text
- All prioritize mobile-first responsive design
- All use card-based layouts for content
- All feature hero sections with large imagery

## Differentiation Opportunities
1. **Color Strategy**: Competitors use saturated colors; opportunity for muted, sophisticated palette
2. **Typography**: No one uses display serifs; opportunity for elegant, high-end feel
3. **Layout**: All symmetric; opportunity for asymmetric, dynamic composition

## Recommendations
Based on analysis, recommend:
- Aesthetic: Refined minimalism with editorial typography
- Color: Muted earth tones with one bold accent
- Layout: Asymmetric grid with generous white space
- Differentiation: Unexpected typography hierarchy, subtle animations
```

## Integration with Design Workflow

### After Extraction

1. **Review & Validate**
   - Manually verify color codes with eyedropper tool
   - Cross-reference font predictions against Google Fonts
   - Check spacing values against browser dev tools

2. **Adapt & Customize**
   - Don't copy—adapt principles to your unique context
   - Maintain the underlying logic, change the expression
   - Example: Extract "generous white space" principle, apply with your colors

3. **Document Decisions**
   - Save extracted guidelines in project `docs/design-guidelines/`
   - Create design system spec from extraction
   - Reference when generating new assets

4. **Reference in Implementation**
   - Use extracted tokens when generating new assets with `asset-generation.md`
   - Apply extracted principles when analyzing your own designs with `visual-analysis.md`
   - Maintain consistency between inspiration and implementation

5. **Iterate & Refine**
   - Update guidelines as design evolves
   - Extract from multiple sources, synthesize learnings
   - Create your own unique voice from combined insights

## Advanced Extraction Techniques

### Technique 1: Design System Mining

Extract complete design system from a single brand:

```bash
# Collect 10+ screens from same brand
# docs/inspiration/brand/home.png
# docs/inspiration/brand/product.png
# docs/inspiration/brand/about.png
# ... etc

# Run comprehensive extraction
python scripts/gemini_batch_process.py \
  --files docs/inspiration/brand/*.png \
  --task analyze \
  --prompt "Extract the complete, production-ready design system:
- All color tokens (20+ colors)
- All typography specs (sizes, weights, line-heights)
- All spacing tokens
- All component variants
- All animation timings
Output as CSS variables ready for implementation." \
  --output docs/design-guidelines/brand-design-system.md \
  --model gemini-2.5-flash
```

### Technique 2: Trend Analysis

Analyze multiple top designs to identify current trends:

```bash
python scripts/gemini_batch_process.py \
  --files docs/inspiration/awwwards-*.png \
  --task analyze \
  --prompt "Trend analysis across 10 award-winning designs:
1. Dominant aesthetic movements
2. Common color strategies
3. Typography trends
4. Layout innovations
5. Animation patterns
Identify what's trending in 2024 web design." \
  --output docs/design-guidelines/trend-analysis.md \
  --model gemini-2.5-flash
```

### Technique 3: Historical Evolution

Track design evolution of a single brand over time:

```bash
python scripts/gemini_batch_process.py \
  --files docs/inspiration/brand-2020.png docs/inspiration/brand-2024.png \
  --task analyze \
  --prompt "Compare 2020 vs 2024 design evolution:
1. What changed and why
2. What remained consistent (brand identity)
3. How trends influenced changes
4. Lessons for our design evolution" \
  --output docs/design-guidelines/evolution-analysis.md \
  --model gemini-2.5-flash
```

## Common Extraction Pitfalls

### ❌ Surface-Level Analysis
"Uses blue colors and sans-serif fonts"
**Fix**: Demand specifics—hex codes, font names, size values

### ❌ Missing Context
Extracting design without understanding target audience or purpose
**Fix**: Research brand context before analysis

### ❌ Blind Copying
Extracting and applying design 1:1 to your project
**Fix**: Extract principles, adapt to your unique context

### ❌ Single Source
Learning from one example only
**Fix**: Analyze 3-5 examples to identify patterns vs. anomalies

## Next Steps

- **Generate assets**: Use extracted guidelines with `asset-generation.md`
- **Verify quality**: Analyze your generated assets with `visual-analysis.md`
- **Optimize and integrate**: See `technical-guide.md` for implementation
