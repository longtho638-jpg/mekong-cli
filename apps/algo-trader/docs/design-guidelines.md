# Design Guidelines - AGI Trader RaaS Platform

## Brand Personality
Professional, data-rich, trustworthy. Bloomberg Terminal density meets TradingView clarity.
Target: retail crypto traders, quant devs, prop trading firms.

## Color Palette (Dark Trading Theme)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0d1117` | Page background |
| `--bg-secondary` | `#161b22` | Card/panel background |
| `--bg-tertiary` | `#1c2333` | Elevated surfaces, hover |
| `--border` | `#30363d` | Borders, dividers |
| `--border-active` | `#484f58` | Focus/active borders |
| `--text-primary` | `#e6edf3` | Headings, primary text |
| `--text-secondary` | `#8b949e` | Labels, descriptions |
| `--text-muted` | `#484f58` | Disabled, placeholder |
| `--profit` | `#00d4aa` | Positive P&L, buy signals |
| `--profit-bg` | `rgba(0,212,170,0.12)` | Profit badge background |
| `--loss` | `#ff4757` | Negative P&L, sell signals |
| `--loss-bg` | `rgba(255,71,87,0.12)` | Loss badge background |
| `--accent` | `#58a6ff` | Links, interactive elements |
| `--warning` | `#d29922` | Alerts, caution states |
| `--info` | `#8b5cf6` | Info badges, strategy tags |

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| UI Headings | `Inter, system-ui, sans-serif` | 600 | 20/16/14px |
| UI Body | `Inter, system-ui, sans-serif` | 400 | 14/13px |
| Data/Numbers | `JetBrains Mono, monospace` | 500 | 14/13/12px |
| Code Blocks | `JetBrains Mono, monospace` | 400 | 13px |
| Labels | `Inter, system-ui, sans-serif` | 500 | 11px uppercase |

**Line heights:** Headings 1.3, Body 1.5, Data 1.4, Code 1.6.

## Spacing System (4px Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `--sp-1` | 4px | Inline gaps, icon margins |
| `--sp-2` | 8px | Tight element spacing |
| `--sp-3` | 12px | Component internal padding |
| `--sp-4` | 16px | Card padding, section gaps |
| `--sp-5` | 20px | Panel padding |
| `--sp-6` | 24px | Major section separators |
| `--sp-8` | 32px | Page-level spacing |

**Border radius:** 4px (inputs), 6px (cards), 8px (modals), 12px (panels).

## Component Patterns

### Cards
Dark surface (`--bg-secondary`), 1px `--border`, 6px radius, 16px padding.
Hover: border shifts to `--border-active`, subtle `translateY(-1px)`.

### Data Tables
Header row: `--bg-tertiary`, 11px uppercase labels, `--text-secondary`.
Rows: `--bg-secondary`, 14px monospace data. Alternate row: `--bg-primary`.
Profit cells green `--profit`, loss cells red `--loss`.

### Stat Badges
Inline pill: 4px/8px padding, 4px radius, 12px monospace text.
Variants: profit (`--profit` + `--profit-bg`), loss (`--loss` + `--loss-bg`),
neutral (`--text-secondary` + `--bg-tertiary`), info (`--info` + info-bg).

### Charts
Background: `--bg-secondary`. Grid lines: `--border` at 0.3 opacity.
Equity curve: `--profit` line, gradient fill to transparent.
Volume bars: `--accent` at 40% opacity. Crosshair: `--text-muted`.

### Sidebar Navigation
Width: 240px collapsed to 56px. Background: `--bg-secondary`.
Active item: `--accent` left border 2px, `--bg-tertiary` background.
Icons: 20px, `--text-secondary`, active: `--text-primary`.

### Buttons
Primary: `--accent` bg, #fff text, 8px/16px padding.
Danger: `--loss` bg, #fff text. Ghost: transparent, `--text-secondary`.
All: 4px radius, 13px font, 500 weight, 150ms transition.

### Status Indicators
Dot: 8px circle. Running: `--profit` + pulse animation.
Stopped: `--loss`. Paused: `--warning`. Idle: `--text-muted`.

## Layout

- **Sidebar + Main** layout. Sidebar fixed left, main scrollable.
- **Header:** 48px height, sticky top. Logo left, nav center, user right.
- **Grid:** CSS Grid for dashboard panels, 12-col for content pages.
- **Breakpoints:** Mobile 640px, Tablet 768px, Desktop 1024px, Wide 1440px.
- **Mobile:** Sidebar collapses to bottom tab bar, cards stack vertically.

## Accessibility

- Color contrast: WCAG AA minimum (4.5:1 text, 3:1 large text).
- Never use color alone for P&L: always include +/- prefix and arrow icons.
- Focus rings: 2px `--accent` outline with 2px offset.
- Reduced motion: disable animations when `prefers-reduced-motion: reduce`.
- Minimum touch target: 44x44px on mobile.

## Chart Color Sequences
For multi-series: `#58a6ff`, `#00d4aa`, `#8b5cf6`, `#d29922`, `#ff4757`, `#f97583`.

## Dark Mode Only
This platform is dark-mode exclusively. No light theme variant planned.
All mockups and implementations must use the dark palette above.

## References
- Bloomberg Terminal (information density)
- TradingView (chart UX, clean layout)
- QuantConnect (strategy management, backtesting UI)
- Binance Pro (trading data display, order books)
