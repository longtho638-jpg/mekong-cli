"""
Antigravity API Endpoints
"""

from antigravity.franchise.manager import Territory
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from . import demo

router = APIRouter(prefix="/api/antigravity", tags=["antigravity"])


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
            {"name": "DataMoat", "icon": "🛡️", "status": "active"},
        ],
        "total_modules": 7,
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/dna")
async def get_agency_dna() -> Dict[str, Any]:
    """Get AgencyDNA data"""
    if not demo.demo_dna:
        raise HTTPException(status_code=404, detail="AgencyDNA not initialized")

    return {
        "name": demo.demo_dna.name,
        "niche": demo.demo_dna.niche,
        "location": demo.demo_dna.location,
        "tone": demo.demo_dna.tone.value,
        "tier": demo.demo_dna.tier.value,
        "tagline": demo.demo_dna.get_tagline(),
        "services": [
            {"name": s.name, "description": s.description, "price": s.price_usd}
            for s in demo.demo_dna.services
        ],
    }


@router.get("/leads")
async def get_client_magnet() -> Dict[str, Any]:
    """Get ClientMagnet statistics"""
    if not demo.demo_magnet:
        raise HTTPException(status_code=404, detail="ClientMagnet not initialized")

    stats = demo.demo_magnet.get_stats()
    return {
        **stats,
        "pipeline_value_formatted": f"${stats['pipeline_value']:,}",
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/revenue")
async def get_revenue_engine() -> Dict[str, Any]:
    """Get RevenueEngine metrics"""
    if not demo.demo_engine:
        raise HTTPException(status_code=404, detail="RevenueEngine not initialized")

    stats = demo.demo_engine.get_stats()
    mrr = stats.get("mrr", 0)
    arr = stats.get("arr", 0)
    total_revenue = stats.get("total_revenue_usd", 0)
    return {
        **stats,
        "mrr_usd": mrr,
        "arr_usd": arr,
        "mrr_formatted": f"${mrr:,.0f}",
        "arr_formatted": f"${arr:,.0f}",
        "total_revenue_usd": total_revenue,
        "total_revenue_formatted": f"${total_revenue:,.0f}",
        "collection_rate": (stats["paid_invoices"] / stats["total_invoices"] * 100)
        if stats["total_invoices"] > 0
        else 0,
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/content")
async def get_content_factory() -> Dict[str, Any]:
    """Get ContentFactory data"""
    if not demo.demo_factory:
        raise HTTPException(status_code=404, detail="ContentFactory not initialized")

    stats = demo.demo_factory.get_stats()
    return {**stats, "timestamp": datetime.now().isoformat()}


@router.get("/franchise")
async def get_franchise_manager() -> Dict[str, Any]:
    """Get FranchiseManager statistics"""
    if not demo.demo_franchise:
        raise HTTPException(status_code=404, detail="FranchiseManager not initialized")

    stats = demo.demo_franchise.get_network_stats()
    # Get active territories from franchisees
    active_territory_values = set(
        f.territory.value
        for f in demo.demo_franchise.franchisees
        if f.status.value == "active"
    )

    return {
        **stats,
        "total_territories": len(Territory),
        "covered_territories": stats["territories_covered"],
        "network_revenue_formatted": f"${stats['total_network_revenue']:,.0f}",
        "royalties_formatted": f"${stats['total_royalties_collected']:,.0f}",
        "territories": [
            {
                "name": t.value,
                "status": "active" if t.value in active_territory_values else "available",
            }
            for t in Territory
        ],
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/vc")
async def get_vc_metrics() -> Dict[str, Any]:
    """Get VCMetrics score and metrics"""
    if not demo.demo_metrics:
        raise HTTPException(status_code=404, detail="VCMetrics not initialized")

    return {
        "score": demo.demo_metrics.readiness_score(),
        "ltv_cac_ratio": demo.demo_metrics.ltv_cac_ratio(),
        "rule_of_40": demo.demo_metrics.rule_of_40(),
        "stage": demo.demo_metrics.stage.value,
        "mrr": demo.demo_metrics.mrr,
        "arr": demo.demo_metrics.arr,
        "growth_rate": demo.demo_metrics.growth_rate,
        "nrr": demo.demo_metrics.nrr,
        "gross_margin": demo.demo_metrics.gross_margin,
        "net_margin": demo.demo_metrics.net_margin,
        "cac": demo.demo_metrics.cac,
        "ltv": demo.demo_metrics.ltv,
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/moat")
async def get_data_moat() -> Dict[str, Any]:
    """Get DataMoat insights"""
    if not demo.demo_moat:
        raise HTTPException(status_code=404, detail="DataMoat not initialized")

    strength = demo.demo_moat.get_moat_strength()
    practices = demo.demo_moat.get_best_practices("Nông sản")

    return {
        **strength,
        "best_practices": practices,
        "timestamp": datetime.now().isoformat(),
    }


@router.post("/demo/reset")
async def reset_demo_data() -> Dict[str, str]:
    """Reset all demo data"""
    demo.init_demo_data()
    return {"status": "success", "message": "Demo data reset successfully"}
