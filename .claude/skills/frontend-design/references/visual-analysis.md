# Visual Analysis for Result Verification

Use AI multimodal vision capabilities to analyze generated assets and verify they meet frontend design standards.

## Purpose

- Verify generated assets align with aesthetic direction
- Ensure professional quality before integration
- Identify specific improvements needed for iteration
- Make objective design decisions based on analysis
- Extract actionable data (hex codes, composition insights)

## Analysis Workflow

### Step 1: Define Evaluation Criteria

Based on your design context, determine what to evaluate:

**Core Evaluation Points**:
- Visual coherence with chosen aesthetic direction
- Color harmony and palette consistency
- Composition balance and focal points
- Typography compatibility (if text overlay needed)
- Professional quality rating (1-10 scale)
- Technical suitability (aspect ratio, resolution, file characteristics)

**Context-Specific Points**:
- **For hero sections**: Suitability for text overlay, visual hierarchy support
- **For backgrounds**: Subtlety, pattern repetition quality, texture detail
- **For marketing**: Brand alignment, emotional impact, attention-grabbing power
- **For decorative elements**: Integration potential, visual weight, uniqueness

### Step 2: Run Comprehensive Analysis

Use `ai-multimodal` skill's vision understanding capabilities:

```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/generated-hero.png \
  --task analyze \
  --prompt "Analyze this design asset comprehensively:

## Design Alignment
- Aesthetic Direction: [e.g., brutalist/minimalist/maximalist]
- Expected Style: [describe target aesthetic]
- Color Palette Target: [list expected colors]

## Evaluation Criteria
1. Visual Coherence: Does it match the intended aesthetic direction?
2. Color Analysis: List dominant colors (hex codes). Evaluate harmony and mood.
3. Composition: Analyze balance, focal points, negative space, visual flow.
4. Typography Compatibility: Rate suitability for overlaying text (consider contrast, busy areas).
5. Professional Quality: Rate 1-10 with justification.
6. Technical Assessment: Resolution quality, compression artifacts, aspect ratio correctness.

## Specific Feedback
- What works well?
- What specific elements need improvement?
- What would elevate this to 9/10 quality?

## Overall Rating: X/10
Provide final score with clear reasoning." \
  --output docs/assets/analysis-report.md \
  --model gemini-2.5-flash
```

### Step 3: Analyze Multiple Variations

Compare multiple generated options to select the best:

```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/option-1.png docs/assets/option-2.png docs/assets/option-3.png \
  --task analyze \
  --prompt "Compare these 3 design variations:

For each image, evaluate:
1. Aesthetic alignment with [design direction]
2. Color effectiveness
3. Composition strength
4. Text overlay suitability
5. Professional quality rating (1-10)

Then provide:
- Ranking: Best to worst with justification
- Recommendation: Which to use and why
- Hybrid suggestion: Best elements from each to combine" \
  --output docs/assets/comparison-analysis.md \
  --model gemini-2.5-flash
```

### Step 4: Detailed Color Extraction

Extract exact color palette for implementation:

```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/final-asset.png \
  --task analyze \
  --prompt "Extract the complete color palette from this image:

1. Identify 5-8 dominant colors with hex codes
2. Classify each: primary, accent, neutral, or background
3. Suggest CSS variable names (e.g., --color-primary-500)
4. Evaluate color accessibility (WCAG contrast ratios)
5. Recommend which colors work for text, backgrounds, accents

Provide as structured data for easy CSS implementation." \
  --output docs/assets/color-palette.md \
  --model gemini-2.5-flash
```

**Example Output Structure**:
```css
/* Extracted Color Palette */
:root {
  /* Primary Colors */
  --color-primary-600: #2C5F7D;  /* Dark teal - headers, CTAs */
  --color-primary-400: #4A90B8;  /* Medium teal - links, accents */

  /* Accent Colors */
  --color-accent-500: #E8B44F;   /* Warm gold - highlights */

  /* Neutral Colors */
  --color-neutral-900: #1A1A1A;  /* Near black - body text */
  --color-neutral-100: #F5F5F5;  /* Light gray - backgrounds */

  /* Semantic Usage */
  --color-text-primary: var(--color-neutral-900);
  --color-text-on-primary: #FFFFFF;
  --color-background: var(--color-neutral-100);
  --color-cta: var(--color-primary-600);
}
```

### Step 5: Integration Testing Analysis

Analyze how asset works with UI elements:

```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/hero-with-text-overlay.png \
  --task analyze \
  --prompt "Analyze this design asset with UI elements overlaid:

1. Text Readability: Can all text be read clearly?
2. Contrast Issues: Identify any WCAG violations
3. Visual Hierarchy: Do buttons and CTAs stand out?
4. Spacing Problems: Any crowding or poor breathing room?
5. Responsive Concerns: Will this work on mobile at 9:16?

Provide specific recommendations for adjustments." \
  --output docs/assets/integration-analysis.md \
  --model gemini-2.5-flash
```

## Decision Framework

### Score ≥ 8/10: Proceed to Integration
**Actions**:
- Optimize for web delivery
- Create responsive variants
- Document implementation guidelines
- Extract color palette for CSS variables

### Score 6-7/10: Minor Refinements Needed
**Actions**:
- Use `media-processing` skill for adjustments:
  - Brightness/contrast tweaks
  - Saturation adjustments
  - Selective color grading
- Consider selective regeneration of problem areas
- May proceed with caution if time-constrained

**Example Refinement**:
```bash
# Adjust brightness and contrast
python scripts/media_optimizer.py \
  --input docs/assets/hero.png \
  --output docs/assets/hero-adjusted.png \
  --brightness 1.1 \
  --contrast 1.05
```

### Score < 6/10: Major Iteration Required
**Actions**:
- Analyze specific failure points from report
- Refine generation prompt substantially
- Regenerate with corrected parameters
- Consider alternative aesthetic approach
- Run analysis again on new generation

**Iteration Strategy**:
1. Identify top 3 weaknesses from analysis
2. Address each in refined prompt
3. Regenerate with fast model first
4. Re-analyze before committing to standard model

## Advanced Analysis Techniques

### Batch Analysis for Rapid Iteration

Analyze multiple generations simultaneously:

```bash
# Generate 3 variations with fast model
for i in {1..3}; do
  python scripts/gemini_batch_process.py \
    --task generate \
    --prompt "[prompt with variation-$i twist]" \
    --output docs/assets/var-$i \
    --model imagen-4.0-fast-generate-001 \
    --aspect-ratio 16:9
done

# Batch analyze all variations
python scripts/gemini_batch_process.py \
  --files docs/assets/var-*.png \
  --task analyze \
  --prompt "Rank these variations 1-3 with scores. Identify winner." \
  --output docs/assets/batch-analysis.md \
  --model gemini-2.5-flash
```

### Contextual Testing

Test assets in actual UI context:

1. **Mock up UI overlay** (use design tool or code)
2. **Capture screenshot** of asset with real UI elements
3. **Analyze integrated version** for readability, hierarchy, contrast

```bash
# After creating mockup with UI overlay
python scripts/gemini_batch_process.py \
  --files docs/assets/hero-mockup-with-ui.png \
  --task analyze \
  --prompt "Evaluate this hero section with actual UI:
1. Headline readability over image
2. CTA button visibility and contrast
3. Navigation bar integration
4. Overall visual hierarchy effectiveness
Provide WCAG contrast ratio estimates." \
  --output docs/assets/ui-integration-test.md \
  --model gemini-2.5-flash
```

### A/B Testing Analysis

Compare design directions objectively:

```bash
python scripts/gemini_batch_process.py \
  --files docs/assets/design-a.png docs/assets/design-b.png \
  --task analyze \
  --prompt "A/B test analysis:

Design A: [minimalist approach]
Design B: [maximalist approach]

Compare for:
1. User attention capture (first 3 seconds)
2. Information hierarchy clarity
3. Emotional impact and brand perception
4. Conversion optimization potential
5. Target audience alignment ([describe audience])

Recommend which to A/B test in production and why." \
  --output docs/assets/ab-test-analysis.md \
  --model gemini-2.5-flash
```

## Analysis Best Practices

### 1. Be Specific
❌ Generic: "Is this image good?"
✓ Specific: "Does this align with brutalist aesthetic? Rate text overlay suitability."

### 2. Use Structured Prompts
Format analysis requests with numbered criteria for actionable feedback:
```
1. [Criterion A]
2. [Criterion B]
3. [Criterion C]
Overall Rating: X/10
```

### 3. Request Hex Codes
❌ Accept: "The image uses blue tones"
✓ Demand: "Extract hex codes: #1E40AF, #3B82F6, #60A5FA"

### 4. Compare Variations
Never settle for the first generation without comparison:
- Generate 3+ variations
- Analyze comparatively
- Select objectively based on scores

### 5. Test Integration Context
Analyze assets *with* UI elements overlaid, not in isolation:
- Mock up text overlays
- Test with actual buttons and CTAs
- Evaluate in responsive contexts

### 6. Document Decisions
Save analysis reports for design system documentation:
```
docs/
  assets/
    hero-image.png
    hero-analysis.md       # Analysis report
    hero-color-palette.md  # Extracted colors
  design-guidelines/
    asset-usage.md         # Guidelines derived from analysis
```

## Evaluation Prompt Templates

### Template 1: Quick Quality Check
```
Rate this asset 1-10 for:
1. Aesthetic quality
2. Color harmony
3. Composition balance
4. Professional polish

Overall: X/10. Brief justification.
```

### Template 2: Comprehensive Evaluation
```
Comprehensive design asset evaluation:

## Aesthetic Alignment
- Target style: [describe]
- Actual style: [analyze]
- Match quality: [1-10]

## Technical Quality
- Resolution: [assess]
- Compression: [check artifacts]
- Aspect ratio: [verify]

## Color Analysis
- Dominant colors: [list hex codes]
- Harmony: [evaluate]
- Mood: [describe]

## Composition
- Balance: [analyze]
- Focal points: [identify]
- Negative space: [evaluate]

## Integration Readiness
- Text overlay: [rate 1-10]
- UI compatibility: [assess]
- Responsive suitability: [evaluate]

Overall Score: X/10
Key Strengths: [list]
Improvements Needed: [list]
```

### Template 3: Comparison Analysis
```
Compare [N] variations:

For each:
- Aesthetic score: X/10
- Technical score: X/10
- Integration score: X/10
- Overall: X/10

Ranking: [1st, 2nd, 3rd]
Recommendation: Use [X] because [reason]
Improvements: [specific suggestions]
```

## Common Analysis Pitfalls

### ❌ Vague Feedback
Analysis returns: "Colors are nice"
**Fix**: Request specific hex codes and harmony evaluation

### ❌ No Numeric Rating
Analysis returns: "Pretty good quality"
**Fix**: Always request 1-10 rating with justification

### ❌ Missing Context
Analyzing asset without specifying intended use
**Fix**: Include context in prompt (hero section, background, marketing, etc.)

### ❌ Single Analysis Point
Only checking aesthetic, ignoring technical or integration concerns
**Fix**: Use comprehensive evaluation template covering all dimensions

## Next Steps

- **Generate assets**: See `asset-generation.md` for creation workflow
- **Extract from inspiration**: See `design-extraction.md` for learning from existing designs
- **Optimize and integrate**: See `technical-guide.md` for file optimization and implementation
