---
description: 🎨 Generate viral content ideas with virality scoring
argument-hint: [count=30]
---

## Mission

Generate viral content ideas using AntigravityKit's content factory.

## Workflow

1. **Parse Arguments**
   - Count: `$ARGUMENTS` or default 30

2. **Load Agency Context**
   - Read `.antigravity/agency_dna.json` for niche

3. **Delegate to Agent**
   - Use `content-factory` agent for idea generation

4. **Execute Python**
   ```bash
   python -c "
   from antigravity.core.content_factory import ContentFactory
   factory = ContentFactory(niche='$NICHE')
   ideas = factory.generate_ideas(count=$COUNT)
   print('📝 Top Ideas by Virality Score:')
   for i, idea in enumerate(ideas[:10], 1):
       print(f'{i:2}. [{idea.score:3}] {idea.title}')
   print(f'\\n✅ Generated {len(ideas)} ideas')
   print(f'📊 Avg score: {sum(i.score for i in ideas)/len(ideas):.0f}')
   "
   ```

5. **Save Output**
   - Store in `.antigravity/content_ideas.json`

## Output

Report:
- Top 10 ideas with scores
- Average virality score
- File path for all ideas

---

🎨 **"Nội dung hay, khách hàng say"** - Great content, happy customers
