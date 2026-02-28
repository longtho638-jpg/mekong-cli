---
name: creative-studio
description: Design systems, brand management, content creation, asset management, creative workflows. Use for brand guidelines, visual identity, content pipelines, creative operations.
license: MIT
version: 1.0.0
---

# Creative Studio Skill

Manage design systems, brand assets, content creation pipelines, and creative operations.

## When to Use

- Building and maintaining design systems
- Brand identity development and guidelines
- Content creation workflows (blog, social, video)
- Digital asset management (DAM)
- Creative briefs and project management
- Image/video generation with AI tools
- Typography, color systems, and visual identity
- Marketing collateral production
- Template systems for recurring content

## Tool Selection

| Need | Choose |
|------|--------|
| Design system | Figma, Storybook, Chromatic |
| Brand guidelines | Frontify, Brandfolder, Notion |
| DAM (digital assets) | Brandfolder, Bynder, Cloudinary |
| Image generation | Midjourney, DALL-E 3, Flux |
| Video creation | Remotion (code-driven), Descript, CapCut |
| Content calendar | Notion, Airtable, CoSchedule |
| Social media management | Buffer, Hootsuite, Later |
| Copywriting AI | Claude, GPT-4, Jasper |
| Design handoff | Figma Dev Mode, Zeplin |
| Icon libraries | Lucide, Heroicons, Phosphor |

## Design System Architecture

```
Design Tokens (JSON/CSS Variables)
  ├── Colors (primary, secondary, neutral, semantic)
  ├── Typography (font families, sizes, weights, line heights)
  ├── Spacing (4px grid: 4, 8, 12, 16, 24, 32, 48, 64)
  ├── Borders (radius, width, style)
  ├── Shadows (elevation levels)
  └── Motion (duration, easing curves)

Component Library
  ├── Primitives (Button, Input, Badge, Avatar)
  ├── Composites (Card, Modal, Dropdown, Table)
  ├── Patterns (Form, Navigation, Dashboard layout)
  └── Templates (Page layouts, email templates)
```

## Brand Guidelines Template

```markdown
# [Brand] Identity Guidelines

## Logo
- Primary logo + variations (horizontal, stacked, icon-only)
- Clear space rules (min padding = logo height × 0.5)
- Minimum size (digital: 24px height, print: 10mm)
- Incorrect usage examples

## Colors
- Primary: [hex] — CTA buttons, links, key actions
- Secondary: [hex] — Supporting elements, accents
- Neutral: [hex scale] — Text, backgrounds, borders
- Semantic: Success [hex], Warning [hex], Error [hex], Info [hex]

## Typography
- Headings: [Font] — Bold/Semibold
- Body: [Font] — Regular/Medium
- Code: [Monospace font]
- Scale: 12, 14, 16, 18, 20, 24, 30, 36, 48, 60px

## Voice & Tone
- [Professional but approachable / Technical but clear / etc.]
- Do: [Examples of good copy]
- Don't: [Examples of bad copy]
```

## Content Pipeline

```
Ideation → Brief → Create → Review → Approve → Publish → Analyze
   ↓          ↓        ↓        ↓         ↓         ↓         ↓
Backlog   Template   Draft    Feedback  Sign-off  Schedule  Metrics
Research  Assign     Design   Revision  Archive   Distribute Report
```

## Key Best Practices (2026)

**Design Tokens:** Single source of truth for design values — synced between Figma and code
**Component-Driven:** Build UI from isolated components — Storybook for development and documentation
**AI-Assisted Creation:** Use Midjourney/DALL-E for concepts, Claude for copy, Remotion for video
**Version Control for Design:** Figma branching, design reviews in PRs alongside code
**Accessibility Built-In:** WCAG 2.1 AA minimum — contrast ratios, focus states, screen reader support

## References

- `references/design-system-setup.md` - Figma tokens, Storybook, Tailwind theming
- `references/content-creation-pipeline.md` - AI-assisted workflows, asset management
