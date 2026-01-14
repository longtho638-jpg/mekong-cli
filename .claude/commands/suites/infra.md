---
description: 🏗️ Infra Command - Actual Full Stack Infrastructure
argument-hint: [:status|:layers|:presets|:detail]
---

## Mission

Manage the ACTUAL 10-layer full stack infrastructure.
Not just Frontend + Backend, but ALL enterprise layers.

## The 10 Layers

| # | Layer | Provider | Purpose |
|---|-------|----------|---------|
| 1 | 🗄️ Database | Supabase | PostgreSQL + RLS |
| 2 | 🖥️ Server | Vercel Edge | Next.js runtime |
| 3 | 🌐 Networking | Cloudflare | DNS + SSL |
| 4 | ☁️ Cloud | Vercel + Supa | Infrastructure |
| 5 | 🔄 CI/CD | GitHub Actions | Auto deploy |
| 6 | 🔒 Security | Multi-layer | Auth + WAF |
| 7 | 📊 Monitoring | Vercel Analytics | APM + Logs |
| 8 | 📦 Containers | Serverless | Edge functions |
| 9 | ⚡ CDN | Vercel Edge | Global cache |
| 10 | 💾 Backup | Auto | Daily backups |

## Subcommands

| Command | Description |
|---------|-------------|
| `/infra` | Full status |
| `/infra:status` | Quick health check |
| `/infra:layers` | List all layers |
| `/infra:presets` | Compare starter/growth/enterprise |
| `/infra:detail database` | Layer detail |

## Quick Examples

```bash
/infra                     # Full dashboard
/infra:presets             # Compare stack options
/infra:detail security     # Security layer detail
```

## Stack Presets

| Preset | Cost | Best For |
|--------|------|----------|
| Starter | $0-50/mo | MVP, side projects |
| Growth | $100-500/mo | Scaling startups |
| Enterprise | $1000+/mo | Large teams |

## Python Integration

```python
# turbo
from antigravity.core.infrastructure import InfrastructureStack

stack = InfrastructureStack()
stack.print_status()

# Check health
print(f"Health: {stack.get_health_score()}%")

# Layer detail
stack.print_layer_detail(StackLayer.SECURITY)
```

## Status Output

```
🏗️ ACTUAL FULL STACK INFRASTRUCTURE

📋 STACK LAYERS (10/10):

   🗄️ DATABASE
      🔵 Supabase
   🖥️ SERVER
      🔵 Vercel Edge
   🌐 NETWORKING
      🔵 Cloudflare
   ...

   🏆 HEALTH SCORE: 90%
   ✅ PRODUCTION READY
```

---

🏗️ **Actual Full Stack = 10 layers. Not just FE+BE.**
