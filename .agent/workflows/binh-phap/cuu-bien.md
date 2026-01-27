---
description: 九變 - Adaptation, Feature Flags, and Experimentation
---

# 🏯 Chapter 8: Cửu Biến (九變)

> **"Tùy cơ ứng biến"** - Adapt to circumstances

## Philosophy

There are roads not to follow, armies not to strike, cities not to besiege. The wise general adapts to circumstances. Flexibility is strength.

## When to Use

- Feature flags
- A/B testing
- Pivot decisions
- Experiment design

## Steps

### Step 1: Adaptation Assessment

// turbo

```bash
# Check what needs adaptation
cat << 'EOF'
## Adaptation Triggers

| Signal | Status | Action |
|--------|--------|--------|
| User feedback | ___ | ___ |
| Metrics declining | ___ | ___ |
| Market shift | ___ | ___ |
| Competitor move | ___ | ___ |
EOF
```

### Step 2: Feature Flag Strategy

// turbo

```bash
# Feature flag configuration
cat << 'EOF'
## Feature Flags

| Flag | Status | Rollout | Criteria |
|------|--------|---------|----------|
| new_ui | ___ | __% | ___ |
| dark_mode | ___ | __% | ___ |
| beta_api | ___ | __% | ___ |
EOF
```

### Step 3: Experiment Design

// turbo

```bash
# A/B test framework
cat << 'EOF'
## Experiment Template

**Hypothesis**: If we [change], then [outcome]
**Metric**: [What we measure]
**Duration**: [How long]
**Sample Size**: [How many users]
**Control**: [Default behavior]
**Treatment**: [New behavior]
EOF
```

## Related Commands

- `/pivot` - Pivot analysis
- `/experiment` - Run experiments
- `/flags` - Feature flag management

## Related IPO Tasks

- IPO-034-Feature-Flags (Adaptation layer)

## Binh Pháp Wisdom

> **"水無常形，兵無常勢"**
> Water has no constant shape, warfare has no constant form.

---

_AgencyOS | Binh Pháp Chapter 8 | Cửu Biến_
