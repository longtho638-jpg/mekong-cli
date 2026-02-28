# VIBE Ecosystem SDK

8 Planets architecture reference cho AgencyOS VIBE unified package.

## Khi nào dùng

- Implement feature trong bất kỳ vibe-* package
- Thêm planet mới vào VIBE ecosystem
- Tích hợp cross-planet (VD: vibe-agents gọi vibe-analytics)
- Debug dependency issues giữa packages

## 8 Planets Model

| Planet | Package | Export Path | Domain | Status |
|--------|---------|-------------|--------|--------|
| Mercury | `@agencyos/vibe-ui` | `@agencyos/vibe/ui` | React + TailwindCSS + Framer Motion | Active |
| Venus | `@agencyos/vibe-analytics` | `@agencyos/vibe/analytics` | web-vitals telemetry | Active |
| Saturn | `@agencyos/vibe-agents` | `@agencyos/vibe/agents` | Google Generative AI agents | Active |
| Jupiter | `@agencyos/vibe-crm` | `@agencyos/vibe/crm` | Sales & CRM layer | Active |
| Mars | `@agencyos/vibe-ops` | `@agencyos/vibe/ops` | DevOps & deployment | Planned |
| Neptune | `@agencyos/vibe-dev` | `@agencyos/vibe/dev` | Development workflow | Planned |
| Uranus | `@agencyos/vibe-marketing` | `@agencyos/vibe/marketing` | Marketing & content | Planned |
| Pluto | `@agencyos/vibe-revenue` | `@agencyos/vibe/revenue` | Finance & revenue | Planned |

## Hub Package Pattern

```typescript
// Hub: packages/vibe/index.ts — re-exports all planets
// Import toàn bộ ecosystem qua 1 package
import { Button } from '@agencyos/vibe/ui';
import { trackEvent } from '@agencyos/vibe/analytics';
import { AgentRunner } from '@agencyos/vibe/agents';
import { LeadPipeline } from '@agencyos/vibe/crm';
```

## Dependency Rules

```
vibe-ui ──────────┐
vibe-analytics ───┤
vibe-crm ─────────┼──> @agencyos/shared (foundation)
vibe-agents ──────┤
vibe-ops ─────────┘
```

- Planets KHÔNG được phụ thuộc lẫn nhau (no circular deps)
- Tất cả phụ thuộc `@agencyos/shared` (foundation)
- Dùng `workspace:*` protocol cho version management
- TypeScript strict mode bắt buộc

## Companion Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-bridge` | Bridge FE ↔ BE agentic infrastructure |
| `@agencyos/vibe-money` | Revenue/payment workflows |

## File Locations

- Hub: `packages/vibe/`
- Planets: `packages/vibe-*/`
- Shared: `packages/shared/`
- Build: `pnpm --filter @agencyos/vibe build`
