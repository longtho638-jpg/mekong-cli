import os
import sys
from pprint import pprint

# Ensure we can import core
sys.path.insert(0, os.getcwd())

try:
    from core.finance.subscription_middleware import SubscriptionMiddleware, SubscriptionTier

    print("✅ Imported SubscriptionMiddleware")
except ImportError as e:
    print(f"❌ Failed to import: {e}")
    sys.exit(1)


def verify_user(email):
    print(f"\n🔍 Verifying user: {email}")
    print("-" * 50)

    middleware = SubscriptionMiddleware()

    # 1. Check Subscription
    try:
        sub = middleware.get_subscription(email)
        print("Subscription Data:")
        pprint(sub)

        tier = sub.get("tier")
        print(f"\nDetected Tier: {tier} (Type: {type(tier)})")

        if str(tier).lower() == "pro" or tier == SubscriptionTier.PRO:
            print("✅ Tier identified as PRO")
        else:
            print("❌ Tier is NOT PRO")

    except Exception as e:
        print(f"❌ Crash in get_subscription: {e}")
        return

    # 2. Check Limit
    try:
        limit = middleware.check_limit(email, "api_call")
        print("\nCheck Limit 'api_call':")
        pprint(limit)

        if limit.get("allowed"):
            print("✅ API Call Allowed")
        else:
            print("❌ API Call DENIED")
    except Exception as e:
        print(f"❌ Crash in check_limit: {e}")

    # 3. Check Warning logic
    try:
        warn = middleware.check_and_warn_quota(email)
        print("\nCheck & Warn Quota:")
        pprint(warn)
    except Exception as e:
        print(f"❌ Crash in check_and_warn_quota: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    email = "billwill.mentor@gmail.com"
    if len(sys.argv) > 1:
        email = sys.argv[1]
    verify_user(email)
