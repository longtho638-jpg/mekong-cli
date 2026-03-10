#!/usr/bin/env python3
"""
Example: Multi-Tenant Isolation

Demonstrates how to set up multi-tenant isolation
for a RaaS platform using Mekong CLI.
"""

from mekong.raas import TenantManager, CreditStore
import asyncio


async def main():
    # Initialize tenant management
    tenant_manager = TenantManager()
    credit_store = CreditStore()

    # Create tenants (customers)
    tenants = [
        {"id": "tenant_acme", "name": "Acme Corp", "plan": "enterprise"},
        {"id": "tenant_globex", "name": "Globex Inc", "plan": "startup"},
        {"id": "tenant_soylent", "name": "Soylent Corp", "plan": "enterprise"},
    ]

    print("=== Creating Tenants ===\n")
    for tenant in tenants:
        await tenant_manager.create_tenant(
            tenant_id=tenant["id"],
            name=tenant["name"],
            plan=tenant["plan"],
            settings={
                "max_concurrent_missions": 10 if tenant["plan"] == "enterprise" else 3,
                "rate_limit_per_minute": 60 if tenant["plan"] == "enterprise" else 20,
            },
        )
        print(f"✅ Created tenant: {tenant['name']} ({tenant['plan']})")

    # Allocate credits per tenant
    print("\n=== Allocating Credits ===\n")
    credit_allocation = {
        "tenant_acme": 10000,  # Enterprise plan
        "tenant_globex": 1000,  # Startup plan
        "tenant_soylent": 10000,  # Enterprise plan
    }

    for tenant_id, credits in credit_allocation.items():
        await credit_store.add_credits(
            user_id=tenant_id,
            amount=credits,
            source="monthly_allocation",
            transaction_id=f"alloc_{tenant_id}_2026_03",
        )
        print(f"✅ Allocated {credits} credits to {tenant_id}")

    # Query tenant isolation
    print("\n=== Tenant Isolation Check ===\n")
    for tenant in tenants:
        tenant_data = await tenant_manager.get_tenant(tenant["id"])
        balance = await credit_store.get_balance(tenant["id"])

        print(f"{tenant['name']}:")
        print(f"  Plan: {tenant_data['plan']}")
        print(f"  Credit Balance: {balance}")
        print(f"  Max Concurrent: {tenant_data['settings']['max_concurrent_missions']}")
        print()

    print("✅ Multi-tenant setup complete!")


if __name__ == "__main__":
    asyncio.run(main())
