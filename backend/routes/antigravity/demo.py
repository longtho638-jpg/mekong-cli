"""
Antigravity Demo Data Management
"""

from antigravity.core.agency_dna import AgencyDNA, PricingTier, Tone
from antigravity.core.client_magnet import ClientMagnet, LeadSource
from antigravity.core.content_factory import ContentFactory
from antigravity.core.revenue_engine import Currency, RevenueEngine
from antigravity.franchise.manager import FranchiseManager, Territory
from antigravity.platform.data_moat import DataMoat
from antigravity.vc.metrics import FundingStage, VCMetrics

# Demo instances (in-memory for now)
demo_dna = None
demo_magnet = None
demo_engine = None
demo_factory = None
demo_franchise = None
demo_metrics = None
demo_moat = None


def init_demo_data():
    """Initialize demo data for all modules"""
    global demo_dna, demo_magnet, demo_engine, demo_factory, demo_franchise, demo_metrics, demo_moat

    # AgencyDNA
    demo_dna = AgencyDNA(
        name="NovaAgency",
        niche="Nông sản",
        location="Cần Thơ",
        tone=Tone.MIEN_TAY,
        tier=PricingTier.GROWTH,
    )
    demo_dna.add_service("Branding", "Brand identity for agricultural businesses", 2000)
    demo_dna.add_service("Marketing", "Digital marketing campaigns", 3000)

    # ClientMagnet
    demo_magnet = ClientMagnet()
    for i in range(127):
        lead = demo_magnet.add_lead(
            f"Lead {i}",
            f"Company {i}",
            f"lead{i}@example.com",
            source=LeadSource.FACEBOOK if i % 4 == 0 else LeadSource.REFERRAL,
        )
        if i < 50:
            demo_magnet.qualify_lead(lead, budget=5000, score=85)
        if i < 15:
            demo_magnet.convert_to_client(lead)

    # RevenueEngine
    demo_engine = RevenueEngine()
    for i in range(156):
        inv = demo_engine.create_invoice(
            f"Client {i % 15}", 2000 + (i * 100), currency=Currency.USD
        )
        if i < 142:
            demo_engine.mark_paid(inv)

    # ContentFactory
    demo_factory = ContentFactory(niche="Nông sản", tone="mien_tay")
    ideas = demo_factory.generate_ideas(87)
    for idea in ideas[:43]:
        demo_factory.create_post(idea)

    # FranchiseManager
    demo_franchise = FranchiseManager()
    f1 = demo_franchise.add_franchisee(
        "Anh Minh", "minh@test.com", territory=Territory.CAN_THO
    )
    f2 = demo_franchise.add_franchisee(
        "Chị Lan", "lan@test.com", territory=Territory.DA_NANG
    )
    f3 = demo_franchise.add_franchisee(
        "Anh Tuấn", "tuan@test.com", territory=Territory.HA_NOI
    )
    demo_franchise.record_revenue(f1.id, 15000)
    demo_franchise.record_revenue(f2.id, 12000)
    demo_franchise.record_revenue(f3.id, 18000)

    # VCMetrics
    demo_metrics = VCMetrics(
        mrr=75000,
        growth_rate=18,
        cac=250,
        ltv=3000,
        churn_rate=3,
        nrr=112,
        net_margin=15,
        total_customers=150,
        stage=FundingStage.SEED,
    )

    # DataMoat
    demo_moat = DataMoat()
    demo_moat.record_success("Nông sản", "facebook", 94, revenue=800)
    demo_moat.record_success("Nông sản", "tiktok", 88, revenue=600)
    demo_moat.record_success("Nông sản", "zalo", 78, revenue=400)


# Initialize on module load
init_demo_data()
