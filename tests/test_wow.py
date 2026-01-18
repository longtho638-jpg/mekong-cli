#!/usr/bin/env python3
"""
🚀 AntigravityKit WOW Test Suite - Comprehensive Platform Verification
======================================================================

The definitive verification suite for the Agency OS. Validates the integrity
of all core operational engines, strategic frameworks, and agentic workflows.

"Độc đáo - Độc quyền - Độc nhất - Duy nhất" 🏯
"""

import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def print_header():
    print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 ANTIGRAVITYKIT WOW TEST SUITE                       ║
║                                                           ║
║   Độc đáo - Độc quyền - Độc nhất - Duy nhất              ║
║   Comprehensive Platform Test                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)


def test_agency_dna():
    """Test AgencyDNA module."""
    print("\n🧬 TEST 1: AgencyDNA")
    print("-" * 50)

    from antigravity.core.agency_dna import AgencyDNA, PricingTier, Tone

    dna = AgencyDNA(
        name="NovaAgency",
        niche="Nông sản",
        location="Cần Thơ",
        tone=Tone.MIEN_TAY,
        tier=PricingTier.GROWTH,
    )

    dna.add_service("Tư vấn chiến lược", "Chiến lược nông sản", 500)
    dna.add_service("Marketing số", "Digital marketing", 1000)

    summary = dna.to_dict()
    print(f"   ✅ Agency: {summary['identity']['name']}")
    print(f"   ✅ Niche: {summary['identity']['niche']}")
    print(f"   ✅ Tagline: {summary['identity']['tagline']}")
    print(f"   ✅ Services: {len(dna.services)}")

    assert summary is not None
    assert len(dna.services) == 2


def test_client_magnet():
    """Test ClientMagnet module."""
    print("\n🧲 TEST 2: ClientMagnet")
    print("-" * 50)

    from antigravity.core.client_magnet import ClientMagnet, LeadSource

    magnet = ClientMagnet()

    # Add leads
    lead1 = magnet.add_lead("ABC Corp", source=LeadSource.FACEBOOK)
    lead2 = magnet.add_lead("XYZ Ltd", source=LeadSource.REFERRAL)

    # Qualify leads
    magnet.qualify_lead(lead1, budget=5000, score=85)
    magnet.qualify_lead(lead2, budget=3000, score=72)

    # Convert one
    magnet.convert_to_client(lead1)

    stats = magnet.get_stats()
    print(f"   ✅ Total Leads: {stats['total_leads']}")
    print(f"   ✅ Clients: {stats['total_clients']}")
    print(f"   ✅ Pipeline Value: ${stats['pipeline_value']:,.0f}")

    assert stats["total_leads"] == 2
    assert stats["total_clients"] == 1


def test_revenue_engine():
    """Test RevenueEngine module."""
    print("\n💰 TEST 3: RevenueEngine")
    print("-" * 50)

    from antigravity.core.revenue_engine import RevenueEngine

    engine = RevenueEngine()

    # Create invoices
    inv1 = engine.create_invoice("ABC Corp", 5000)
    engine.create_invoice("XYZ Ltd", 3000)

    # Mark paid
    engine.mark_paid(inv1)

    stats = engine.get_stats()
    print(f"   ✅ Total Invoices: {stats['volume']['total_invoices']}")
    print(f"   ✅ MRR: ${stats['financials']['mrr']:,.0f}")
    print(f"   ✅ ARR: ${stats['financials']['arr']:,.0f}")
    print(f"   ✅ Goal Progress: {stats['goals']['progress_percent']}%")

    assert stats["volume"]["total_invoices"] == 2
    assert stats["financials"]["mrr"] > 0


def test_content_factory():
    """Test ContentFactory module."""
    print("\n🎨 TEST 4: ContentFactory")
    print("-" * 50)

    from antigravity.core.content_factory import ContentFactory

    factory = ContentFactory(niche="Gạo ST25", tone="mien_tay")

    # Generate ideas
    ideas = factory.generate_ideas(10)

    # Create content
    for idea in ideas[:2]:
        factory.create_post(idea)

    stats = factory.get_stats()
    print(f"   ✅ Ideas Generated: {stats['inventory']['total_ideas']}")
    print(f"   ✅ Quality Score: {stats['quality']['avg_virality']:.1f}%")

    assert stats["inventory"]["total_ideas"] >= 10
    assert stats["quality"]["avg_virality"] >= 0


def test_franchise_manager():
    """Test FranchiseManager module."""
    print("\n🏢 TEST 5: FranchiseManager")
    print("-" * 50)

    from antigravity.franchise.manager import FranchiseManager, Territory

    manager = FranchiseManager()

    # Add franchisees
    f1 = manager.add_franchisee("Anh Minh", territory=Territory.CAN_THO)

    # Record revenue (using ID)
    manager.record_revenue(f1.id, 15000)

    stats = manager.get_network_stats()
    print(f"   ✅ Partners: {stats['network_size']['total_partners']}")
    print(f"   ✅ Revenue: ${stats['performance']['total_network_revenue']:,.0f}")
    print(f"   ✅ Royalties: ${stats['performance']['total_royalties_collected']:,.0f}")

    assert stats["network_size"]["total_partners"] >= 1
    assert stats["performance"]["total_network_revenue"] > 0


def test_vc_metrics():
    """Test VCMetrics module."""
    print("\n📊 TEST 6: VCMetrics")
    print("-" * 50)

    from antigravity.vc.metrics import FundingStage, VCMetrics

    metrics = VCMetrics(
        mrr=75000, growth_rate=18, cac=250, ltv=3000, nrr=112, stage=FundingStage.SEED
    )

    print(f"   ✅ MRR: ${metrics.mrr:,.0f}")
    print(f"   ✅ LTV/CAC Ratio: {metrics.ltv_cac_ratio():.1f}x")
    print(f"   ✅ Readiness Score: {metrics.readiness_score()}/100")

    assert metrics.mrr == 75000
    assert metrics.ltv_cac_ratio() > 0
    assert metrics.readiness_score() > 0


def test_data_moat():
    """Test DataMoat module."""
    print("\n🛡️ TEST 7: DataMoat")
    print("-" * 50)

    from antigravity.platform.data_moat import DataMoat

    moat = DataMoat()
    moat.record_success("Nông sản", "facebook", 95)

    strength = moat.get_moat_strength()
    print(f"   ✅ Data Points: {strength['data_points']}")
    print(f"   ✅ Defensibility: {strength['defensibility']}")

    assert strength["data_points"] >= 1
    assert strength["defensibility"] is not None


def test_memory_system():
    """Test Memory module."""
    print("\n🧠 TEST 8: Memory System")
    print("-" * 50)

    from core.memory.memory import AgentMemory

    memory = Memory()

    # Add observations
    memory.add_observation("Implemented AntigravityKit core modules", obs_type="code")
    memory.add_observation(
        "Created franchise network with 8 territories", obs_type="decision"
    )
    memory.add_observation("VCMetrics shows 75/100 readiness score", obs_type="note")

    # Get timeline
    timeline = memory.get_timeline(limit=5)

    print(f"   ✅ Observations Stored: {len(timeline)}")
    print(f"   ✅ Latest: {timeline[0]['summary'][:50]}...")

    assert len(timeline) >= 3
    assert timeline[0]["summary"] is not None


def test_money_maker():
    """Test MoneyMaker module."""
    print("\n🏯 TEST 9: MoneyMaker")
    print("-" * 50)

    from antigravity.core.money_maker import MoneyMaker, ServiceTier

    mm = MoneyMaker()
    quote = mm.generate_quote("Test Corp", [1, 3], ServiceTier.WARRIOR)

    print(f"   ✅ Quote ID: {quote.id}")
    print(f"   ✅ Project Value: ${quote.one_time_total:,.0f}")
    print(f"   ✅ Retainer: ${quote.monthly_retainer:,.0f}/mo")

    assert quote.id is not None
    assert quote.one_time_total > 0


def test_proposal_generator():
    """Test ProposalGenerator module."""
    print("\n📝 TEST 10: ProposalGenerator")
    print("-" * 50)

    from antigravity.core.money_maker import ServiceTier
    from antigravity.core.proposal_generator import ProposalGenerator

    pg = ProposalGenerator()
    proposal = pg.quick_launch("ABC Corp", "Anh Duy", [1, 3], ServiceTier.WARRIOR)

    print(f"   ✅ Proposal ID: {proposal.id}")
    print(f"   ✅ Contact: {proposal.client_contact}")

    assert proposal.id is not None
    assert "Strategic Proposal" in proposal.markdown_content


def test_win3_validation():
    """Test WIN-WIN-WIN validation."""
    print("\n🎯 TEST 11: WIN-WIN-WIN Validation")
    print("-" * 50)

    from antigravity.core.money_maker import MoneyMaker, ServiceTier

    mm = MoneyMaker()
    quote = mm.generate_quote("Deal Corp", [1, 3], ServiceTier.GENERAL)
    win3 = mm.validate_win3(quote)

    print(f"   ✅ Alignment Score: {win3.score}/100")
    print(f"   ✅ Is Valid: {'YES' if win3.is_valid else 'NO'}")

    assert win3.score > 0
    assert win3.is_valid is True


def print_summary(results):
    print("\n")
    print("═" * 60)
    print("\n🎉 WOW TEST RESULTS SUMMARY\n")

    passed = sum(1 for r in results.values() if r)
    total = len(results)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} | {test_name}")

    print("\n" + "─" * 60)
    print(
        f"\n   📊 Platform Health: {passed}/{total} tests passed ({passed / total * 100:.0f}%)"
    )

    if passed == total:
        print("\n   🎊 ALL SYSTEMS GO! ANTIGRAVITYKIT IS WOW! 🎊\n")


def main():
    print_header()
    results = {}

    test_funcs = [
        ("AgencyDNA", test_agency_dna),
        ("ClientMagnet", test_client_magnet),
        ("RevenueEngine", test_revenue_engine),
        ("ContentFactory", test_content_factory),
        ("FranchiseManager", test_franchise_manager),
        ("VCMetrics", test_vc_metrics),
        ("DataMoat", test_data_moat),
        ("MemorySystem", test_memory_system),
        ("MoneyMaker", test_money_maker),
        ("ProposalGenerator", test_proposal_generator),
        ("WIN3Validation", test_win3_validation),
    ]

    for name, func in test_funcs:
        try:
            results[name] = func()
        except Exception as e:
            print(f"   ❌ Error in {name}: {e}")
            results[name] = False

    print_summary(results)


if __name__ == "__main__":
    main()
