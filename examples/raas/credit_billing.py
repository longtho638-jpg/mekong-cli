#!/usr/bin/env python3
"""
Example: Credit Billing System

Demonstrates how to use Mekong's credit billing system
to track and deduct credits for task execution.
"""

from mekong.raas import CreditStore, CreditRateLimiter
import asyncio


async def main():
    # Initialize credit system
    credit_store = CreditStore()
    rate_limiter = CreditRateLimiter()

    # Create a test user
    user_id = "user_123"

    # Add credits to user account
    print("=== Adding Credits ===")
    await credit_store.add_credits(
        user_id=user_id,
        amount=100,
        source="demo_purchase",
        transaction_id="txn_demo_001",
    )

    # Check balance
    balance = await credit_store.get_balance(user_id)
    print(f"User {user_id} balance: {balance} credits")

    # Execute tasks with different costs
    tasks = [
        {"name": "Simple task", "cost": 1},
        {"name": "Standard task", "cost": 3},
        {"name": "Complex task", "cost": 5},
    ]

    print("\n=== Executing Tasks ===")
    for task in tasks:
        # Check if user has enough credits
        can_run = await rate_limiter.can_execute(user_id, task["cost"])

        if can_run:
            # Deduct credits
            await credit_store.deduct_credits(
                user_id=user_id,
                amount=task["cost"],
                reason=f"Executed: {task['name']}",
            )
            print(f"✅ {task['name']} (-{task['cost']} credits)")
        else:
            print(f"❌ {task['name']} - Insufficient credits")

    # Final balance
    final_balance = await credit_store.get_balance(user_id)
    print("\n=== Final Balance ===")
    print(f"Remaining: {final_balance} credits")

    # Get transaction history
    history = await credit_store.get_history(user_id, limit=10)
    print("\n=== Transaction History ===")
    for tx in history:
        sign = "+" if tx["type"] == "credit" else "-"
        print(f"{sign}{tx['amount']} credits - {tx['reason']}")


if __name__ == "__main__":
    asyncio.run(main())
