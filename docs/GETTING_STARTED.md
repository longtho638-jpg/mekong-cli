# 🚀 AntigravityKit Quick Start

> **Dễ như ăn kẹo** - Easy as candy
> For AgencyEr solo agency owners

---

## ⚡ 5-Minute Setup

```bash
# 1. Clone and install
git clone [repo]
cd mekong-cli-new
pip install -r requirements.txt

# 2. Test everything works
mekong test:wow

# 3. Start developing
mekong cook
```

That's it! You're ready to earn $.

---

## 🎮 No-Prompt Commands

Just type these in your IDE terminal. No prompts needed!

### Development
| Command | What it does |
|---------|-------------|
| `/cook` | Start dev server |
| `/cook:fast` | Fast mode (skip type check) |
| `/cook:backend` | Python only |
| `/cook:frontend` | Next.js only |

### Testing
| Command | What it does |
|---------|-------------|
| `/test` | Run all tests |
| `/test:wow` | AntigravityKit WOW tests |
| `/test:coverage` | Generate coverage |

### Deployment
| Command | What it does |
|---------|-------------|
| `/ship "msg"` | Commit + Push + Deploy |
| `/ship:staging` | Deploy to staging |
| `/ship:prod` | Deploy to production |

### Sync
| Command | What it does |
|---------|-------------|
| `/antigravity-sync` | Sync with latest kit |
| `/version` | Check versions |

---

## 📦 Core Modules

### AgencyDNA 🧬
Your agency identity.
```python
from antigravity.core.agency_dna import AgencyDNA, Tone

dna = AgencyDNA(
    name="My Agency",
    niche="Nông sản",
    tone=Tone.MIEN_TAY
)
print(dna.get_tagline())
# → "Chuyên gia Nông sản - Đậm chất Miền Tây"
```

### ClientMagnet 🧲
Generate and convert leads.
```python
from antigravity.core.client_magnet import ClientMagnet

magnet = ClientMagnet()
lead = magnet.add_lead("ABC Corp")
magnet.qualify_lead(lead, budget=5000, score=85)
client = magnet.convert_to_client(lead)
```

### RevenueEngine 💰
Track MRR, ARR, invoices.
```python
from antigravity.core.revenue_engine import RevenueEngine

engine = RevenueEngine()
inv = engine.create_invoice("Client A", 1500)
engine.mark_paid(inv)
print(f"MRR: ${engine.get_mrr()}")
```

### ContentFactory 🎨
Generate 30+ content ideas.
```python
from antigravity.core.content_factory import ContentFactory

factory = ContentFactory(niche="Nông sản")
ideas = factory.generate_ideas(30)
# → 30 ideas with virality scores
```

---

## 📊 VC Readiness

Check your startup metrics:
```python
from antigravity.vc.metrics import VCMetrics

metrics = VCMetrics(
    mrr=50000,
    growth_rate=15,
    cac=200,
    ltv=2400
)

print(f"LTV/CAC: {metrics.ltv_cac_ratio():.1f}x")
print(f"Rule of 40: {metrics.rule_of_40():.0f}%")
print(f"Readiness: {metrics.readiness_score()}/100")
```

---

## 🏢 Franchise Network

Expand with territory rights:
```python
from antigravity.franchise.manager import FranchiseManager, Territory

manager = FranchiseManager()
f = manager.add_franchisee("Anh Minh", territory=Territory.CAN_THO)
manager.record_revenue(f, 10000)
# → $2,000 royalty (20%)
```

---

## 🔄 Daily Workflow

```bash
# Morning
mekong test:wow        # Verify everything works

# Development
mekong cook            # Start coding

# End of day
mekong ship "feat: new feature"  # Deploy
```

---

## 🏯 Binh Pháp Wisdom

> **"Không đánh mà thắng"**
> Win Without Fighting

The platform wins by:
- Network effects (users bring users)
- Data moat (AI improves continuously)
- Community (users create content)

---

## 🆘 Need Help?

1. Run `/test:wow` to check system status
2. Check API docs: http://localhost:8000/docs
3. Sync latest: `/antigravity-sync`

---

**Ready to earn $?** Start with `/cook` 🚀
