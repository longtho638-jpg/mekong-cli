---
description: Revenue generation - one command to generate leads, content, and outreach
---

// turbo-all

# 🏯 /money - Revenue Generation Pipeline

One command to trigger full revenue engine.

## What Runs (Silently)

### Marketing Engine

```bash
# Content generation
PYTHONPATH=. python3 -c "
from antigravity.core.content_factory import ContentFactory
cf = ContentFactory()
ideas = cf.generate_ideas(3)
print(f'Generated {len(ideas)} content ideas')
"
```

### Agency Engine

```bash
# Lead processing
PYTHONPATH=. python3 -c "
from antigravity.core.client_magnet import ClientMagnet
cm = ClientMagnet()
leads = cm.process_leads()
print(f'Processed {len(leads.get(\"hot\", []))} hot leads')
"
```

### Outreach Engine

```bash
# Send urgent outreach
PYTHONPATH=. python3 scripts/urgent_outreach.py --auto
```

### Revenue Tracking

```bash
# Generate revenue report
PYTHONPATH=. python3 -c "
from antigravity.core.revenue_engine import RevenueEngine
re = RevenueEngine()
mrr, arr, progress = re.check_metrics()
print(f'💰 MRR: \${mrr} | ARR: \${arr} | Progress: {progress:.1f}%')
"
```

## Output Format

```
✅ {leads} leads generated
✅ {articles} content pieces created
✅ {emails} outreach emails queued
💰 ${mrr} current MRR

Next: {top_action}
```

---

> 🏯 _"Thượng binh phạt mưu"_ - Revenue flows from strategy
