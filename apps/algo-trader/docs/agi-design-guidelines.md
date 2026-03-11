# Design Guidelines: AGI OpenClaw SOPs

**Date:** 2026-03-11
**Version:** 1.0

---

## Visual Style

### Typography
| Element | Font | Size | Weight |
|---------|------|------|--------|
| SOP Title | Inter | 24px | 700 |
| Section | Inter | 18px | 600 |
| Body | Inter | 14px | 400 |
| Code | JetBrains Mono | 13px | 400 |

### Colors
| Use | Light | Dark |
|-----|-------|------|
| Background | #FFFFFF | #0F0F0F |
| Primary | #3B82F6 | #60A5FA |
| Success | #10B981 | #34D399 |
| Warning | #F59E0B | #FBBF24 |
| Danger | #EF4444 | #F87171 |
| Text | #1F2937 | #F3F4F6 |

### Spacing
- Base unit: 4px
- Section padding: 24px
- Component gap: 16px
- Inline gap: 8px

---

## SOP Card Layout

```
┌─────────────────────────────────────────────────────┐
│ 🤖 AGI Signal Agent SOP                    [Status] │
├─────────────────────────────────────────────────────┤
│ Purpose: Analyze market signals using LLM          │
│                                                    │
│ ┌─────────────────────────────────────────────┐   │
│ │ TRIGGERS (3)                                │   │
│ │ • RSI > 70 or RSI < 30                     │   │
│ │ • MACD crossover detected                   │   │
│ │ • Volume spike > 2σ                         │   │
│ └─────────────────────────────────────────────┘   │
│                                                    │
│ ┌─────────────────────────────────────────────┐   │
│ │ DECISION FLOW                               │   │
│ │ 1. Check rules → IF match → Execute        │   │
│ │ 2. IF unclear → LLM analysis               │   │
│ │ 3. IF confidence < 0.6 → Human review      │   │
│ └─────────────────────────────────────────────┘   │
│                                                    │
│ Metrics: 87% win rate | 234 trades | -2.1% DD    │
└─────────────────────────────────────────────────────┘
```

---

## Status Indicators

| Status | Color | Icon |
|--------|-------|------|
| Active | Green | 🟢 |
| Paused | Yellow | 🟡 |
| Stopped | Red | 🔴 |
| Testing | Blue | 🔵 |

---

## Decision Flow Visualization

```
Signal In → Rules Check → Match? → Yes → Execute
                           ↓ No
                      LLM Analysis
                           ↓
                    Confidence ≥ 0.6?
                      ↓ Yes    ↓ No
                   Execute   Human Review
```

---

## SOP Sections

1. **Header** — Name, status, last updated
2. **Purpose** — One sentence why it exists
3. **Scope** — What it controls
4. **Triggers** — When it activates (bullets)
5. **Inputs** — Data sources (table)
6. **Decision Flow** — Flowchart + IF-THEN rules
7. **Actions** — What it executes
8. **Safety** — Kill switches, circuit breakers
9. **Metrics** — Win rate, trades, drawdown
10. **Escalation** — When to notify human

---

## Interactive Elements

### Buttons
| Action | Style |
|--------|-------|
| Enable | Primary (blue) |
| Pause | Warning (yellow) |
| Stop | Danger (red) |
| Edit | Secondary (gray) |
| View Logs | Link (blue) |

### Forms
- Input fields: 40px height
- Labels: 12px, 600 weight, uppercase
- Validation: Red border + message below

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | <640px | Single column |
| Tablet | 640-1024px | 2 columns |
| Desktop | >1024px | 3 columns |

---

## Accessibility

- Contrast ratio: ≥ 4.5:1 (AA)
- Font size: Minimum 14px
- Focus states: 2px outline
- ARIA labels: All interactive elements

---

## Code Display

```typescript
// SOP Definition Example
export const SignalSOP: SOP = {
  id: 'agi-signal-001',
  triggers: ['rsi_extreme', 'macd_crossover'],
  minConfidence: 0.6,
  safety: {
    maxDrawdown: 0.05,
    consecutiveLosses: 3
  }
};
```

---

**Status:** Draft
**Review:** After implementation
