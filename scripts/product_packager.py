#!/usr/bin/env python3
"""
📦 Product Packager - Prepare products for Gumroad
===================================================

Standardizes all products for sale:
- Creates/updates README.md
- Adds LICENSE file
- Generates product metadata
- Creates zip packages

Usage:
    python3 scripts/product_packager.py
"""

from datetime import datetime
from pathlib import Path

PRODUCTS_DIR = Path(__file__).parent.parent / "products"


# Product catalog with prices
PRODUCT_CATALOG = {
    "vscode-starter-pack": {
        "name": "VSCode Starter Pack",
        "price": 0,
        "tagline": "Free settings, extensions & snippets for developers",
        "features": ["50+ snippets", "Recommended extensions", "Optimized settings"],
    },
    "ai-skills-pack": {
        "name": "AI Skills Pack",
        "price": 27,
        "tagline": "AI development skills and prompts collection",
        "features": ["Gemini integration", "Claude prompts", "Sequential thinking"],
    },
    "auth-starter-supabase": {
        "name": "Auth Starter (Supabase)",
        "price": 27,
        "tagline": "Complete authentication boilerplate with Supabase",
        "features": ["OAuth ready", "Role-based access", "TypeScript"],
    },
    "api-boilerplate-fastapi": {
        "name": "FastAPI Starter",
        "price": 37,
        "tagline": "Production-ready FastAPI template",
        "features": ["Async support", "Pydantic models", "Docker ready"],
    },
    "landing-page-kit": {
        "name": "Landing Page Kit",
        "price": 37,
        "tagline": "High-converting landing page templates",
        "features": ["5+ templates", "Responsive design", "Conversion optimized"],
    },
    "admin-dashboard-lite": {
        "name": "Admin Dashboard Lite",
        "price": 47,
        "tagline": "Modern admin dashboard starter",
        "features": ["React/Next.js", "Chart components", "Dark mode"],
    },
    "admin-dashboard-pro": {
        "name": "Admin Dashboard Pro",
        "price": 97,
        "tagline": "Full-featured admin dashboard",
        "features": ["All Lite features", "Real-time updates", "API integration"],
    },
    "vietnamese-agency-kit": {
        "name": "Vietnamese Agency Kit",
        "price": 67,
        "tagline": "Localized templates for Vietnamese market",
        "features": ["VibeTuning", "Regional content", "Payment integrations"],
    },
    "agencyos-pro": {
        "name": "AgencyOS Pro",
        "price": 197,
        "tagline": "Complete agency automation system",
        "features": ["All templates", "CLI tools", "Binh Pháp framework"],
    },
    "agencyos-enterprise": {
        "name": "AgencyOS Enterprise",
        "price": 497,
        "tagline": "Enterprise agency solution + priority support",
        "features": ["All Pro features", "1-on-1 onboarding", "Priority support"],
    },
}


def generate_readme(product_id: str) -> str:
    """Generate standardized README for product."""
    info = PRODUCT_CATALOG.get(
        product_id,
        {
            "name": product_id.replace("-", " ").title(),
            "price": 0,
            "tagline": "BillMentor product",
            "features": [],
        },
    )

    price_display = "FREE" if info["price"] == 0 else f"${info['price']}"
    features_md = "\n".join([f"- ✅ {f}" for f in info["features"]])

    return f"""# 🏯 {info["name"]}

> **{info["tagline"]}**
> **Price:** {price_display}

---

## ✨ Features

{features_md}

---

## 🚀 Quick Start

```bash
# Extract and navigate
cd {product_id}

# Follow setup instructions
cat SETUP.md
```

---

## 📦 What's Included

```
{product_id}/
├── README.md          # This file
├── LICENSE            # MIT License
└── ...                # Product files
```

---

## 🎯 Use Cases

1. **Solopreneurs** - Build faster, ship sooner
2. **Agencies** - Scale operations efficiently
3. **Startups** - Validate ideas quickly

---

## 💬 Support

- **Email:** billwill.mentor@gmail.com
- **Store:** [billmentor.gumroad.com](https://billmentor.gumroad.com)

---

## 📜 License

MIT License - use freely in personal and commercial projects.

---

_Made with ❤️ by BillMentor | Powered by Binh Pháp Framework_
"""


def generate_license() -> str:
    """Generate MIT license."""
    year = datetime.now().year
    return f"""MIT License

Copyright (c) {year} BillMentor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""


def package_product(product_id: str) -> dict:
    """Package a single product."""
    product_path = PRODUCTS_DIR / product_id

    if not product_path.is_dir():
        return {"product": product_id, "status": "skip", "reason": "not a directory"}

    # Skip node_modules and other non-product dirs
    skip_dirs = ["node_modules", "thumbnails", ".git", "__pycache__"]
    if product_id in skip_dirs:
        return {"product": product_id, "status": "skip", "reason": "excluded"}

    results = {"product": product_id, "status": "ok", "updates": []}

    # Generate README
    readme_path = product_path / "README.md"
    if not readme_path.exists() or readme_path.stat().st_size < 500:
        readme_content = generate_readme(product_id)
        readme_path.write_text(readme_content)
        results["updates"].append("README.md created")

    # Add LICENSE if missing
    license_path = product_path / "LICENSE"
    if not license_path.exists():
        license_path.write_text(generate_license())
        results["updates"].append("LICENSE added")

    return results


def package_all() -> list:
    """Package all products."""
    results = []

    for item in PRODUCTS_DIR.iterdir():
        if item.is_dir():
            result = package_product(item.name)
            results.append(result)

            if result["status"] == "ok" and result["updates"]:
                print(f"✅ {result['product']}: {', '.join(result['updates'])}")
            elif result["status"] == "skip":
                print(f"⏭️  {result['product']}: skipped ({result['reason']})")

    return results


if __name__ == "__main__":
    print("📦 Product Packager - BillMentor")
    print("=" * 40)
    print()

    results = package_all()

    updated = [r for r in results if r["status"] == "ok" and r.get("updates")]
    skipped = [r for r in results if r["status"] == "skip"]

    print()
    print(f"📊 Summary: {len(updated)} updated, {len(skipped)} skipped")
    print()
    print(
        "💰 Total catalog value:",
        sum(p["price"] for p in PRODUCT_CATALOG.values()),
        "USD",
    )
