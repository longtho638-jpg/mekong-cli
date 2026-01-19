---
description: Schedule and publish social media posts
---

# /marketing/social - Social Media Manager

> **Schedule posts across Twitter, LinkedIn, Facebook**

## Schedule Post

```bash
python3 scripts/legacy/social_scheduler.py --schedule \
  --platform twitter \
  --content "Just shipped new features!" \
  --time "2026-01-21 09:00"
```

## Platforms

| Platform  | Status    |
| --------- | --------- |
| Twitter/X | ✅        |
| LinkedIn  | ✅        |
| Facebook  | ⚠️ Coming |

## Auto-Post from Git

// turbo

```bash
python3 scripts/legacy/git_to_tweet.py
```

## 🏯 Binh Pháp

> "Thiên thời" - Right timing, right platform, right message.
