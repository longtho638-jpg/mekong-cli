# Technical Guide & Best Practices

Technical considerations, complete examples, and best practices checklists for AI multimodal integration in frontend design.

## File Optimization

### After Generation
Optimize assets for web delivery:

```bash
# Use media-processing skill or direct tools
python scripts/media_optimizer.py \
  --input docs/assets/hero-image.png \
  --output docs/assets/hero-optimized.webp \
  --quality 85
```

### Format Selection
- **WebP**: Best for web, 25-35% smaller than PNG, wide browser support
- **AVIF**: Cutting edge, 50% smaller than WebP, limited support (progressive enhancement)
- **PNG**: Lossless, large file size, use for assets requiring transparency
- **JPEG**: Lossy, smaller than PNG, use for photos without transparency

### Optimization Strategy
```bash
# Generate at high quality
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[prompt]" \
  --output docs/assets/hero-original \
  --model imagen-4.0-generate-001

# Convert to WebP (primary)
python scripts/media_optimizer.py \
  --input docs/assets/hero-original.png \
  --output docs/assets/hero.webp \
  --quality 85

# Convert to JPEG (fallback)
python scripts/media_optimizer.py \
  --input docs/assets/hero-original.png \
  --output docs/assets/hero.jpg \
  --quality 85
```

## Responsive Variants

### Generate Multiple Aspect Ratios
```bash
# Desktop hero (16:9)
--aspect-ratio 16:9

# Mobile hero (9:16 or 3:4)
--aspect-ratio 9:16

# Square cards (1:1)
--aspect-ratio 1:1
```

### Responsive Image Strategy

**Option 1: Art Direction (different crops)**
```html
<picture>
  <source media="(min-width: 768px)" srcset="hero-desktop.webp">
  <source media="(max-width: 767px)" srcset="hero-mobile.webp">
  <img src="hero-desktop.jpg" alt="Hero image">
</picture>
```

**Option 2: Resolution Switching (same crop, different sizes)**
```html
<img
  srcset="hero-400w.webp 400w, hero-800w.webp 800w, hero-1200w.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  src="hero-800w.jpg"
  alt="Hero image"
/>
```

## Accessibility Checks

### When Overlaying Text on Generated Images

1. **Test Color Contrast Ratios**
   - WCAG AA: 4.5:1 for normal text, 3:1 for large text
   - WCAG AAA: 7:1 for normal text, 4.5:1 for large text

2. **Ensure Text Readability**
   - Test across image variations
   - Consider adding gradient overlays in code
   - Add text shadows for increased legibility

3. **Provide Alt Text**
   - Describe the asset's purpose and mood
   - Don't repeat visible text
   - Keep concise (150 characters max)

### CSS Techniques for Accessibility

```css
/* Gradient overlay for text readability */
.hero {
  position: relative;
  background-image: url('hero.webp');
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.3) 0%,
    rgba(0,0,0,0.6) 100%
  );
}

/* Text shadow for contrast */
.hero-text {
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

/* Ensure minimum contrast */
.hero-cta {
  background: var(--color-primary-600);
  color: white; /* Ensure 4.5:1 contrast */
}
```

## Complete Workflow Examples

### Example 1: Hero Section (Complete Pipeline)

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
  --prompt "Minimalist desert landscape, warm beige sand dunes,
  soft morning light, serene and spacious, muted earth tones
  (tan, cream, soft ochre), clean composition for text overlay,
  sophisticated travel aesthetic, 9:16 portrait" \
  --output docs/assets/hero-mobile \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 9:16

# 5. Optimize mobile variant
python scripts/media_optimizer.py \
  --input docs/assets/hero-mobile.png \
  --output docs/assets/hero-mobile.webp \
  --quality 85

# 6. Implement in frontend with optimized images
```

### Example 2: Extract, Generate, Analyze Loop

```bash
# 1. Extract design guidelines from inspiration
python scripts/gemini_batch_process.py \
  --files docs/inspiration/competitor-hero.png \
  --task analyze \
  --prompt "[use extraction prompt from design-extraction.md]" \
  --output docs/design-guidelines/competitor-analysis.md \
  --model gemini-2.5-flash

# 2. Generate asset based on extracted guidelines
# (Review competitor-analysis.md for color palette, aesthetic)
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[craft prompt using extracted aesthetic and colors]" \
  --output docs/assets/our-hero \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 16:9

# 3. Analyze our generated asset
python scripts/gemini_batch_process.py \
  --files docs/assets/our-hero.png \
  --task analyze \
  --prompt "Compare to competitor design. Rate differentiation (1-10).
  Are we too similar or successfully distinct?" \
  --output docs/assets/differentiation-analysis.md \
  --model gemini-2.5-flash

# 4. Extract colors from our final asset for CSS
python scripts/gemini_batch_process.py \
  --files docs/assets/our-hero.png \
  --task analyze \
  --prompt "[use color extraction prompt from visual-analysis.md]" \
  --output docs/assets/color-palette.md \
  --model gemini-2.5-flash
```

### Example 3: A/B Test Assets

```bash
# Generate 2 design directions
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "Minimalist approach: [prompt]" \
  --output docs/assets/variant-a \
  --model imagen-4.0-fast-generate-001 \
  --aspect-ratio 16:9

python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "Bold approach: [prompt]" \
  --output docs/assets/variant-b \
  --model imagen-4.0-fast-generate-001 \
  --aspect-ratio 16:9

# Compare variants
python scripts/gemini_batch_process.py \
  --files docs/assets/variant-a.png docs/assets/variant-b.png \
  --task analyze \
  --prompt "A/B comparison for [target audience]:
  1. Attention capture
  2. Brand alignment
  3. Conversion potential
  Recommend which to test." \
  --output docs/assets/ab-comparison.md \
  --model gemini-2.5-flash

# Generate production version of winner
python scripts/gemini_batch_process.py \
  --task generate \
  --prompt "[winning approach prompt]" \
  --output docs/assets/final-hero \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 16:9
```

## Best Practices Checklists

### Asset Generation Workflow

**Before generating assets**:
- [ ] Defined clear aesthetic direction from design brief
- [ ] Extracted color palette and typography character
- [ ] Identified asset purpose and integration context
- [ ] Considered accessibility and text overlay needs

**During generation**:
- [ ] Crafted design-driven, contextual prompt
- [ ] Selected appropriate model and quality level
- [ ] Specified correct aspect ratio for use case
- [ ] Generated multiple variations if exploring

**After generation**:
- [ ] Ran comprehensive visual analysis (score ≥ 7/10)
- [ ] Extracted exact color palette with hex codes
- [ ] Compared multiple variations and selected best
- [ ] Tested with overlaid text/UI elements
- [ ] Optimized file size for web performance
- [ ] Created responsive variants if needed
- [ ] Documented asset usage and guidelines

### Design Guideline Extraction Workflow

**When analyzing existing designs**:
- [ ] Captured high-quality reference screenshots
- [ ] Ran comprehensive design analysis with structured prompts
- [ ] Extracted specific values (hex codes, px sizes, ms timings)
- [ ] Analyzed multiple screens for pattern consistency
- [ ] Validated font predictions against Google Fonts
- [ ] Documented findings in actionable format
- [ ] Created CSS variable specifications
- [ ] Saved extracted guidelines in project docs/

### Quality Gates

**Never proceed to integration without**:
- [ ] Visual analysis score ≥ 7/10
- [ ] Extracted color palette documented
- [ ] Accessibility contrast checks passed
- [ ] Responsive variants generated
- [ ] File optimization completed
- [ ] Asset usage guidelines documented

## Cost & Performance Optimization

### Model Selection Strategy
1. **Exploration Phase**: Use fast model (3-5 variations)
   - Cost: ~$0.02 per image
   - Speed: ~5-10 seconds per generation
   - Use for: Rapid iteration, aesthetic exploration

2. **Refinement Phase**: Use standard model (1-2 variations)
   - Cost: ~$0.04 per image
   - Speed: ~10-20 seconds per generation
   - Use for: Production-ready assets

3. **Final Polish**: Use ultra model (1 generation)
   - Cost: ~$0.08 per image
   - Speed: ~20-30 seconds per generation
   - Use for: Hero images, marketing materials, critical assets

### Analysis Model Strategy
- Use gemini-2.5-flash for all analysis (vision understanding)
- Cost: ~$0.001 per analysis
- Speed: ~2-5 seconds per analysis
- Token-efficient: Images count as ~258-1548 tokens

### Budget Guidelines
- **Small project**: 10-20 images, ~$2-5 total
- **Medium project**: 50-100 images, ~$10-20 total
- **Large project**: 200+ images, ~$50+ total

## Integration with Next.js (Example)

```tsx
// app/components/Hero.tsx
import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative h-screen">
      {/* Background image with optimization */}
      <Image
        src="/assets/hero-desktop.webp"
        alt="Minimalist desert landscape"
        fill
        priority
        quality={85}
        className="object-cover"
        sizes="100vw"
      />

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <h1 className="text-6xl font-bold text-white drop-shadow-lg">
          Your Headline
        </h1>
      </div>
    </section>
  )
}
```

## Common Issues & Solutions

### Issue 1: Generated Asset Too Generic
**Symptoms**: Asset looks like stock photography, lacks design character
**Solution**:
- Refine prompt with specific aesthetic movements
- Reference artists/designers/styles explicitly
- Use more distinctive color directions
- Add contextual details that make it unique

### Issue 2: Poor Text Overlay Readability
**Symptoms**: Text hard to read over generated background
**Solutions**:
- Add CSS gradient overlay (see Accessibility section)
- Regenerate with "clean composition for text overlay" in prompt
- Use darker/lighter areas strategically
- Add text shadows or backdrop-blur

### Issue 3: Inconsistent Design Language
**Symptoms**: Each generated asset feels unrelated
**Solution**:
- Extract and document design system from first successful generation
- Reuse color palette keywords in all subsequent prompts
- Maintain consistent aesthetic direction across generations
- Reference previous successful assets in new prompts

### Issue 4: Low Analysis Scores
**Symptoms**: Consistently getting scores < 7/10
**Solutions**:
- Review evaluation criteria—are they realistic?
- Study high-scoring designs for patterns
- Use design extraction on inspiration to learn what works
- Iterate prompt with specific improvements from analysis

### Issue 5: Slow Generation Times
**Symptoms**: Waiting too long for results
**Solutions**:
- Use fast model for exploration phase
- Generate in batches rather than sequentially
- Reserve ultra model only for final production assets
- Run analysis while next generation processes

## Reference Summary

This technical guide complements:

- **`ai-multimodal-overview.md`**: Entry point and core principles
- **`asset-generation.md`**: Complete generation workflow with prompts
- **`visual-analysis.md`**: Analysis and verification workflow
- **`design-extraction.md`**: Extract guidelines from existing designs

## Quick Reference Commands

```bash
# Generate (standard quality)
python scripts/gemini_batch_process.py --task generate \
  --prompt "[design-driven prompt]" \
  --output docs/assets/[name] \
  --model imagen-4.0-generate-001 \
  --aspect-ratio 16:9

# Analyze
python scripts/gemini_batch_process.py --files docs/assets/[image].png \
  --task analyze \
  --prompt "[evaluation criteria]" \
  --output docs/assets/analysis.md \
  --model gemini-2.5-flash

# Optimize
python scripts/media_optimizer.py \
  --input docs/assets/[image].png \
  --output docs/assets/[image].webp \
  --quality 85

# Extract colors
python scripts/gemini_batch_process.py --files docs/assets/[image].png \
  --task analyze \
  --prompt "Extract 5-8 dominant colors with hex codes. Classify as primary/accent/neutral." \
  --output docs/assets/color-palette.md \
  --model gemini-2.5-flash
```

## Final Checklist

Before considering any asset "done":
- [x] Generated with design-driven prompt (not generic)
- [x] Analyzed and scored ≥ 7/10
- [x] Extracted color palette for CSS implementation
- [x] Tested with UI overlays for readability
- [x] Optimized for web (WebP/JPEG)
- [x] Created responsive variants
- [x] Documented usage guidelines
- [x] Accessibility checks passed (contrast, alt text)
- [x] Integrated into frontend with proper optimization

**Remember**: Design first, generate second. Context is king. Iterate ruthlessly. Analysis is mandatory. Demand specifics, not generalities.
