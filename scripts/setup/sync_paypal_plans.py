#!/usr/bin/env python3
"""
Sync PayPal Plans
=================
Creates necessary Products and Plans in PayPal for the application.
Idempotent-ish: Checks if product exists by name before creating.

Usage:
    python scripts/setup/sync_paypal_plans.py
"""

import sys
import os
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from core.finance.paypal_sdk import PayPalSDK

def sync_plans():
    print("🔄 Syncing PayPal Products and Plans...")
    sdk = PayPalSDK()

    if not sdk.client_id:
        print("❌ PAYPAL_CLIENT_ID not set in .env")
        return

    # 1. Define Product
    product_name = "AgencyOS Subscription"
    product_id = None

    # List existing products to find match
    existing_products = sdk.catalog.list_products()
    if existing_products and "products" in existing_products:
        for p in existing_products["products"]:
            if p["name"] == product_name:
                product_id = p["id"]
                print(f"✅ Found existing product: {product_name} ({product_id})")
                break

    if not product_id:
        print(f"🆕 Creating product: {product_name}...")
        new_product = sdk.catalog.create_product(
            name=product_name,
            description="AgencyOS SaaS Subscription",
            type="SERVICE",
            category="SOFTWARE"
        )
        if "id" in new_product:
            product_id = new_product["id"]
            print(f"✅ Created product: {product_id}")
        else:
            print(f"❌ Failed to create product: {new_product}")
            return

    # 2. Define Plans
    # Format: (Name, Price, Tier Code)
    plans_config = [
        ("Starter", "29", "starter"),
        ("Pro", "99", "pro"),
        ("Franchise", "299", "franchise"),
        ("Enterprise", "999", "enterprise")
    ]

    print("\n📋 Checking Plans...")

    # List existing plans
    existing_plans = sdk.catalog.list_plans(product_id=product_id)
    known_plans = {}
    if existing_plans and "plans" in existing_plans:
        for p in existing_plans["plans"]:
            known_plans[p["name"]] = p["id"]

    results = {}

    for name, price, tier in plans_config:
        full_name = f"AgencyOS {name}"

        if full_name in known_plans:
            plan_id = known_plans[full_name]
            print(f"✅ Found plan: {full_name} ({plan_id}) - ${price}")
            results[tier] = plan_id
        else:
            print(f"🆕 Creating plan: {full_name} - ${price}...")
            billing_cycles = [
                {
                    "frequency": {"interval_unit": "MONTH", "interval_count": 1},
                    "tenure_type": "REGULAR",
                    "sequence": 1,
                    "total_cycles": 0, # Infinite
                    "pricing_scheme": {
                        "fixed_price": {"value": price, "currency_code": "USD"}
                    }
                }
            ]

            new_plan = sdk.catalog.create_plan(
                product_id=product_id,
                name=full_name,
                description=f"{name} Tier Subscription",
                billing_cycles=billing_cycles
            )

            if "id" in new_plan:
                plan_id = new_plan["id"]
                print(f"✅ Created plan: {plan_id}")
                results[tier] = plan_id
            else:
                print(f"❌ Failed to create plan {full_name}: {new_plan}")

    print("\n🎉 Sync Complete! Add these to your database or frontend config:")
    print("-" * 50)
    for tier, pid in results.items():
        print(f"{tier.upper()}_PLAN_ID={pid}")
    print("-" * 50)

if __name__ == "__main__":
    sync_plans()
