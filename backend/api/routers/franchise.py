from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from backend.core.security.audit import audit_action
from backend.core.security.rbac import require_viewer, require_admin

router = APIRouter(prefix="/api/franchise", tags=["Franchise"])

try:
    from core import FranchiseSystem

    if FranchiseSystem is not None:
        franchise = FranchiseSystem()
        FRANCHISE_AVAILABLE = True
    else:
        FRANCHISE_AVAILABLE = False
        franchise = None
except ImportError:
    FRANCHISE_AVAILABLE = False
    franchise = None


@router.get("/stats", dependencies=[Depends(require_viewer)])
@audit_action(action="view_franchise_stats")
def get_franchise_stats():
    """Get franchise network stats."""
    if not FRANCHISE_AVAILABLE:
        raise HTTPException(500, "Franchise not available")

    return franchise.get_network_stats()


@router.get("/hq-revenue", dependencies=[Depends(require_admin)])
@audit_action(action="view_hq_revenue")
def get_hq_revenue():
    """Get HQ revenue from franchises."""
    if not FRANCHISE_AVAILABLE:
        raise HTTPException(500, "Franchise not available")

    return franchise.get_hq_revenue()


@router.get("/territories", dependencies=[Depends(require_viewer)])
@audit_action(action="view_territories")
def get_territories(country: Optional[str] = None):
    """Get franchise territories."""
    if not FRANCHISE_AVAILABLE:
        raise HTTPException(500, "Franchise not available")

    territories = list(franchise.territories.values())
    if country:
        territories = [t for t in territories if t.country == country]

    return [
        {
            "id": t.id,
            "country": t.country,
            "region": t.region,
            "city": t.city,
            "population_k": t.population,
            "status": t.status.value,
        }
        for t in territories
    ]


@router.get("/franchisees", dependencies=[Depends(require_admin)])
@audit_action(action="view_franchisees")
def get_franchisees():
    """Get all franchisees."""
    if not FRANCHISE_AVAILABLE:
        raise HTTPException(500, "Franchise not available")

    return [
        {
            "id": f.id,
            "name": f.name,
            "company": f.company,
            "tier": f.tier.value,
            "status": f.status.value,
            "territories": f.territories,
            "monthly_fee": f.monthly_fee,
        }
        for f in franchise.franchisees.values()
    ]
