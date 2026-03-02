# UI/UX Design Report: AGI Trader RaaS Dashboard

**Date:** 2026-03-02 | **Agent:** ui-ux-designer

## Deliverables

| File | Lines | Status |
|------|-------|--------|
| `docs/design-guidelines.md` | 115 | Created (limit 150) |
| `docs/wireframes/dashboard.html` | 198 | Created (limit 300) |
| `docs/wireframes/api-docs.html` | 199 | Created (limit 200) |

## Design Decisions

### Color System
- Dark-first palette anchored on `#0d1117` (GitHub dark) with three surface tiers
- Profit green `#00d4aa` / loss red `#ff4757` as semantic colors -- never decorative
- Blue accent `#58a6ff` for interactive elements, purple `#8b5cf6` for info badges
- All colors pass WCAG AA on dark backgrounds

### Typography
- **Inter** for UI (widely available, excellent x-height for small sizes)
- **JetBrains Mono** for all numerical/financial data and code blocks
- Using `system-ui` fallback chain -- no mandatory Google Fonts load for trading latency

### Layout Architecture (Dashboard)
- Fixed 220px sidebar with collapsible nav grouped by domain (Overview, Trading, Arbitrage, System)
- 48px sticky header with exchange health badges + alert count
- 4-col stat cards row -> 2-col grid (equity chart + strategies) -> 2-col grid (positions table + alerts) -> full-width recent trades
- Responsive: 2-col at 1024px, single-col at 768px, sidebar hidden at 768px

### Dashboard Content
- **Stats row:** Total equity, open positions, today P&L, active strategies
- **Equity curve panel:** Time-range selector (1D/1W/1M/ALL), placeholder for TradingView Lightweight Charts
- **Active strategies:** Status dots (running/paused/stopped) with per-strategy P&L badges
- **Positions table:** Full trade data with side badges (LONG/SHORT/ARB), monospace numbers
- **Alert panel:** Categorized by type (FILLED, SIGNAL, SPREAD, STOP, SYSTEM) with UTC timestamps
- **Footer:** Engine status, latency, uptime, API/WebSocket connection status

### API Docs Page
- Sidebar navigation with HTTP method color tags (GET=green, POST=blue, PUT=yellow, DEL=red, WS=purple)
- Endpoint cards with collapsible headers showing method + path + description + auth badge
- Parameter tables with name/type/description/required fields
- Syntax-highlighted JSON code blocks
- Categories: Tenants, Strategies, Trades, Backtests, WebSocket

## Design Intelligence Sources
- **Product pattern:** Financial Dashboard (dark bg + red/green alerts + trust blue)
- **Style:** Dark Mode OLED (WCAG AAA, low white emission, high readability)
- **Typography:** Dashboard Data pairing (mono + sans cohesion)
- **Color:** Fintech/Crypto palette (dark tech + vibrant accents)

## Tech Notes
- All wireframes use inline CSS, zero external dependencies
- Flexbox/Grid layout -- no JS required for structure
- Chart areas are placeholder divs annotated with suggested library (TradingView Lightweight / Recharts)
- Mock data reflects real AGI Trader entities (strategies, pairs, exchanges from README)

## Unresolved Questions
- Should sidebar collapse to icon-only (56px) on medium screens, or use a hamburger toggle?
- Which chart library for production: TradingView Lightweight Charts (free, canvas) vs Recharts (React, SVG)?
- Is a light mode variant ever needed, or is dark-only the final decision?
- Should the API docs page be a standalone static site or integrated into the dashboard SPA?
