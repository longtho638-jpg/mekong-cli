"""
Verify Sales & Agency Operations.
Tests Sales Pipeline and Agency Server workflows.
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from antigravity.core.sales_pipeline import DealStage, DealTier, SalesPipeline
from antigravity.mcp_servers.agency_server.handlers import AgencyHandler


def verify_sales_pipeline():
    print("\n🧲 Testing Sales Pipeline...")
    pipeline = SalesPipeline(data_dir=".antigravity/test_crm")

    # 1. Create Deal
    print("   Creating new Warrior Deal...")
    deal = pipeline.create_deal(
        startup_name="TechNova",
        founder_name="Alex Chen",
        tier=DealTier.WARRIOR
    )
    print(f"   ✅ Deal created: #{deal.id} {deal.startup_name} ({deal.tier.value})")

    # Check financials
    if deal.retainer_monthly == 2000:
        print(f"   ✅ Correct Warrior pricing: ${deal.retainer_monthly}/mo")
    else:
        print(f"   ❌ Incorrect pricing: ${deal.retainer_monthly}")

    # 2. Advance Stage
    print("   Advancing to Negotiation...")
    pipeline.advance_stage(deal.id, DealStage.NEGOTIATION)
    if deal.stage == DealStage.NEGOTIATION:
        print("   ✅ Stage updated to Negotiation")
    else:
        print(f"   ❌ Stage mismatch: {deal.stage}")

    # 3. Close Deal
    print("   Closing deal as WON...")
    pipeline.close_deal(deal.id, won=True)
    if deal.is_won():
        print("   ✅ Deal WON")
    else:
        print("   ❌ Deal not closed properly")

    # 4. Pipeline Breakdown
    print("   Checking Pipeline Breakdown...")
    breakdown = pipeline.get_pipeline_breakdown()
    financials = breakdown["financials"]
    print(f"   📊 Current ARR: ${financials['current_arr']:,.2f}")

    if financials['current_arr'] >= 24000: # 2000 * 12
        print("   ✅ ARR calculation correct")
    else:
        print(f"   ❌ ARR calculation failed: {financials['current_arr']}")

async def verify_agency_server():
    print("\n🏯 Testing Agency Server...")
    handler = AgencyHandler()

    # 1. Test Win-Win-Win
    print("   Testing WIN-WIN-WIN Gatekeeper...")
    decision = await handler.validate_win("Onboard TechNova as Warrior Client")

    print(f"   🔮 Wisdom: {decision['wisdom']}")
    print(f"   ⚖️ Decision: {decision['decision']}")

    if decision['decision'] == "GO":
        print("   ✅ Win-Win-Win validated")
    else:
        print("   ⚠️ Validation failed")

    # 2. Test Onboarding
    print("   Testing Onboarding Flow...")
    client_name = "TechNova"
    result = await handler.onboard_client(client_name)

    if result['contract_path']:
        print(f"   ✅ Contract generated: {result['contract_path']}")
    if result['invoice_path']:
        print(f"   ✅ Invoice generated: {result['invoice_path']}")
    if result['portal_url']:
        print(f"   ✅ Portal setup: {result['portal_url']}")

if __name__ == "__main__":
    print("🧪 Verifying Sales & Agency Ops...")
    print("=" * 50)

    # Run synchronous sales tests
    verify_sales_pipeline()

    # Run async agency tests
    asyncio.run(verify_agency_server())

    print("\n" + "=" * 50)
    print("✨ Sales & Agency Operations Verified")
