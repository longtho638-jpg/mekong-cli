---
description: 📊 Show agency dashboard and stats
argument-hint: 
---

## Mission

Display comprehensive agency stats and dashboard.

## Workflow

1. **Load Agency Data**
   - Read `.antigravity/agency_dna.json`
   - Read `.antigravity/content_ideas.json`

2. **Delegate to Agents**
   - Use `revenue-engine` for financial stats
   - Use `client-magnet` for client stats

3. **Execute Python**
   ```bash
   python -m antigravity.cli stats
   ```

4. **Display Dashboard**

```
╔═══════════════════════════════════════════════════════════╗
║  📊 ANTIGRAVITYKIT DASHBOARD                              ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  🏢 Agency: [Name]                                        ║
║  🎯 Niche: [Niche]                                        ║
║  📍 Location: [Location]                                  ║
║  📦 Services: [count]                                     ║
║                                                           ║
║  📝 Content Ideas: [count]                                ║
║  📊 Avg Virality: [score]/100                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## Output

Full dashboard with:
- Agency info
- Service count
- Content stats
- Recent activity

---

📊 **"Biết mình biết ta, trăm trận trăm thắng"** - Know yourself, know your enemy
