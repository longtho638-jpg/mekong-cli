---
description: Naming, positioning, tagline, domain check, brand voice — full brand identity từ CLI
allowed-tools: Read, Write, Bash
---

# /founder brand — Brand Identity Engine

## USAGE
```
/founder brand [--name "<idea>"] [--check] [--full]
```

Flags:
  --name    : check một cái tên cụ thể
  --check   : domain + trademark availability check
  --full    : generate tất cả (name + tagline + positioning + voice)

## BƯỚC 0 — SCAN
```
□ Đọc .mekong/company.json          → product_type, target audience
□ Đọc .mekong/validate/             → customer language từ interviews
□ Đọc .mekong/founder/persona.json  → ICP
IF không có context → hỏi 3 câu:
  "Sản phẩm làm gì? (1 câu)"
  "Ai dùng nó? (1 câu)"
  "Cảm giác muốn truyền tải là gì? (minimal/playful/professional/bold)"
```

## BƯỚC 1 — NAME GENERATION

**Agent: CMO / gemini-flash / 1 MCU**

Generate 3 naming tracks × 5 names = 15 candidates:

```
TRACK A — DESCRIPTIVE (dễ hiểu ngay):
  Pattern: [action/benefit] + [domain/object]
  Examples: Dropbox, Basecamp, Buffer
  Generate: 5 names theo pattern này

TRACK B — INVENTED (memorable, ownable):
  Pattern: portmanteau, morphed word, made-up
  Examples: Spotify, Notion, Figma, Supabase
  Generate: 5 names theo pattern này

TRACK C — METAPHORICAL (evocative, story-rich):
  Pattern: unrelated concept that captures the feeling
  Examples: Apple, Stripe, Linear, Vercel
  Generate: 5 names theo pattern này

FOR EACH NAME, score:
  Pronounceable  : 1-5 (nói to thành tiếng dễ không?)
  Memorable      : 1-5 (đọc 1 lần nhớ không?)
  Available      : TBD (check bước sau)
  Brand-able     : 1-5 (có thể build brand lên được không?)
  Domain-friendly: 1-5 (.com available? short?)
  
OUTPUT TABLE:
  NAME        TRACK   PRONOUNCE  MEMORABLE  DOMAIN    SCORE
  ──────────────────────────────────────────────────────────
  Mekong      Meta    5          5          ✓ likely  9.0
  Flowbase    Desc    5          4          ✓ likely  8.5
  ...
```

## BƯỚC 2 — DOMAIN + AVAILABILITY CHECK

**Agent: COO (bash) / local / 0 MCU**

```bash
# Check domain availability via whois
for name in {name_list}; do
  whois "${name}.com" 2>/dev/null | grep -i "no match\|not found\|available" | head -1
  whois "${name}.io" 2>/dev/null | grep -i "no match\|not found\|available" | head -1
done
```

Also check:
```
GitHub username: https://github.com/{name} → 404 = available
Twitter/X: https://x.com/{name}
ProductHunt: basic name search
```

Print availability matrix:
```
NAME        .com    .io     .co     GitHub  X/Twitter
──────────────────────────────────────────────────────
Flowbase    ✓ FREE  ✓ FREE  TAKEN   ✓ FREE  TAKEN
Mekong      TAKEN   ✓ FREE  TAKEN   TAKEN   ✓ FREE
```

## BƯỚC 3 — POSITIONING STATEMENT

**Agent: CMO / gemini-flash / 1 MCU**

Geoffrey Moore positioning template:

```
FILE: .mekong/brand/positioning.md

FOR: {specific target customer}
WHO: {has this specific problem/need}
{COMPANY NAME} IS: {product category}
THAT: {key benefit / differentiator}
UNLIKE: {primary alternative}
OUR PRODUCT: {specific differentiating claim}

EXAMPLE (AgencyOS):
FOR: Solo founders và micro-teams
WHO: Muốn run một công ty AI-powered mà không cần hire team lớn
AGENCYOS IS: Agentic company operating system
THAT: Tự động hóa 80% operations qua CLI với 8 AI agents
UNLIKE: Project management tools hay AI assistants đơn lẻ
OUR PRODUCT: Là layer duy nhất bạn cần giữa idea và revenue

──────────────────────────────────────────────────────────
ELEVATOR PITCHES (theo context):

10 seconds (party):
  "{Company} lets {persona} {outcome} without {pain}."

30 seconds (investor):
  "We built {category} for {market}.
   {Traction metric}.
   Our insight: {contrarian belief}.
   We make money via {model}."

2 minutes (demo):
  Problem → Solution → Traction → Why now → Ask
```

## BƯỚC 4 — TAGLINE VARIANTS

**Agent: CMO / gemini-flash / 1 MCU**

5 tagline strategies × 3 variants = 15 options:

```
STRATEGY 1 — OUTCOME-FOCUSED:
  "{What customer gets}" not "{What product does}"
  Examples:
    "Your company, fully automated"
    "From idea to $1M, via terminal"
    "8 agents. 1 founder. Zero excuses."

STRATEGY 2 — CONTRAST:
  "Not X. Y."
  Examples:
    "Not a tool. An operating system."
    "Not AI-assisted. AI-operated."

STRATEGY 3 — PROVOCATIVE CLAIM:
  Bold statement that forces reaction
  Examples:
    "The last hire you'll ever need"
    "Your startup runs while you sleep"

STRATEGY 4 — AUDIENCE CALL:
  Speaks directly to the founder
  Examples:
    "For founders who build alone"
    "If you can type, you can scale"

STRATEGY 5 — MINIMALIST:
  2-4 words only
  Examples:
    "Terminal. Traction. Revenue."
    "Operate at agent speed."

SCORING CRITERIA:
  □ <8 words
  □ No buzzwords (innovative, revolutionary, AI-powered)
  □ Passes "so what?" test
  □ Passes "could competitor say this?" test (if yes = bad)
  □ Memorable after 24 hours
```

## BƯỚC 5 — BRAND VOICE GUIDE

**Agent: CMO / gemini-flash / 1 MCU**

```
FILE: .mekong/brand/voice-guide.md

BRAND PERSONALITY:
  {Company} sounds like: {3 adjectives}
  {Company} never sounds like: {3 adjectives to avoid}

TONE SPECTRUM:
  Expert ────────●──────── Approachable
  Serious ────●────────── Playful
  Corporate ──────────●── Human
  (adjust sliders based on product + audience)

WRITING RULES:
  ✓ Write like you're talking to a smart friend
  ✓ Use active voice
  ✓ Lead with benefit, not feature
  ✓ Use numbers when possible ("8 agents" not "multiple agents")
  ✓ Short sentences. Then longer ones for rhythm. Then short again.
  ✗ Never use: "leverage", "synergy", "world-class", "cutting-edge"
  ✗ Never use: passive voice for important claims
  ✗ Never start with "We are..." — start with what you do for customer

EXAMPLES (before/after):
  ❌ "We leverage cutting-edge AI technology to revolutionize..."
  ✓  "8 AI agents run your company. You just review."

  ❌ "Our platform enables founders to achieve operational excellence"
  ✓  "Type /cook. Ship in 10 minutes."
```

## OUTPUT

```
✅ Brand Kit Ready — {company_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 .mekong/brand/
  ✓ name-candidates.md     (15 names, scored)
  ✓ domain-availability.md (availability matrix)
  ✓ positioning.md         (Moore template)
  ✓ taglines.md            (15 options, 5 strategies)
  ✓ voice-guide.md         (tone + writing rules)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 MCU: -2 (balance: {remaining})

HUMAN 20% actions:
  1. Pick name from candidates → /founder brand --name "X" --check
  2. Choose tagline variant → paste into CLAUDE.md
  3. Register domain (namecheap/cloudflare ~$10/yr)
  4. /founder legal (next step after brand locked)
```
