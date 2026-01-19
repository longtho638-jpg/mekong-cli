# 🏯 ANTIGRAVITY IDE - Pure Workflow

> **Goal:** Everything from this IDE. No browser tabs. No copy-paste.

---

## 🌅 Morning Routine (09:00)

Open terminal in IDE -> Run:

```bash
python3 scripts/morning.py
```

This does:

1. Git pull
2. Run tests
3. Show product stats
4. Generate tweet drafts
5. Show revenue

---

## 🐦 Post to Twitter

### Option A: API (Zero-Touch)

```bash
# Set keys in .env first
python3 scripts/twitter_poster.py --post
```

### Option B: Preview in IDE

```bash
python3 scripts/twitter_poster.py
# Then use browser_subagent if needed
```

---

## 📦 Publish to Gumroad

```bash
# List products
python3 scripts/gumroad_publisher.py --list

# Publish specific product
python3 scripts/gumroad_publisher.py products/ai-skills-pack
```

---

## 💰 Track Revenue

```bash
# View dashboard
python3 scripts/revenue_tracker.py

# Add sale
python3 scripts/revenue_tracker.py add 47 gumroad "First sale!"
```

---

## 🩺 Health Check

```bash
python3 scripts/health.py
```

---

## 🎯 Daily Commands Summary

| Time  | Command                      | Purpose      |
| ----- | ---------------------------- | ------------ |
| 09:00 | `morning.py`                 | Start day    |
| 09:30 | `twitter_poster.py --post`   | Post content |
| 10:00 | `gumroad_publisher.py`       | Publish      |
| EOD   | `revenue_tracker.py add ...` | Track sale   |

---

_Updated: 2026-01-17_
