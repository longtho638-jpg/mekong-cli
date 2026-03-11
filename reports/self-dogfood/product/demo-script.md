# Demo Script — 5-Layer Cascade in Action

**Audience:** Developer conference talk / Hacker News Show HN / investor demo
**Duration:** 8–10 minutes live | 4–5 minutes recorded
**Theme:** "From idea to deployed product in one CLI session"

---

## Setup (Before Demo)

```bash
# Terminal: clean state, one pane visible
export LLM_BASE_URL=https://openrouter.ai/api/v1
export LLM_API_KEY=sk-or-v1-...
export LLM_MODEL=anthropic/claude-sonnet-4

# Verify working
mekong status   # Should show: OpenClaw online. Ready.

# Have browser tab ready at agencyos.network
# Have editor open showing src/core/orchestrator.py
```

---

## Act 1: The Problem (60 seconds)

**Spoken:**
> "Building a product in 2026 means using 8 different AI tools that don't talk to each other. Cursor for code. ChatGPT for strategy. Some other thing for deployment. You're the orchestrator — the human glue between all these tools. What if the AI was the orchestrator?"

**Show on screen:** (no commands yet — just the concept)
```
Without Mekong:
  You → ChatGPT (strategy) → You → Cursor (code) → You → CI/CD → You → monitoring

With Mekong:
  You → mekong cook "build it" → done
```

---

## Act 2: Layer 1 — Founder Layer (90 seconds)

**Spoken:**
> "Let's say I want to build a SaaS product for freelance invoice management. I start at the top — the Founder layer. I don't write code yet. I think."

```bash
mekong swot "AI invoice generator for freelancers"
```

**Expected output:** SWOT analysis in ~15 seconds. Strengths, weaknesses, opportunities, threats. Actual market reasoning, not lorem ipsum.

```bash
mekong tam "AI invoice generator market"
```

**Expected output:** TAM/SAM/SOM breakdown with numbers. Show the market is real.

**Spoken:**
> "In two commands I have a market analysis that would take a consultant 4 hours. And this is just the Founder layer. We haven't written a single line of code."

---

## Act 3: Layer 2 — Product Layer (90 seconds)

**Spoken:**
> "Now we move down the cascade. The product layer takes the founder analysis and turns it into an actual product plan."

```bash
mekong plan "AI invoice generator: auth, invoice CRUD, PDF export, Stripe payment"
```

**Expected output:** `plans/YYMMDD-HHMM-invoice-generator/plan.md` created. Show the file tree — phase-01 through phase-07. Architecture decisions. Tech stack. Timeline.

```bash
mekong brainstorm "features that would make freelancers pay $29/mo"
```

**Expected output:** 10 concrete feature ideas ranked by WTP signal. Not generic — actual freelancer pain points.

**Spoken:**
> "Notice what happened. The product layer didn't just generate text — it created a structured execution plan that the engineer layer will consume next."

---

## Act 4: Layer 3 — Engineer Layer (3 minutes)

**Spoken:**
> "This is where most AI tools start and stop. The engineer layer. But because we have the plan from the product layer, the code isn't generic — it's specific to our architecture decisions."

```bash
mekong cook "implement phase-01: Next.js project with Supabase auth and invoice data model"
```

**Show PEV loop running:**
```
[PLAN] Decomposing task into 6 steps...
  Step 1: Initialize Next.js 14 with TypeScript
  Step 2: Configure Supabase client
  Step 3: Create invoice schema with RLS
  Step 4: Implement auth middleware
  Step 5: Generate TypeScript types from schema
  Step 6: Write integration tests

[EXECUTE] Running step 1/6...
  ✓ Created app/layout.tsx
  ✓ Created app/page.tsx
  ✓ Configured tailwind.config.ts
[EXECUTE] Running step 2/6...
  ✓ Created lib/supabase/client.ts
  ✓ Created lib/supabase/server.ts
...
[VERIFY] Running type check...
  ✓ 0 TypeScript errors
[VERIFY] Running tests...
  ✓ 8/8 tests passing
[DONE] Phase 1 complete. 0 errors.
```

**Spoken:**
> "Plan, Execute, Verify. Not a suggestion — actual working code, type-checked, tested. If the verify step fails, it rolls back and tries again."

```bash
mekong review src/
```

**Expected output:** Code review with specific findings. Not "looks good" — actual issues flagged with line numbers.

---

## Act 5: Layer 4 — Ops Layer (60 seconds)

**Spoken:**
> "One more layer down. Operations. Deploy it."

```bash
mekong deploy --target vercel
```

**Expected output:**
```
[DEPLOY] Detecting stack: Next.js + Supabase
[DEPLOY] Generating vercel.json...
[DEPLOY] Configuring environment variables...
[DEPLOY] Running build check...
  ✓ Build: 4.2s, 0 errors
[DEPLOY] Pushing to Vercel...
  ✓ https://invoice-gen-abc123.vercel.app
[VERIFY] HTTP 200 at production URL
[VERIFY] Auth flow responding
[DONE] Deployed. Production is GREEN.
```

```bash
mekong audit
```

**Expected output:** Security audit — HTTPS, headers, auth config, dependency vulnerabilities. Actionable findings.

---

## Act 6: The Reveal (60 seconds)

**Spoken:**
> "Let me show you what just happened."

```bash
mekong status
```

```
Session summary:
  Founder layer:    2 commands  (market analysis)
  Product layer:    2 commands  (plan + brainstorm)
  Engineer layer:   2 commands  (cook + review)
  Ops layer:        2 commands  (deploy + audit)

  Files created:    47
  Tests written:    23
  Tests passing:    23/23
  TypeScript errors: 0
  Production URL:   https://invoice-gen-abc123.vercel.app

  Time elapsed:     11 minutes
  MCU used:         14 credits
  Cost at Starter:  $3.43
```

**Spoken:**
> "From market analysis to deployed product. 11 minutes. $3.43. 8 commands. This is what we mean by AI-operated business platform — not a copilot, an operator."

---

## Act 7: The Local LLM Kicker (60 seconds, optional)

**Spoken:**
> "One more thing. All of this just ran on Claude Sonnet. But what if you're worried about your code leaving your machine?"

```bash
export OLLAMA_BASE_URL=http://localhost:11434/v1
export LLM_MODEL=qwen2.5-coder
mekong cook "add PDF export to invoice"
```

**Show it runs.** Different model, same PEV loop, code your network never left.

**Spoken:**
> "Three environment variables. Any LLM. Zero lock-in. MIT license. This is Mekong CLI."

---

## Q&A Prep

**"How is this different from Devin?"**
> Devin is an autonomous engineer — code only, $500/mo, proprietary cloud. Mekong covers 5 business layers, costs $49, runs on your LLM, MIT licensed. Devin is your AI CTO. Mekong is your AI company.

**"What if the AI writes bad code?"**
> The Verify step catches it. PEV loop runs type check + tests after every generation. If it fails, it rolls back and retries with a different approach. You see the verification results, not just the code.

**"Does it work with GPT-4?"**
> Yes. Any OpenAI-compatible endpoint. Including local Ollama, DeepSeek, Qwen, Gemini. We tested all of them.

**"How do I get started?"**
> `pip install mekong-cli`, set your LLM env vars, run `mekong cook "hello world"`. Five minutes to first mission. agencyos.network for the hosted version.

---

## Demo Failure Recovery

| Failure | Recovery |
|---------|---------|
| LLM API timeout | Switch to DeepSeek: `export LLM_BASE_URL=https://api.deepseek.com` |
| PEV loop error | Show the error output — it's a feature: "See, it caught the problem" |
| Deploy fails | Use `--dry-run` flag, show the generated config files instead |
| Slow response | Use pre-recorded terminal capture for the cook step, live for simple commands |
