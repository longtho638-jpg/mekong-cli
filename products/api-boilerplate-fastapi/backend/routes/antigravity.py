from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime

from antigravity.core.agency_dna import AgencyDNA, Tone, PricingTier
from antigravity.core.client_magnet import ClientMagnet, LeadSource
from antigravity.core.revenue_engine import RevenueEngine, Currency
from antigravity.core.content_factory import ContentFactory
from antigravity.franchise.manager import FranchiseManager, Territory
from antigravity.vc.metrics import VCMetrics, FundingStage
from antigravity.platform.data_moat import DataMoat

router = APIRouter(prefix="/api/antigravity", tags=["antigravity"])

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
        tier=PricingTier.GROWTH
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
            source=LeadSource.FACEBOOK if i % 4 == 0 else LeadSource.REFERRAL
        )
        if i < 50:
            demo_magnet.qualify_lead(lead, budget=5000, score=85)
        if i < 15:
            demo_magnet.convert_to_client(lead)

    # RevenueEngine
    demo_engine = RevenueEngine()
    for i in range(156):
        inv = demo_engine.create_invoice(f"Client {i % 15}", 2000 + (i * 100), currency=Currency.USD)
        if i < 142:
            demo_engine.mark_paid(inv)

    # ContentFactory
    demo_factory = ContentFactory(niche="Nông sản", tone="mien_tay")
    ideas = demo_factory.generate_ideas(87)
    for idea in ideas[:43]:
        demo_factory.create_post(idea)

    # FranchiseManager
    demo_franchise = FranchiseManager()
    f1 = demo_franchise.add_franchisee("Anh Minh", "minh@test.com", territory=Territory.CAN_THO)
    f2 = demo_franchise.add_franchisee("Chị Lan", "lan@test.com", territory=Territory.DA_NANG)
    f3 = demo_franchise.add_franchisee("Anh Tuấn", "tuan@test.com", territory=Territory.HA_NOI)
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
        stage=FundingStage.SEED
    )

    # DataMoat
    demo_moat = DataMoat()
    demo_moat.record_success("Nông sản", "facebook", 94, revenue=800)
    demo_moat.record_success("Nông sản", "tiktok", 88, revenue=600)
    demo_moat.record_success("Nông sản", "zalo", 78, revenue=400)

# Initialize on module load
init_demo_data()

@router.get("/modules")
async def get_all_modules() -> Dict[str, Any]:
    """Get status of all AntigravityKit modules"""
    return {
        "status": "active",
        "modules": [
            {"name": "AgencyDNA", "icon": "🧬", "status": "active"},
            {"name": "ClientMagnet", "icon": "🧲", "status": "active"},
            {"name": "RevenueEngine", "icon": "💰", "status": "active"},
            {"name": "ContentFactory", "icon": "🎨", "status": "active"},
            {"name": "FranchiseManager", "icon": "🏢", "status": "active"},
            {"name": "VCMetrics", "icon": "📊", "status": "active"},
            {"name": "DataMoat", "icon": "🛡️", "status": "active"}
        ],
        "total_modules": 7,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/dna")
async def get_agency_dna() -> Dict[str, Any]:
    """Get AgencyDNA data"""
    if not demo_dna:
        raise HTTPException(status_code=404, detail="AgencyDNA not initialized")

    return {
        "name": demo_dna.name,
        "niche": demo_dna.niche,
        "location": demo_dna.location,
        "tone": demo_dna.tone.value,
        "tier": demo_dna.tier.value,
        "tagline": demo_dna.get_tagline(),
        "services": [
            {"name": s.name, "description": s.description, "price": s.price_usd}
            for s in demo_dna.services
        ]
    }

@router.get("/leads")
async def get_client_magnet() -> Dict[str, Any]:
    """Get ClientMagnet statistics"""
    if not demo_magnet:
        raise HTTPException(status_code=404, detail="ClientMagnet not initialized")

    stats = demo_magnet.get_stats()
    return {
        **stats,
        "pipeline_value_formatted": f"${stats['pipeline_value']:,}",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/revenue")
async def get_revenue_engine() -> Dict[str, Any]:
    """Get RevenueEngine metrics"""
    if not demo_engine:
        raise HTTPException(status_code=404, detail="RevenueEngine not initialized")

    stats = demo_engine.get_stats()
    mrr = stats.get('mrr', 0)
    arr = stats.get('arr', 0)
    total_revenue = stats.get('total_revenue_usd', 0)
    return {
        **stats,
        "mrr_usd": mrr,
        "arr_usd": arr,
        "mrr_formatted": f"${mrr:,.0f}",
        "arr_formatted": f"${arr:,.0f}",
        "total_revenue_usd": total_revenue,
        "total_revenue_formatted": f"${total_revenue:,.0f}",
        "collection_rate": (stats['paid_invoices'] / stats['total_invoices'] * 100) if stats['total_invoices'] > 0 else 0,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/content")
async def get_content_factory() -> Dict[str, Any]:
    """Get ContentFactory data"""
    if not demo_factory:
        raise HTTPException(status_code=404, detail="ContentFactory not initialized")

    stats = demo_factory.get_stats()
    return {
        **stats,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/franchise")
async def get_franchise_manager() -> Dict[str, Any]:
    """Get FranchiseManager statistics"""
    if not demo_franchise:
        raise HTTPException(status_code=404, detail="FranchiseManager not initialized")

    stats = demo_franchise.get_network_stats()
    # Get active territories from franchisees
    active_territory_values = set(f.territory.value for f in demo_franchise.franchisees if f.status.value == 'active')

    return {
        **stats,
        "total_territories": len(Territory),
        "covered_territories": stats['territories_covered'],
        "network_revenue_formatted": f"${stats['total_network_revenue']:,.0f}",
        "royalties_formatted": f"${stats['total_royalties_collected']:,.0f}",
        "territories": [
            {"name": t.value, "status": "active" if t.value in active_territory_values else "available"}
            for t in Territory
        ],
        "timestamp": datetime.now().isoformat()
    }

@router.get("/vc")
async def get_vc_metrics() -> Dict[str, Any]:
    """Get VCMetrics score and metrics"""
    if not demo_metrics:
        raise HTTPException(status_code=404, detail="VCMetrics not initialized")

    return {
        "score": demo_metrics.readiness_score(),
        "ltv_cac_ratio": demo_metrics.ltv_cac_ratio(),
        "rule_of_40": demo_metrics.rule_of_40(),
        "stage": demo_metrics.stage.value,
        "mrr": demo_metrics.mrr,
        "arr": demo_metrics.arr,
        "growth_rate": demo_metrics.growth_rate,
        "nrr": demo_metrics.nrr,
        "gross_margin": demo_metrics.gross_margin,
        "net_margin": demo_metrics.net_margin,
        "cac": demo_metrics.cac,
        "ltv": demo_metrics.ltv,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/moat")
async def get_data_moat() -> Dict[str, Any]:
    """Get DataMoat insights"""
    if not demo_moat:
        raise HTTPException(status_code=404, detail="DataMoat not initialized")

    strength = demo_moat.get_moat_strength()
    practices = demo_moat.get_best_practices("Nông sản")

    return {
        **strength,
        "best_practices": practices,
        "timestamp": datetime.now().isoformat()
    }

@router.post("/demo/reset")
async def reset_demo_data() -> Dict[str, str]:
    """Reset all demo data"""
    init_demo_data()
    return {"status": "success", "message": "Demo data reset successfully"}
