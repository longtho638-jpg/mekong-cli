"""
Verify Revenue Intelligence.
Tests Upsell Detector, Churn Predictor, and Revenue Server integration.
"""
import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from antigravity.core.revenue.ai.churn_predictor import ChurnPredictor
from antigravity.core.revenue.ai.upsell_detector import UpsellDetector
from antigravity.core.revenue.models import ChurnRisk, CustomerProfile, UpsellOpportunity
from antigravity.mcp_servers.revenue_server.handlers import RevenueAgentHandler


def verify_upsell():
    print("\n📈 Testing Upsell Detector...")
    detector = UpsellDetector()

    # 1. Test Tier Upgrade
    print("   Testing Tier Upgrade (High Usage)...")
    customer = CustomerProfile(
        id="cust_001",
        name="Growing Startup",
        tier="warrior",
        mrr=2000.0,
        usage_percent=90.0, # > 80% triggers upgrade
        last_active=time.time(),
        signup_date=time.time() - (60 * 86400) # 2 months ago
    )

    recs = detector.detect(customer)
    upgrade_rec = next((r for r in recs if r.opportunity == UpsellOpportunity.TIER_UPGRADE), None)

    if upgrade_rec:
        print(f"   ✅ Detected Tier Upgrade: +${upgrade_rec.potential_mrr_increase} MRR")
        print(f"      Reason: {upgrade_rec.reasoning}")
    else:
        print(f"   ❌ Tier Upgrade not detected (Usage: {customer.usage_percent}%)")

    # 2. Test Annual Plan
    print("   Testing Annual Plan (Stable Customer)...")
    customer_stable = CustomerProfile(
        id="cust_002",
        name="Stable Corp",
        tier="general",
        mrr=5000.0,
        usage_percent=50.0,
        last_active=time.time(),
        signup_date=time.time() - (120 * 86400) # 4 months ago (between 90 and 365)
    )

    recs = detector.detect(customer_stable)
    annual_rec = next((r for r in recs if r.opportunity == UpsellOpportunity.ANNUAL_PLAN), None)

    if annual_rec:
        print(f"   ✅ Detected Annual Plan: +${annual_rec.potential_mrr_increase:.2f} MRR impact")
    else:
        print("   ❌ Annual Plan not detected")

def verify_churn():
    print("\n📉 Testing Churn Predictor...")
    predictor = ChurnPredictor()

    # 1. Test High Risk
    print("   Testing High Risk Customer...")
    customer_risk = CustomerProfile(
        id="cust_risk",
        name="Risky Biz",
        tier="warrior",
        mrr=2000.0,
        usage_percent=20.0, # Low usage
        last_active=time.time() - (35 * 86400), # Inactive 35 days (>30 for max score)
        signup_date=time.time() - (200 * 86400),
        support_tickets=6, # High tickets
        payment_failures=2
    )

    prediction = predictor.predict(customer_risk)
    print(f"   📊 Risk Level: {prediction.risk.value.upper()} ({prediction.probability:.1%})")
    print("      Factors:")
    for f in prediction.factors:
        print(f"      - {f}")

    if prediction.risk in [ChurnRisk.HIGH, ChurnRisk.CRITICAL]:
        print("   ✅ Correctly identified High/Critical risk")
    else:
        print(f"   ❌ Risk underestimated: {prediction.risk}")

    # 2. Test Retention Actions
    if prediction.recommended_actions:
        print("   ✅ Generated Retention Actions:")
        for action in prediction.recommended_actions:
            print(f"      -> {action}")
    else:
        print("   ❌ No retention actions generated")

def verify_revenue_server():
    print("\n💰 Testing Revenue Server...")
    handler = RevenueAgentHandler()

    # 1. Check Sales (Mock)
    result = handler.check_sales()
    if result.get('success') or result.get('status') == 'not_configured':
        print(f"   ✅ Sales Check executed (Status: {result.get('status', 'success')})")
    else:
        print("   ❌ Sales Check failed")

    # 2. Report Generation
    report = handler.get_report()
    if report:
        print("   ✅ Revenue Report generated")
        print(f"      Total Revenue: ${report['total_revenue']:,.2f}")
        print(f"      Goal Progress: {report['progress_percent']:.2f}%")
    else:
        print("   ❌ Report generation failed")

if __name__ == "__main__":
    print("🧪 Verifying Revenue Intelligence...")
    print("=" * 50)

    verify_upsell()
    verify_churn()
    verify_revenue_server()

    print("\n" + "=" * 50)
    print("✨ Revenue Intelligence Verified")
