---
title: /design:describe
description: "Documentation"
section: docs
category: commands/design
order: 41
published: true
ai_executable: true
---

# /design:describe

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/commands/design/describe
```



Transform visual design references into actionable technical specifications. Analyze screenshots, videos, or design mockups to extract layout structure, styling details, component patterns, and implementation strategies.

## Syntax

```bash
/design:describe [screenshot or video file]
```

## How It Works

The `/design:describe` command uses AI vision to analyze visual content:

### 1. Visual Analysis

- Processes screenshot or video using multimodal AI
- Identifies UI components and layout structure
- Extracts color palette and typography
- Measures spacing, sizing, and proportions
- Detects interaction patterns (from videos)

### 2. Component Identification

- Recognizes common UI patterns
- Identifies component library usage (Material UI, Ant Design, etc.)
- Maps components to standard implementations
- Detects custom components

### 3. Style Extraction

- Extracts color values (hex, RGB)
- Identifies font families and sizes
- Measures spacing system (padding, margins)
- Detects border radius, shadows, gradients
- Analyzes layout systems (Grid, Flexbox)

### 4. Implementation Strategy

- Suggests appropriate tech stack
- Recommends component libraries
- Provides CSS/Tailwind implementation hints
- Identifies reusable patterns
- Estimates complexity and effort

### 5. Technical Specifications

- Generates detailed component breakdown
- Creates responsive design notes
- Documents state management requirements
- Lists required assets and resources

## Examples

### Landing Page Screenshot

```bash
/design:describe [saas-landing-hero.png]
```

**Visual Analysis Output:**
```
Design Analysis: SaaS Landing Hero Section
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout Structure:
├── Full-width hero section (min-height: 100vh)
├── Two-column grid layout (60/40 split at desktop)
│   ├── Left: Content (headline, description, CTA)
│   └── Right: Product screenshot with floating cards
└── Gradient background (purple-600 → indigo-900)

Typography:
├── Headline: "Inter" font, 72px, 900 weight, -0.02em tracking
├── Subheading: "Inter" font, 24px, 400 weight, 1.6 line-height
└── Button: "Inter" font, 18px, 600 weight, uppercase

Color Palette:
├── Primary: #7C3AED (purple-600)
├── Accent: #4338CA (indigo-700)
├── Text: #FFFFFF (white)
├── Text Secondary: #E9D5FF (purple-200)
└── Background: Linear gradient (135deg, #7C3AED → #312E81)

Components Identified:
├── Navigation Bar
│   ├── Logo (SVG, 40px height)
│   ├── Menu Items (5 items, horizontal)
│   └── CTA Button (outlined, white border)
├── Hero Content
│   ├── Badge ("New Feature" pill)
│   ├── H1 Headline (3 lines, left-aligned)
│   ├── Description Paragraph (2 lines)
│   └── CTA Group (2 buttons, horizontal)
└── Product Visual
    ├── Browser mockup (screenshot container)
    ├── Floating cards (3 cards, positioned absolute)
    └── Blur backdrop effects

Spacing System:
├── Container padding: 80px (desktop), 24px (mobile)
├── Section gap: 48px
├── Button padding: 16px 32px
├── Card gap: 24px
└── Consistent 8px spacing unit

Visual Effects:
├── Gradient background with noise texture
├── Floating cards with shadow: 0 25px 50px -12px rgba(0,0,0,0.25)
├── Button hover: scale(1.05) + shadow increase
├── Backdrop blur: blur(12px) on floating cards
└── Subtle animation: floating cards move vertically (2s ease-in-out infinite)

Responsive Behavior:
├── Desktop (>1024px): Two-column layout
├── Tablet (768-1023px): Stack layout, reduced font sizes
├── Mobile (<768px): Single column, full-width CTA
└── Navigation: Hamburger menu below 768px

Implementation Suggestions:
├── Framework: React or Next.js
├── Styling: Tailwind CSS with custom gradient
├── Components: Hero, Button, Card, Badge, Navigation
├── Libraries: Framer Motion for animations
├── Assets Needed: Logo SVG, product screenshot, noise texture
└── Estimated Time: 4-6 hours for pixel-perfect implementation

Accessibility Notes:
├── Ensure sufficient color contrast (currently good)
├── Add alt text for product screenshot
├── Keyboard navigation for menu
├── Focus indicators for interactive elements
└── Reduced motion media query for animations
```

### Mobile App Screenshot

```bash
/design:describe [mobile-app-profile.png]
```

**Analysis Output:**
```
Design Analysis: Mobile Profile Screen
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Device: iPhone 14 Pro (393 × 852 px)
Platform: iOS (status bar, rounded corners detected)

Layout Structure:
├── Status Bar (system, 54px height)
├── Navigation Header (60px)
│   ├── Back button (left)
│   ├── Title "Profile" (center)
│   └── Edit icon (right)
├── Profile Section (auto height)
│   ├── Avatar (120px circle, center)
│   ├── Name (24px, center)
│   ├── Bio (16px, center, gray)
│   └── Stats Row (3 columns)
├── Action Buttons Row (2 buttons, gap 12px)
└── Content Tabs (underline style)
    └── Grid Content (3 columns)

Design System:
├── Colors:
│   ├── Primary: #007AFF (iOS blue)
│   ├── Background: #F2F2F7 (iOS light gray)
│   ├── Surface: #FFFFFF (white cards)
│   ├── Text Primary: #000000
│   └── Text Secondary: #8E8E93
├── Typography:
│   ├── System Font: SF Pro (iOS native)
│   ├── Name: 24px, 600 weight
│   ├── Stats Number: 20px, 600 weight
│   └── Labels: 14px, 400 weight
└── Spacing:
    ├── Container padding: 16px
    ├── Element gap: 12px
    └── Grid gap: 2px

Components:
├── Avatar
│   ├── Size: 120px × 120px
│   ├── Border: 4px white + 2px shadow
│   └── Centered with gradient border effect
├── Stats Card
│   ├── Three columns (equal width)
│   ├── Number (large, bold) + Label (small, gray)
│   └── No borders, clean spacing
├── Buttons
│   ├── Primary: Filled (#007AFF, white text)
│   ├── Secondary: Outlined (border: #007AFF)
│   ├── Height: 44px (iOS touch target)
│   └── Border radius: 12px
└── Tab Bar
    ├── Underline indicator (2px, #007AFF)
    ├── Active state: blue text + underline
    └── Inactive: gray text

Interaction Patterns:
├── Pull to refresh (detected from context)
├── Tap avatar to view full size
├── Tab switching with slide animation
├── Grid items tap to open detail
└── Native iOS gestures (swipe back)

Technical Implementation:
├── Platform: React Native or Swift/SwiftUI
├── Navigation: Stack navigator with modal for edit
├── State Management: Profile data, tabs state
├── APIs: User profile, posts grid
├── Image Handling: Avatar upload, image caching
└── Performance: Lazy loading grid, image optimization

Similar Patterns Found:
├── Instagram profile screen
├── Twitter profile layout
├── Standard iOS Settings pattern
└── Apple HIG compliant design

Recommendations:
✓ Use native iOS components for authenticity
✓ Implement haptic feedback on interactions
✓ Add skeleton loaders for data fetching
✓ Support dark mode with adaptive colors
✓ Handle safe area insets properly
```

### Design Video Analysis

```bash
/design:describe [onboarding-flow.mp4]
```

**Video Analysis Output:**
```
Design Analysis: Onboarding Flow Animation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Video Duration: 15 seconds
Flow Steps: 4 screens
Transitions: Smooth slide animations (300ms ease-out)

Screen 1: Welcome (0:00 - 0:03)
├── Hero illustration (Lottie animation)
│   └── Character waves (loop, 2s duration)
├── Headline: "Welcome to AppName"
├── Subheading: Brief value proposition
└── "Get Started" button (pulsing subtle animation)

Screen 2: Feature Highlight (0:04 - 0:07)
├── Icon animation (scale in + rotate)
├── Feature title with typewriter effect
├── Bullet points fade in sequentially (100ms stagger)
├── Progress dots (2/4, animated)
└── "Next" button + "Skip" link

Screen 3: Permissions (0:08 - 0:11)
├── Permission icon (notifications bell)
├── Permission request explanation
├── "Allow" button (primary)
├── "Not Now" button (text link)
└── Progress dots (3/4)

Screen 4: Profile Setup (0:12 - 0:15)
├── Avatar upload circle (dashed border animation)
├── Name input field (focus state shown)
├── Email input field (validation icon)
├── "Complete Setup" button
└── Progress dots (4/4, all filled)

Animation Details:
├── Page Transitions:
│   ├── Slide from right (incoming)
│   ├── Slide to left (outgoing)
│   ├── Duration: 300ms
│   └── Easing: cubic-bezier(0.4, 0.0, 0.2, 1)
├── Element Animations:
│   ├── Fade + scale for illustrations (500ms)
│   ├── Staggered list items (100ms delay each)
│   ├── Button pulse (2s infinite, scale 1.0 → 1.05)
│   └── Progress dots fill (200ms)
└── Micro-interactions:
    ├── Button press: scale down to 0.95
    ├── Input focus: border color change + scale
    ├── Skip link: underline slide animation
    └── Success checkmark: draw animation (300ms)

Design System:
├── Colors:
│   ├── Primary: #6366F1 (indigo-500)
│   ├── Success: #10B981 (green-500)
│   ├── Background: #F9FAFB (gray-50)
│   └── Text: #111827 (gray-900)
├── Typography:
│   ├── Headlines: "Poppins" 28px 600
│   ├── Body: "Inter" 16px 400
│   └── Buttons: "Inter" 16px 600
└── Spacing:
    ├── Screen padding: 24px
    ├── Element gap: 24px
    └── Button height: 56px

Technical Implementation:
├── Framework: React Native + Reanimated
│   or Framer Motion for web
├── Animations:
│   ├── Lottie for illustrations
│   ├── Spring physics for transitions
│   ├── Gesture handling for swipe
│   └── Progress tracking state
├── Components:
│   ├── OnboardingSlide (reusable)
│   ├── AnimatedButton
│   ├── ProgressDots
│   ├── TypewriterText
│   └── IllustrationContainer
└── State Management:
    ├── Current step index
    ├── User input values
    ├── Completion status
    └── Skip/back navigation

Performance Notes:
├── All animations run at 60 FPS
├── No jank detected in transitions
├── Illustrations preloaded before display
├── Smooth gesture handling
└── No layout shifts

Accessibility Considerations:
✓ Respects reduced motion preferences
✓ Clear focus indicators on inputs
✓ Skip button always visible
✓ Adequate touch target sizes (56px min)
✓ Color contrast meets WCAG AA

Similar Patterns:
├── Duolingo onboarding
├── Headspace intro flow
├── Notion first-time setup
└── Linear app walkthrough

Implementation Estimate: 8-12 hours
Complexity: Medium (animations add complexity)
```

## When to Use /design:describe

### ✅ Use /design:describe for:

- **Design Analysis**: Understanding design decisions
- **Competitive Research**: Analyzing competitor interfaces
- **Design Handoff**: Extracting specs from mockups
- **Reverse Engineering**: Understanding existing designs
- **Learning**: Studying award-winning designs
- **Pre-Implementation**: Planning before coding
- **Design Reviews**: Documenting design patterns
- **Style Guide Creation**: Building design system from examples

### ❌ Don't use /design:describe for:

- **Creating New Designs**: Use `/design:good` or `/design:fast` instead
- **Direct Implementation**: Use `/design:screenshot` to implement
- **Bug Fixes**: Use `/fix:ui` for fixing issues
- **Code Review**: This is for visual analysis only

## Best Practices

### Provide High-Quality References

✅ **Good:**
```bash
# Clear, high-resolution screenshots
/design:describe [figma-export-2x.png]

# Full context videos
/design:describe [complete-user-flow.mp4]

# Multiple views
/design:describe [desktop-view.png] and /design:describe [mobile-view.png]
```

❌ **Bad:**
```bash
# Low resolution, blurry
/design:describe [blurry-screenshot.jpg]

# Cropped or partial view
/design:describe [just-a-button.png]
```

### Ask Specific Questions

```bash
# Focus the analysis
/design:describe [dashboard.png] - focus on the data visualization components

# Compare designs
/design:describe [design-v1.png] vs [design-v2.png] - identify differences

# Extract specific details
/design:describe [hero.png] - extract exact color values and spacing
```

### Use for Learning

```bash
# Study award-winning work
/design:describe [awwwards-winner.png] - analyze what makes this design exceptional

# Understand trends
/design:describe [modern-saas-page.png] - identify current design trends

# Learn patterns
/design:describe [stripe-dashboard.png] - document reusable patterns
```

## Output Formats

### Component Breakdown

```markdown
Identified Components:
├── Header
│   ├── Type: Sticky navigation
│   ├── Height: 80px
│   ├── Background: rgba(255,255,255,0.8) + backdrop-blur
│   └── Children: Logo, Nav, CTA Button
├── Hero Section
│   ├── Layout: Two-column grid (1fr 1fr)
│   ├── Min-height: 600px
│   └── Background: Linear gradient
└── Feature Cards
    ├── Grid: 3 columns (repeat(3, 1fr))
    ├── Gap: 32px
    └── Card: Padding 40px, Border-radius 16px
```

### Color Palette Export

```css
/* Extracted Color System */
:root {
  --primary-50: #EEF2FF;
  --primary-100: #E0E7FF;
  --primary-500: #6366F1;
  --primary-600: #4F46E5;
  --primary-900: #312E81;

  --neutral-50: #F9FAFB;
  --neutral-900: #111827;

  --success: #10B981;
  --error: #EF4444;
  --warning: #F59E0B;
}
```

### Typography System

```css
/* Extracted Typography */
--font-primary: 'Inter', sans-serif;
--font-display: 'Poppins', sans-serif;

--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-4xl: 2.25rem;    /* 36px */
```

### Spacing Scale

```css
/* Extracted Spacing System */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

## Advanced Analysis

### Design System Extraction

```bash
/design:describe [multiple-screens/*.png] - extract complete design system with colors, typography, components, and spacing
```

Generates comprehensive design system documentation with:
- Complete color palette
- Typography scale
- Component library
- Spacing system
- Grid system
- Breakpoints

### Competitive Analysis

```bash
/design:describe [competitor-landing/*.png] - compare design approaches across 5 competitors
```

Generates comparison report:
- Common patterns identified
- Unique differentiators
- Best practices observed
- Improvement opportunities

### Animation Specification

```bash
/design:describe [interaction-video.mp4] - document all animations with timing and easing functions
```

Generates animation specification:
- Transition durations
- Easing curves
- Trigger events
- Sequence timing
- Implementation code

## Integration Workflow

### Design → Implementation

```bash
# 1. Analyze design
/design:describe [design-mockup.png]

# 2. Review specifications
# (Read generated analysis)

# 3. Implement based on specs
/design:screenshot [design-mockup.png]

# 4. Compare result
/fix:ui [screenshot-comparison] - adjust any differences
```

### Learning Workflow

```bash
# 1. Find inspiring design
# (Browse Dribbble, Awwwards, etc.)

# 2. Analyze thoroughly
/design:describe [inspiring-design.png]

# 3. Document patterns
# (Save analysis to design system docs)

# 4. Apply learnings
/design:good [implement similar pattern for our product]
```

## Next Steps

- [/design:screenshot](/docs/commands/design/screenshot) - Implement the analyzed design
- [/design:good](/docs/commands/design/good) - Create similar high-quality design
- [/design:fast](/docs/commands/design/fast) - Quick prototype based on analysis
- [/docs:update](/docs/commands/docs/update) - Document extracted design system

---

**Key Takeaway**: `/design:describe` transforms visual references into actionable specifications, extracting every design detail from colors to animations. Use it to understand, learn from, and document great design before implementation.
