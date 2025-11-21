# AI Multimodal Integration for Frontend Design

Practical instructions for using the `ai-multimodal` skill to generate visual assets that align with frontend design thinking and aesthetic guidelines.

## When to Use AI Multimodal in Frontend Design

Use when you need to:
- Generate hero images, background assets, decorative elements
- Create placeholder images with specific aesthetic qualities
- Produce marketing visuals that match the UI design language
- Generate icon sets, illustrations, or graphic elements
- Create texture overlays, gradient meshes, or background patterns
- Prototype visual concepts before implementing in code
- **Analyze generated assets** to verify they meet design standards
- **Extract design guidelines** from existing images or videos (competitor analysis, inspiration)

## Core Principles

### 1. Design-Driven Generation
**NEVER** generate generic AI imagery. Every asset must align with:
- The chosen aesthetic direction (brutalism, maximalism, retro-futurism, etc.)
- Typography system and visual hierarchy
- Color palette and theme consistency
- Overall design story and purpose

### 2. Contextual Asset Creation
Assets aren't standalone—they're part of a cohesive interface. Consider:
- **Purpose**: Hero image vs. background texture vs. decorative element
- **Integration**: How it interacts with overlaid text, buttons, forms
- **Technical constraints**: File size, aspect ratio, responsive behavior
- **Accessibility**: Color contrast, text readability, decorative vs. informative

## Workflow: Generate Design-Aligned Assets

### Step 1: Define Design Context
Before generating, extract from the design brief:
- **Aesthetic direction**: Minimalist? Maximalist? Brutalist? Organic?
- **Color palette**: Primary colors, accent colors, mood
- **Typography character**: Modern sans-serif? Elegant serif? Bold display?
- **Visual tone**: Professional? Playful? Luxury? Raw?
- **User context**: Who sees this? What problem does it solve?

### Step 2: Craft Contextual Prompts
Translate design thinking into generation prompts:

**Generic (❌ Avoid)**:
```
"Modern website hero image"
```

**Design-Driven (✓ Use)**:
```
"Brutalist architectural photograph, stark concrete textures,
dramatic shadows, high contrast black and white, raw unpolished
surfaces, geometric shapes, monumental scale, inspired by
1960s Bauhaus, 16:9 aspect ratio"
```

**Prompt Components**:
1. **Style/Movement**: "Neo-brutalism", "Art Deco", "Organic modernism"
2. **Visual Elements**: Textures, shapes, composition style
3. **Color Direction**: "Muted earth tones", "Vibrant neon accents", "Monochromatic"
4. **Mood/Atmosphere**: "Serene", "Energetic", "Mysterious"
5. **Technical Specs**: Aspect ratio, composition focus
6. **References**: "Inspired by [artist/movement]"

### Step 3: Generate with Appropriate Model
Use `ai-multimodal` skill's image generation capabilities:

```bash
# Standard quality (most cases)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[your design-driven prompt]" \
  --output docs/assets/hero-image \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 16:9

# Ultra quality (production hero images, marketing)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[your design-driven prompt]" \
  --output docs/assets/hero-ultra \
  --model imagen-4.0-ultra-generate-001 \
  --size 2K

# Fast iteration (exploring concepts)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[your design-driven prompt]" \
  --output docs/assets/concept \
  --model imagen-4.0-fast-generate-001
```

**Model Selection**:
- **imagen-4.0-generate-001**: Default choice, balanced quality/speed
- **imagen-4.0-ultra-generate-001**: Final production assets, marketing materials
- **imagen-4.0-fast-generate-001**: Rapid prototyping, multiple variations

**Aspect Ratios**:
- **16:9**: Hero sections, wide banners
- **9:16**: Mobile-first, vertical content
- **1:1**: Square cards, social media
- **4:3**: Classic layouts, presentations
- **3:4**: Portrait orientations, mobile screens

### Step 4: Evaluate Against Design Standards
Use `ai-multimodal` to analyze the generated asset:

```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/hero-image.png \
  --task analyze \
  --prompt "Evaluate this image for:
1. Visual coherence with [aesthetic direction]
2. Color harmony and contrast
3. Composition and balance
4. Suitability for overlaying text
5. Professional quality (rate 1-10)
6. Specific weaknesses or improvements needed" \
  --output docs/assets/hero-evaluation.md \
  --model gemini-2.5-flash
```

### Step 5: Iterate or Integrate
**If evaluation score < 7/10 or doesn't meet standards**:
1. Identify specific issues (color, composition, mood, technical)
2. Refine prompt with improvements
3. Regenerate with adjusted parameters
4. Consider using `media-processing` skill for post-generation adjustments

**If meets standards**:
1. Optimize for web (compress, format conversion)
2. Create responsive variants if needed
3. Document asset usage guidelines
4. Integrate into frontend implementation

## Design Pattern Examples

### Pattern 1: Minimalist Background Texture
**Design Context**: Clean, refined interface with generous white space
**Prompt Strategy**:
```
"Subtle paper texture, off-white color (#F8F8F8), barely visible
grain pattern, high-end stationery feel, minimal contrast,
professional and clean, 1:1 aspect ratio for tiling"
```

### Pattern 2: Maximalist Hero Section
**Design Context**: Bold, energetic landing page with vibrant colors
**Prompt Strategy**:
```
"Explosive color gradients, neon pink to electric blue,
holographic reflections, dynamic diagonal composition,
retrofuturistic aesthetic, vaporwave influence, high energy,
layered transparency effects, 16:9 cinematic"
```

### Pattern 3: Brutalist Geometric Pattern
**Design Context**: Raw, bold interface with strong typography
**Prompt Strategy**:
```
"Monochromatic geometric pattern, overlapping rectangles,
stark black and white, high contrast, Swiss design influence,
grid-based composition, architectural precision, repeatable
pattern for backgrounds"
```

### Pattern 4: Organic Natural Elements
**Design Context**: Wellness brand, calming user experience
**Prompt Strategy**:
```
"Soft botanical watercolor, sage green and cream tones,
gentle leaf shadows, natural light quality, serene atmosphere,
minimal detail for text overlay, 3:4 portrait orientation"
```

## Technical Considerations

### File Optimization
After generation, optimize assets for web:
```bash
# Use media-processing skill or direct tools
python scripts/media_optimizer.py \
  --input docs/assets/hero-image.png \
  --output docs/assets/hero-optimized.webp \
  --quality 85
```

### Responsive Variants
Generate multiple aspect ratios for responsive designs:
```bash
# Desktop hero (16:9)
--aspect-ratio 16:9

# Mobile hero (9:16 or 3:4)
--aspect-ratio 9:16

# Square cards (1:1)
--aspect-ratio 1:1
```

### Accessibility Checks
When overlaying text on generated images:
1. Test color contrast ratios (WCAG AA: 4.5:1 for normal text)
2. Ensure text remains readable across image variations
3. Consider adding gradient overlays or text shadows in code
4. Provide alt text describing the asset's purpose and mood

## Common Pitfalls to Avoid

### ❌ Generic Stock Photo Aesthetics
Don't prompt: "Professional business team working together"
Instead: Design-specific, contextual imagery that serves the interface

### ❌ Overcomplex Generated Images
Generated assets that compete with UI elements create visual chaos
Keep backgrounds subtle enough for text/button overlay

### ❌ Inconsistent Visual Language
Each generated asset should feel part of the same design system
Maintain color palette, visual style, mood consistency

### ❌ Ignoring Integration Context
Assets aren't standalone—consider how they work with:
- Typography overlays
- Interactive elements (buttons, forms)
- Navigation and UI chrome
- Responsive behavior across devices

## Integration with Other Skills

### With `aesthetic` Skill
Use `aesthetic` for overall design system guidance, then `frontend-design` with `ai-multimodal` for asset generation that follows those guidelines.

### With `ui-styling` Skill
Generate assets first, then implement using shadcn/ui + Tailwind with colors/styles that complement the generated imagery.

### With `web-frameworks` Skill
Optimize generated assets for Next.js App Router (image optimization, responsive images, lazy loading).

### With `media-processing` Skill
Post-process generated assets: resize, compress, add filters, create compositions.

## Best Practices Checklist

Before generating assets:
- [ ] Defined clear aesthetic direction from design brief
- [ ] Extracted color palette and typography character
- [ ] Identified asset purpose and integration context
- [ ] Considered accessibility and text overlay needs

During generation:
- [ ] Crafted design-driven, contextual prompt
- [ ] Selected appropriate model and quality level
- [ ] Specified correct aspect ratio for use case
- [ ] Generated multiple variations if exploring

After generation:
- [ ] Evaluated against design standards (score ≥ 7/10)
- [ ] Tested with overlaid text/UI elements
- [ ] Optimized file size for web performance
- [ ] Created responsive variants if needed
- [ ] Documented asset usage and guidelines

## Example Workflow: Complete Hero Section

```bash
# 1. Generate hero image with design context
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "Minimalist desert landscape, warm beige sand dunes,
  soft morning light, serene and spacious, muted earth tones
  (tan, cream, soft ochre), clean composition for text overlay,
  sophisticated travel aesthetic, 16:9 cinematic" \
  --output docs/assets/hero-desert \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 16:9

# 2. Evaluate aesthetic quality
python scripts/gemini_batch_process.py \
  --files docs/assets/hero-desert.png \
  --task analyze \
  --prompt "Rate this image 1-10 for: visual appeal, color harmony,
  suitability for overlaying white text, professional quality.
  List any improvements needed." \
  --output docs/assets/hero-evaluation.md \
  --model gemini-2.5-flash

# 3. If score ≥ 7/10, optimize for web
python scripts/media_optimizer.py \
  --input docs/assets/hero-desert.png \
  --output docs/assets/hero-desktop.webp \
  --quality 85

# 4. Generate mobile variant (9:16)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[same prompt as above]" \
  --output docs/assets/hero-mobile \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 9:16

# 5. Implement in frontend with optimized images
```

## Remember

1. **Design First, Generate Second**: Always start with design thinking, not generation capabilities
2. **Context is King**: Every asset serves the interface, not itself
3. **Iterate Ruthlessly**: First generation is rarely final—evaluate and refine
4. **Maintain Cohesion**: All assets should feel part of one design system
5. **Balance Beauty & Function**: Generated imagery must work with UI elements, not against them

Generate assets that elevate the frontend design, maintain aesthetic consistency, and serve the user experience—never generic, always contextual.
