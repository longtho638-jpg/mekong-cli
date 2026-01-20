"""
Verification script for Revenue AI Refactor.
"""
import sys
import os
import time

# Add project root to path
sys.path.insert(0, os.getcwd())

from antigravity.core.revenue_ai import (
    get_revenue_ai,
    predict_churn,
    detect_upsell,
    get_revenue_metrics,
    CustomerProfile,
    ChurnRisk,
    UpsellOpportunity
)

def test_revenue_ai_flow():
    print("Testing Revenue AI Refactor...")

    ai = get_revenue_ai()

    # 1. Add a High Risk Customer (for Churn Prediction)
    print("\n1. Adding High Risk Customer...")
    churn_profile = CustomerProfile(
        id="cust_churn",
        name="Churny Corp",
        tier="warrior",
        mrr=2000.0,
        usage_percent=20.0, # Low usage (<30%) -> +0.25 score
        last_active=time.time(),
        signup_date=time.time() - (100 * 86400),
        support_tickets=6, # High support tickets (>5) -> +0.12 score
        nps_score=5, # Low NPS (<6) -> +0.10 score
        payment_failures=4 # 4 failures -> min(4*0.3, 1.0)*0.20 = 0.20 score
        # Total score expected: 0.25 + 0.12 + 0.10 + 0.20 = 0.67 -> HIGH risk
    )
    ai.add_customer(churn_profile)
    print(f"   Customer added: {churn_profile.name}")

    # 2. Add an Upsell Candidate (for Upsell Detection)
    print("\n2. Adding Upsell Candidate...")
    upsell_profile = CustomerProfile(
        id="cust_upsell",
        name="Grow Fast Inc",
        tier="warrior",
        mrr=2000.0,
        usage_percent=90.0, # High usage (>80%) -> Upgrade opportunity
        last_active=time.time(),
        signup_date=time.time() - (100 * 86400), # 100 days ago -> Annual plan opportunity
        support_tickets=0,
        nps_score=9,
        payment_failures=0
    )
    ai.add_customer(upsell_profile)
    print(f"   Customer added: {upsell_profile.name}")

    # 3. Predict Churn (on High Risk Customer)
    print("\n3. Predicting Churn...")
    prediction = predict_churn("cust_churn")

    if not prediction:
        print("❌ Failed to generate churn prediction")
        return False

    print(f"   Risk: {prediction.risk.value}")
    print(f"   Probability: {prediction.probability:.1%}")
    print(f"   Factors: {prediction.factors}")

    if prediction.risk not in [ChurnRisk.HIGH, ChurnRisk.CRITICAL]:
        print(f"❌ Expected HIGH/CRITICAL risk, got {prediction.risk}")
        return False

    print("   Churn prediction logic passed ✅")

    # 4. Detect Upsell (on Upsell Candidate)
    print("\n4. Detecting Upsell...")
    opportunities = detect_upsell("cust_upsell")

    print(f"   Opportunities found: {len(opportunities)}")
    for opp in opportunities:
        print(f"   - {opp.opportunity.value}: {opp.reasoning}")

    opp_types = [o.opportunity for o in opportunities]

    if UpsellOpportunity.TIER_UPGRADE not in opp_types:
        print("❌ Failed to detect TIER_UPGRADE (usage > 80%)")
        return False

    if UpsellOpportunity.ANNUAL_PLAN not in opp_types:
        print("❌ Failed to detect ANNUAL_PLAN (90-365 days)")
        return False

    print("   Upsell detection logic passed ✅")

    # 5. Check Metrics
    print("\n5. Checking Metrics...")
    metrics = get_revenue_metrics()

    print(f"   MRR: {metrics.mrr}")
    print(f"   Customers at risk: {metrics.customers_at_risk}")

    # Total MRR = 2000 + 2000 = 4000
    if metrics.mrr != 4000.0:
        print(f"❌ Expected MRR 4000.0, got {metrics.mrr}")
        return False

    if metrics.customers_at_risk < 1:
        print("❌ Expected at least 1 customer at risk")
        return False

    print("   Metrics calculation passed ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if test_revenue_ai_flow():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
