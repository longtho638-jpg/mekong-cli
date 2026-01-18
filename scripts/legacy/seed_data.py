#!/usr/bin/env python3
"""
🌱 SEED DATA - Populate Mission Control
======================================
Injects realistic demo data into ~/.mekong/ to make the
Dashboard look "Alive" and "WOW".
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

# Config
MEKONG_DIR = Path.home() / ".mekong"
LEADS_FILE = MEKONG_DIR / "leads.json"
SALES_FILE = MEKONG_DIR / "sales.log"

LEADS_DATA = [
    {
        "name": "Alex Founder",
        "email": "alex@startup.io",
        "company": "TechStart Inc",
        "stage": "meeting",
    },
    {
        "name": "Sarah Agency",
        "email": "sarah@marketing.co",
        "company": "GrowthX",
        "stage": "replied",
    },
    {
        "name": "Mike Enterprise",
        "email": "mike@bigcorp.com",
        "company": "Big Corp",
        "stage": "new",
    },
    {
        "name": "Jessica Vibe",
        "email": "jess@design.studio",
        "company": "Vibe Studio",
        "stage": "contacted",
    },
    {
        "name": "David Code",
        "email": "david@dev.shop",
        "company": "Dev Shop 99",
        "stage": "closed",
    },
]

SALES_DATA = [
    ("AgencyOS Pro", 197),
    ("AI Skills Pack", 27),
    ("VSCode Starter", 0),
    ("Admin Dashboard Pro", 47),
    ("AgencyOS Enterprise", 497),
]


def seed_leads():
    existing = []
    if LEADS_FILE.exists():
        with open(LEADS_FILE) as f:
            try:
                existing = json.load(f)
            except:
                pass

    # Just append new ones if not exist
    for l in LEADS_DATA:
        if not any(e["email"] == l["email"] for e in existing):
            l["added"] = (
                datetime.now() - timedelta(days=random.randint(0, 5))
            ).isoformat()
            l["last_contact"] = datetime.now().isoformat()
            l["notes"] = "Seeded by Auto-Activator"
            existing.append(l)

    with open(LEADS_FILE, "w") as f:
        json.dump(existing, f, indent=2)
    print(f"✅ Leads seeded: {len(existing)}")


def seed_sales():
    lines = []
    # Generate 10 random sales over last 7 days
    for i in range(10):
        product, price = random.choice(SALES_DATA)
        date = (datetime.now() - timedelta(days=random.randint(0, 7))).strftime(
            "%Y-%m-%d"
        )
        email = f"customer{i}@gmail.com"
        lines.append(f"{date}|{product}|{price}|{email}")

    # Sort by date
    lines.sort()

    with open(SALES_FILE, "a") as f:  # Append
        for line in lines:
            f.write(line + "\n")

    print(f"✅ Sales seeded: {len(lines)}")


def main():
    MEKONG_DIR.mkdir(parents=True, exist_ok=True)
    print("🌱 Seeding Mission Control Data...")
    seed_leads()
    seed_sales()
    print("🚀 DONE. Check your Dashboard!")


if __name__ == "__main__":
    main()
