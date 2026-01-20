# 🏯 ANTIGRAVITY IDE - Pure Workflow

> **Goal:** Everything from this IDE. No browser tabs. No copy-paste.

---

## 🌅 Morning Routine (09:00)

Open terminal in IDE -> Run:

```bash
python3 scripts/legacy/morning.py
```

*Note: This legacy script handles the full sequential pipeline including git operations.*

---

## 🐦 Post to Twitter

### Option A: mekong CLI (Recommended)

```bash
mekong content generate tweet --product agencyos
```

### Option B: API (Zero-Touch Legacy)

```bash
python3 scripts/legacy/twitter_poster.py --post
```

---

## 📦 Publish to Gumroad

```bash
# List products
mekong sales products-list

# Build product ZIP
mekong sales products-build <product-key>

# Publish to Gumroad
mekong sales products-publish --execute
```

---

## 💰 Track Revenue

```bash
# View report
mekong revenue report

# Add sale (Legacy)
python3 scripts/legacy/revenue_tracker.py add 47 gumroad "First sale!"
```

---

## 🩺 Health Check

```bash
mekong ops health
```

---

## 🎯 Daily Commands Summary

| Time  | Command                              | Purpose      |
| ----- | ------------------------------------ | ------------ |
| 09:00 | `scripts/legacy/morning.py`          | Start day    |
| 09:30 | `mekong content generate tweet`      | Post content |
| 10:00 | `mekong sales products-publish`      | Publish      |
| EOD   | `mekong revenue report`              | Track status |


---

_Updated: 2026-01-17_
