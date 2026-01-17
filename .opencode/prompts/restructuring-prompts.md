# 🏯 OpenCode Restructuring Prompts

# Copy/paste these into OpenCode terminal to execute

## PROMPT 1: Full Codebase Analysis

```
Analyze the entire mekong-cli codebase and create a restructuring plan:

1. Scan all directories: backend/, antigravity/, scripts/, products/
2. Identify duplicate code across modules
3. Find inconsistent patterns
4. List outdated dependencies
5. Map module dependencies

Output a restructuring_plan.md with:
- Files to merge or split
- Code to refactor
- Dependencies to update
- Estimated effort for each task

Use Antigravity API at http://localhost:8000/api/code/analyze for analysis.
```

## PROMPT 2: Modular Architecture Refactor

```
Refactor the codebase into clean modular architecture:

1. Core layer (antigravity/core/):
   - Move all business logic here
   - Ensure no external dependencies

2. API layer (backend/api/):
   - Keep only routing and validation
   - Delegate to core layer

3. CLI layer (scripts/):
   - Thin wrappers calling core

4. Products layer (products/):
   - Self-contained packages

Apply Binh Pháp principle: "Tướng" - Clear command structure.
Each layer should have ONE responsibility.
```

## PROMPT 3: WIN-WIN-WIN Validation

```
Add WIN-WIN-WIN validation hooks to all revenue-related code:

1. Find all functions involving:
   - Payments (paypal, gumroad)
   - Lead capture
   - Customer data

2. Add WIN-WIN-WIN check before execution:
   - Anh WIN: Revenue/equity
   - Agency WIN: Knowledge/infrastructure
   - Startup WIN: Value/protection

3. Log validation results to logs/win_checks.log

Reference: .agent/subagents/core/win3-checker.md
```

## PROMPT 4: Customer Funnel Integration

```
Implement customer-centric funnel to bring Gumroad buyers to owned platform:

1. Create post-purchase email sequence:
   - Thank you + onboarding link
   - Day 3: Tutorial content
   - Day 7: Community invite
   - Day 14: Upsell to Pro

2. Add license key system:
   - Generate on Gumroad purchase
   - Validate on platform login
   - Track activation metrics

3. Build customer portal:
   - License management
   - Downloads access
   - Community access

Binh Pháp: "Dụng Gián" - Use Gumroad as scout, platform as base.
```

## PROMPT 5: Data Moat Implementation

```
Build proprietary data moat to increase customer retention:

1. Implement usage analytics:
   - Track feature usage
   - Identify power users
   - Spot churn signals

2. Create personalized insights:
   - Revenue projections
   - Growth recommendations
   - Benchmark vs peers

3. Add export friction (ethical):
   - Data in proprietary format
   - Migration assistance for Pro

Binh Pháp: "Địa Hình" - Own the terrain.
```

---

# RUN SEQUENCE

Execute in OpenCode in this order:

1. PROMPT 1 → Get analysis
2. Review results
3. PROMPT 2 → Refactor
4. PROMPT 3 → Add hooks
5. PROMPT 4 → Customer funnel
6. PROMPT 5 → Data moat
