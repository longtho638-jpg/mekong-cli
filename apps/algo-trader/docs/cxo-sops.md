# CXO SOPs — Standard Operating Procedures

> Chief Experience Officer — UX trader experience, CLI usability, A2UI quality, onboarding flow.

---

## SOP-X01: Trader Experience Audit

| Touchpoint | Check | Target |
|------------|-------|--------|
| First install | `pnpm install` clean? | <60s, 0 errors |
| First backtest | `/trading:auto BTC/USDT backtest` | Works first try |
| CLI output | Readable, colored, structured? | Rich formatting |
| Error messages | Actionable, clear? | No cryptic errors |
| A2UI events | Real-time feedback? | Events streaming |
| Reports | Useful, scannable? | <100 lines |

## SOP-X02: A2UI Quality Standards

| Event Type | UX Requirement |
|------------|---------------|
| INTENT_PREVIEW | Show WHAT bot will do BEFORE doing it |
| SIGNAL_RATIONALE | Explain WHY signal fired |
| CONFIDENCE_UPDATE | Real-time confidence % |
| TRADE_EXECUTED | Instant confirmation + details |
| RISK_ALERT | Prominent, cannot miss |
| AUTONOMY_CHANGE | Explain level change + reason |

## SOP-X03: Onboarding Funnel

```
Install → First backtest → Paper trade → Live trade
  ↓ friction points to minimize:
  - Config complexity
  - API key setup
  - Strategy selection
  - Risk parameter confusion
```

## SOP-X04: CXO Checklist (Monthly)

```
□ Run full onboarding flow as new user
□ Audit CLI output readability
□ Check error message quality
□ A2UI event coverage
□ Command discoverability (/trading --help)
□ Documentation accuracy vs actual behavior
```

---

*SOPs v1.0 — 2026-03-03*
