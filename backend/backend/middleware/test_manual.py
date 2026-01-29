#!/usr/bin/env python3
"""
Manual test script for rate limiting middleware
Demonstrates rate limiting in action for different tiers
"""

import time
from typing import Dict

import requests

BASE_URL = "http://localhost:8000"


def test_tier(tier: str, expected_limit: int, test_name: str):
    """Test rate limiting for a specific tier"""
    print(f"\n{'=' * 60}")
    print(f"Testing {test_name}")
    print(f"Expected limit: {expected_limit} requests/minute")
    print(f"{'=' * 60}\n")

    headers = {}
    if tier != "default":
        headers["X-Subscription-Tier"] = tier

    successful = 0
    rate_limited = 0

    # Make requests up to limit + 5
    for i in range(min(expected_limit + 5, 20)):  # Cap at 20 for demo
        try:
            response = requests.get(f"{BASE_URL}/test", headers=headers)

            if response.status_code == 200:
                successful += 1
                print(f"✅ Request {i + 1}: Success")
                print(
                    f"   Headers: Limit={response.headers.get('X-RateLimit-Limit')}, "
                    f"Remaining={response.headers.get('X-RateLimit-Remaining')}, "
                    f"Tier={response.headers.get('X-RateLimit-Tier')}"
                )
            elif response.status_code == 429:
                rate_limited += 1
                data = response.json()
                print(f"⛔ Request {i + 1}: Rate Limited (429)")
                print(f"   Message: {data.get('message')}")
                print(f"   Retry After: {data.get('retry_after')} seconds")
                break
            else:
                print(f"❌ Request {i + 1}: Unexpected status {response.status_code}")

        except requests.exceptions.ConnectionError:
            print(f"❌ Connection failed. Is the server running on {BASE_URL}?")
            print("   Start server with: cd backend && uvicorn main:app --reload")
            return

        time.sleep(0.1)  # Small delay between requests

    print("\n📊 Summary:")
    print(f"   Successful: {successful}")
    print(f"   Rate Limited: {rate_limited}")
    print(f"   Expected Limit: {expected_limit}")
    if successful == expected_limit:
        print("   ✅ PASS: Hit expected limit")
    else:
        print(f"   ⚠️  Note: Got {successful} successful requests")


def main():
    """Run rate limiting tests"""
    print("\n🚀 Rate Limiting Middleware Test Script")
    print("=" * 60)

    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Server is running\n")
        else:
            print(f"⚠️  Server returned status {response.status_code}\n")
    except requests.exceptions.ConnectionError:
        print("❌ Server not running!")
        print("   Start with: cd backend && uvicorn main:app --reload")
        return

    # Test different tiers
    tests = [
        ("free", 10, "FREE Tier (10 req/min)"),
        ("starter", 30, "STARTER Tier (30 req/min)"),
        ("pro", 100, "PRO Tier (100 req/min) - Testing first 20"),
        ("enterprise", 150, "ENTERPRISE Tier (unlimited) - Testing 20"),
    ]

    for tier, limit, name in tests:
        test_tier(tier, limit, name)
        print("\n⏳ Waiting 3 seconds before next test...")
        time.sleep(3)

    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
