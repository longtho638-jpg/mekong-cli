---
description: "Create new portfolio company with OpenClaw CTO instance. 1 command, ~5 min."
argument-hint: [company-name --sector=ai --stage=idea --equity=30]
allowed-tools: Read, Write, Bash, Task
---

# /portfolio:create — Create Portfolio Company

## Goal

Create a new portfolio company in the studio, initialize its data structure, and assign an OpenClaw CTO instance.

## Steps

1. Load studio data from .mekong/studio/config.yaml
2. Validate company name uniqueness against .mekong/studio/portfolio/index.json
3. Create company directory: .mekong/studio/portfolio/{company-slug}/
4. Generate profile.json, cap-table.json, metrics.json, team.json, openclaw.yaml
5. Update portfolio index with new company entry
6. Run initial health score calculation via Five Factors
7. Output company card with key details

## Output Format

CLI table with company profile summary + confirmation message.

```
🏢 Portfolio Company Created
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name    : {name}
Slug    : {slug}
Sector  : {sector}
Stage   : {stage}
Equity  : {equity}%
CTO     : OpenClaw assigned ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Goal context

<goal>$ARGUMENTS</goal>
