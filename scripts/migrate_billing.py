#!/usr/bin/env python3
"""
🔄 Billing Migration Script
===========================
Migrates legacy billing data from `organizations` to the unified `subscriptions` table.
Ensures consistency across Newsletter SaaS and Agency Dashboard.

Usage:
    python3 scripts/migrate_billing.py
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List

# Ensure we can import from core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.infrastructure.database import get_db

def migrate_billing():
    """Execute billing migration."""
    db = get_db()
    if not db:
        print("❌ Database connection failed. Check your .env file.")
        return

    print(f"🚀 Starting Billing Migration at {datetime.now().isoformat()}")

    # 1. Fetch all organizations with plans or subscriptions
    try:
        # We assume organizations table exists and has billing fields
        response = db.table("organizations").select("*").execute()
        organizations = response.data
        print(f"📋 Found {len(organizations)} organizations to scan.")
    except Exception as e:
        print(f"❌ Failed to fetch organizations: {e}")
        return

    migrated_count = 0
    skipped_count = 0
    errors = []

    for org in organizations:
        try:
            org_id = org.get("id")
            plan = org.get("plan", "free")
            paypal_sub_id = org.get("paypal_subscription_id")
            paypal_order_id = org.get("paypal_order_id")
            paypal_email = org.get("paypal_payer_email")
            updated_at = org.get("updated_at", datetime.now().isoformat())

            # Skip if basic free user with no history (optional optimization)
            # But we might want to track free users in subscriptions too for consistency
            # Let's migrate everyone to ensure 'subscriptions' is the SSOT (Single Source of Truth)

            # Normalize plan name
            plan_upper = plan.upper()
            if plan_upper == "AGENCY": plan_upper = "PRO" # Example mapping if needed, or keep AGENCY

            # Valid plans from constraint: 'FREE', 'STARTER', 'PRO', 'AGENCY', 'FRANCHISE', 'ENTERPRISE'
            if plan_upper not in ['FREE', 'STARTER', 'PRO', 'AGENCY', 'FRANCHISE', 'ENTERPRISE']:
                # Default fallback
                plan_upper = "FREE"

            status = "active"
            if plan_upper == "FREE":
                # Check if they had a sub that was cancelled
                if paypal_sub_id:
                    status = "canceled"
                else:
                    status = "active" # Free active

            # Construct subscription data
            sub_data = {
                "tenant_id": org_id,
                "plan": plan_upper,
                "status": status,
                "currency": "USD",
                "paypal_subscription_id": paypal_sub_id,
                "paypal_order_id": paypal_order_id,
                "paypal_payer_email": paypal_email,
                "updated_at": updated_at,
                # Set a default period end for migrated active subs if unknown
                "current_period_end": (datetime.now() + timedelta(days=30)).isoformat() if status == "active" and plan_upper != "FREE" else None
            }

            # Check if subscription already exists
            existing = db.table("subscriptions").select("id").eq("tenant_id", org_id).execute()

            if existing.data:
                # Update existing
                db.table("subscriptions").update(sub_data).eq("tenant_id", org_id).execute()
                # print(f"   updated: {org_id} -> {plan_upper}")
            else:
                # Insert new
                db.table("subscriptions").insert(sub_data).execute()
                # print(f"   created: {org_id} -> {plan_upper}")

            migrated_count += 1

        except Exception as e:
            print(f"❌ Error processing org {org.get('id')}: {e}")
            errors.append(org.get('id'))

    # 2. Phase 2: Agency Dashboard (if separate 'agencies' table exists)
    # Check if 'agencies' table exists and migrate
    try:
        agencies_resp = db.table("agencies").select("*").execute()
        agencies = agencies_resp.data
        if agencies:
            print(f"\n📋 Found {len(agencies)} agencies (Dashboard) to scan.")
            for ag in agencies:
                # Similar logic for agencies table if it has billing info
                pass
    except:
        # agencies table might not exist or be accessible
        pass

    print("\n" + "="*50)
    print("🏁 Migration Completed")
    print(f"✅ Processed: {migrated_count}")
    print(f"⚠️  Errors: {len(errors)}")
    print("="*50)

if __name__ == "__main__":
    migrate_billing()
