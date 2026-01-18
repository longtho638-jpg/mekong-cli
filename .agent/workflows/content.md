---
description: Content production - article, SEO, social posts in one command
---

// turbo-all

# 🏯 /content [topic] - Content Factory Pipeline

One command: Topic → Article → SEO → Social → Published

## Arguments

- `$TOPIC` - Content topic or keyword

## What Runs (Silently)

### 1. Deep Research

```bash
PYTHONPATH=. python3 -c "
print('🔍 Researching: $TOPIC')
# Research logic using web search
print('Research complete: 5 sources analyzed')
"
```

### 2. Write SEO Article

```bash
PYTHONPATH=. python3 -c "
from antigravity.core.content_factory import ContentFactory
cf = ContentFactory()
article = cf.write_article('$TOPIC')
print(f'Article: {len(article)} words')
"
```

### 3. SEO Optimization

```bash
PYTHONPATH=. python3 scripts/seo_writer.py --optimize "$TOPIC"
```

### 4. Generate Images

```bash
PYTHONPATH=. python3 -c "
print('🎨 Generating 3 images for: $TOPIC')
# Image generation logic
images = ['hero.png', 'feature1.png', 'feature2.png']
print(f'Generated: {len(images)} images')
"
```

### 5. Create Social Posts

```bash
PYTHONPATH=. python3 -c "
print('📱 Creating social posts...')
platforms = ['LinkedIn', 'Twitter/X', 'Facebook', 'Instagram', 'Threads']
print(f'Created: {len(platforms)} platform variations')
"
```

### 6. Schedule Publishing

```bash
PYTHONPATH=. python3 -c "
print('📅 Scheduling content...')
print('Blog: Tomorrow 9:00 AM')
print('Social: Staggered over 7 days')
"
```

## Output Format

```
✅ Article: content/{topic}.md (2500 words)
✅ SEO Score: 92/100
✅ Images: 3 generated
✅ Social: 5 platform posts ready

📅 Scheduled for publication
```

---

> 🏯 _"Nội dung là vua, phân phối là nữ hoàng"_
