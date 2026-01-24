#!/usr/bin/env python3
"""
🔄 Billing Migration Script
===========================
Migrates legacy billing data from `organizations` to the unified `subscriptions` table.
Ensures consistency across Newsletter SaaS and Agency Dashboard.

Usage:
    python3 scripts/migrate_billing.py [--dry-run]
"""

import argparse
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ensure we can import from core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import Client, create_client


def get_db_client() -> Optional[Client]:
    """
    Get Supabase client with fallback to explicit env vars.
    This is useful when core.config doesn't pick up the service key.
    """
    # 1. Try core.infrastructure.database first
    try:
        from core.infrastructure.database import get_db
        db = get_db()
        if db:
            return db
    except ImportError:
        pass

    # 2. Fallback to manual connection using SUPABASE_SERVICE_KEY
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

    if url and key:
        print(f"🔌 Connecting with fallback env vars (Key length: {len(key)})")
        try:
            return create_client(url, key)
        except Exception as e:
            print(f"❌ Fallback connection failed: {e}")
            return None

    return None

def migrate_billing(dry_run: bool = False):
    """
    Execute billing migration.

    Args:
        dry_run: If True, only simulate changes without writing to DB.
    """
    db = get_db_client()
    if not db:
        print("❌ Database connection failed. Check your .env file for SUPABASE_URL and SUPABASE_SERVICE_KEY.")
        return

    print(f"🚀 Starting Billing Migration at {datetime.now().isoformat()}")
    if dry_run:
        print("⚠️  DRY RUN MODE: No changes will be written to the database.")

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
    errors = []

    for org in organizations:
        try:
            org_id = org.get("id")
            plan = org.get("plan", "free")
            paypal_sub_id = org.get("paypal_subscription_id")
            paypal_order_id = org.get("paypal_order_id")
            paypal_email = org.get("paypal_payer_email")
            updated_at = org.get("updated_at", datetime.now().isoformat())

            # Normalize plan name
            plan_upper = plan.upper() if plan else "FREE"
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

            if dry_run:
                print(f"   [DRY-RUN] Would process: {org_id} -> {plan_upper} ({status})")
                migrated_count += 1
                continue

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

    print("\n" + "="*50)
    print("🏁 Migration Completed")
    print(f"✅ Processed: {migrated_count}")
    print(f"⚠️  Errors: {len(errors)}")
    print("="*50)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Migrate billing data to subscriptions table')
    parser.add_argument('--dry-run', action='store_true', help='Simulate migration without writing to DB')
    args = parser.parse_args()

    migrate_billing(dry_run=args.dry_run)
