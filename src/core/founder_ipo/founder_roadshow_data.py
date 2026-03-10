"""Roadshow constants — deck structure, Q&A bank, allocation rules."""

from __future__ import annotations

# (number, title, key_content_template)
DECK_STRUCTURE: list[tuple[int, str, str]] = [
    (1, "Cover Slide", "Company name, logo, tagline, date"),
    (2, "Investment Highlights", "5-6 bullet reasons to invest"),
    (3, "The Problem", "Market pain point with data validation"),
    (4, "Our Solution", "Product overview and core value proposition"),
    (5, "Product Demo / Screenshot", "Visual proof of product experience"),
    (6, "Market Opportunity", "TAM / SAM / SOM with bottom-up sizing"),
    (7, "Business Model", "How we make money, pricing tiers, ACV"),
    (8, "Go-To-Market Strategy", "Channels, motion, land-and-expand"),
    (9, "Traction / Key Metrics", "ARR, growth, NRR, customer count"),
    (10, "Customer Success Stories", "2-3 logos with quantified outcomes"),
    (11, "Competitive Landscape", "Positioning map, differentiation"),
    (12, "Technology & Moat", "Technical advantages and defensibility"),
    (13, "Financial Summary", "Revenue, gross margin, burn, path to profitability"),
    (14, "Revenue Growth", "ARR waterfall chart, cohort analysis"),
    (15, "Unit Economics", "CAC, LTV, payback period, NRR waterfall"),
    (16, "Team", "Founders + C-suite, relevant experience"),
    (17, "Board & Advisors", "Independent directors, notable advisors"),
    (18, "Use of Proceeds", "Allocation breakdown and expected outcomes"),
    (19, "IPO Timeline", "Key milestones from pricing to listing"),
    (20, "Why Now / Closing", "Market timing, vision, call to action"),
]

# (category, question, suggested_answer)
QA_BANK: list[tuple[str, str, str]] = [
    (
        "financial",
        "When will you be profitable?",
        "We target operating profitability by [date] at [ARR] scale. "
        "Our unit economics are strong — [gross margin]% gross margin and "
        "[payback] month CAC payback. We're investing in growth while maintaining "
        "line-of-sight to profitability.",
    ),
    (
        "financial",
        "What is your revenue retention?",
        "Our Net Revenue Retention is [NRR]%, meaning existing customers expand "
        "with us over time. Logo retention is [logo_retention]%. "
        "This makes growth highly efficient.",
    ),
    (
        "financial",
        "How do you define ARR?",
        "ARR is annualized contracted recurring revenue from all active subscriptions "
        "as of the measurement date. We exclude professional services and one-time fees.",
    ),
    (
        "business",
        "What is your competitive moat?",
        "Our moat comes from [moat]. Competitors would need [time/investment] to replicate "
        "our [data/network/technology] advantage. We have [N] patents pending.",
    ),
    (
        "business",
        "What is your go-to-market motion?",
        "We use a product-led growth motion with enterprise sales overlay. "
        "PLG drives [X]% of new ARR organically; enterprise AE team handles "
        "expansion to $[ACV]+ contracts.",
    ),
    (
        "business",
        "Who are your top 3 competitors and how do you win?",
        "We compete with [A], [B], [C]. We win on [differentiation]. "
        "Our win rate against [key competitor] is [X]% in deals where we're both selected.",
    ),
    (
        "founder",
        "Why are you the right team to win this market?",
        "Our founding team has [X] years combined experience in [domain]. "
        "[CEO] previously [relevant experience]. We have domain-specific insights "
        "competitors lack and have already proven the model at $[ARR]M ARR.",
    ),
    (
        "founder",
        "What happens if a key founder leaves?",
        "All founders are subject to 4-year vesting with 1-year cliff. "
        "We have a deep bench — our VP Eng and CPO could each step up. "
        "We are building the company, not a person.",
    ),
    (
        "market",
        "How large is your total addressable market?",
        "Our TAM is $[X]B, based on [methodology]. Our current SAM is $[Y]B "
        "targeting [segment]. We're at [Z]% market penetration today, "
        "with a clear path to expand into adjacent markets.",
    ),
    (
        "market",
        "What macro risks could hurt your business?",
        "Enterprise software spend correlates with GDP. In downturns, "
        "customers consolidate vendors — which benefits platforms like ours. "
        "Our NRR of [X]% demonstrates resilience in our existing base.",
    ),
    (
        "valuation",
        "How did you arrive at your IPO valuation?",
        "We're pricing at [X]x ARR, which is [discount/premium] to "
        "comparable public SaaS companies at [comp_multiple]x. "
        "Our growth rate of [Y]% YoY justifies a premium to slower-growing peers.",
    ),
    (
        "valuation",
        "What is your lock-up structure?",
        "Insiders and pre-IPO investors are subject to a 180-day lock-up. "
        "We believe this aligns long-term interests. The underwriters have "
        "standard early release provisions for exceptional circumstances.",
    ),
    (
        "financial",
        "What are your biggest risks to the financial plan?",
        "The three biggest risks are: (1) sales cycle elongation in enterprise, "
        "(2) macro-driven budget freezes, and (3) competition from [key competitor]. "
        "We mitigate through [pipeline diversification / multi-product / expansion].",
    ),
    (
        "business",
        "How do you think about international expansion?",
        "International represents [X]% of ARR today. We see [region] as the "
        "highest-opportunity next market given [rationale]. We plan to invest "
        "$[Y]M in EMEA/APAC sales hires following the IPO.",
    ),
    (
        "founder",
        "Why IPO now versus staying private?",
        "The IPO provides three strategic advantages: (1) currency for M&A, "
        "(2) brand credibility with enterprise buyers, and (3) liquidity for "
        "employees and early investors. Our business metrics support the public "
        "market scrutiny.",
    ),
]

# (category, target_pct, description)
ALLOCATION_RULES: list[tuple[str, float, str]] = [
    (
        "Long-Term Institutional (Tier 1)",
        55.0,
        "Mutual funds, pension funds, and sovereign wealth funds with 3+ year "
        "hold periods. Priority allocation. Target: Fidelity, T. Rowe, Wellington.",
    ),
    (
        "Growth and Crossover Funds (Tier 2)",
        18.0,
        "Hedge funds and crossover investors who participated in late-stage "
        "private rounds and expressed strong conviction in roadshow meetings.",
    ),
    (
        "Retail and Wealth Management",
        12.0,
        "Retail brokerage and private wealth clients of underwriting syndicate. "
        "Allocated through lead underwriter retail desk.",
    ),
    (
        "Strategic Investors",
        8.0,
        "Existing enterprise customers, partners, or strategic corporates who "
        "participated in directed share program (DSP).",
    ),
    (
        "Management and Employees (DSP)",
        7.0,
        "Directed share program for company employees and directors. "
        "Subject to lock-up and regulatory limits.",
    ),
]
