"""
🏯 AGENCY OS - FastAPI Server
==============================

Production-ready API for the entire Agency OS platform.

Run: uvicorn server:app --reload --port 8000
Docs: http://localhost:8000/docs

"Không đánh mà thắng" - Win Without Fighting
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os

# Initialize FastAPI app
app = FastAPI(
    title="🏯 Agency OS API",
    description="The One-Person Unicorn Operating System API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════
# Initialize Services
# ═══════════════════════════════════════════════════════════

# i18n
try:
    from locales import i18n, t
    I18N_AVAILABLE = True
except ImportError:
    I18N_AVAILABLE = False

# Vietnam Region
try:
    from regions.vietnam import VietnamConfig, VietnamPricingEngine
    vietnam_config = VietnamConfig()
    vietnam_pricing = VietnamPricingEngine(vietnam_config)
    VIETNAM_AVAILABLE = True
except ImportError:
    VIETNAM_AVAILABLE = False

# Core Modules
try:
    from core import CRM, Scheduler, FranchiseSystem
    crm = CRM()
    scheduler = Scheduler()
    franchise = FranchiseSystem()
    CORE_AVAILABLE = True
except ImportError:
    CORE_AVAILABLE = False


# ═══════════════════════════════════════════════════════════
# Root & Health
# ═══════════════════════════════════════════════════════════

@app.get("/")
def root():
    """API root - Agency OS info."""
    return {
        "name": "Agency OS",
        "tagline": "The One-Person Unicorn Operating System",
        "version": "1.0.0",
        "binh_phap": "Không đánh mà thắng",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "i18n": I18N_AVAILABLE,
            "vietnam": VIETNAM_AVAILABLE,
            "core": CORE_AVAILABLE
        }
    }


# ═══════════════════════════════════════════════════════════
# i18n Endpoints
# ═══════════════════════════════════════════════════════════

@app.get("/api/i18n/locales")
def get_locales():
    """Get available locales."""
    if not I18N_AVAILABLE:
        raise HTTPException(500, "i18n not available")
    
    return {
        "locales": i18n.get_available_locales(),
        "current": i18n.get_locale()
    }


@app.get("/api/i18n/translate/{key}")
def translate(key: str, locale: Optional[str] = None):
    """Translate a key."""
    if not I18N_AVAILABLE:
        raise HTTPException(500, "i18n not available")
    
    if locale:
        return {"key": key, "value": i18n.translate(key, locale=locale)}
    return {"key": key, "value": t(key)}


@app.post("/api/i18n/locale/{locale}")
def set_locale(locale: str):
    """Set current locale."""
    if not I18N_AVAILABLE:
        raise HTTPException(500, "i18n not available")
    
    i18n.set_locale(locale)
    return {"locale": i18n.get_locale()}


# ═══════════════════════════════════════════════════════════
# Vietnam Region Endpoints
# ═══════════════════════════════════════════════════════════

@app.get("/api/vietnam/config")
def get_vietnam_config():
    """Get Vietnam region configuration."""
    if not VIETNAM_AVAILABLE:
        raise HTTPException(500, "Vietnam region not available")
    
    return vietnam_config.get_summary()


@app.get("/api/vietnam/provinces")
def get_vietnam_provinces():
    """Get all Vietnam provinces."""
    if not VIETNAM_AVAILABLE:
        raise HTTPException(500, "Vietnam region not available")
    
    return [
        {
            "code": p.code,
            "name_en": p.name_en,
            "name_vi": p.name_vi,
            "region": p.region.value,
            "population_k": p.population
        }
        for p in vietnam_config.provinces
    ]


@app.get("/api/vietnam/pricing")
def get_vietnam_pricing():
    """Get Vietnam service pricing."""
    if not VIETNAM_AVAILABLE:
        raise HTTPException(500, "Vietnam region not available")
    
    return {
        service: vietnam_pricing.get_local_price(service, in_usd=True)
        for service in vietnam_pricing.local_services.keys()
    }


@app.get("/api/vietnam/convert")
def convert_currency(usd: float = 100):
    """Convert USD to VND."""
    if not VIETNAM_AVAILABLE:
        raise HTTPException(500, "Vietnam region not available")
    
    vnd = vietnam_config.convert_usd_to_vnd(usd)
    return {
        "usd": vietnam_config.format_usd(usd),
        "vnd": vietnam_config.format_vnd(vnd),
        "rate": vietnam_config.exchange_rate
    }


# ═══════════════════════════════════════════════════════════
# CRM Endpoints
# ═══════════════════════════════════════════════════════════

@app.get("/api/crm/summary")
def get_crm_summary():
    """Get CRM summary."""
    if not CORE_AVAILABLE:
        raise HTTPException(500, "CRM not available")
    
    return crm.get_summary()


@app.get("/api/crm/deals")
def get_crm_deals():
    """Get all deals."""
    if not CORE_AVAILABLE:
        raise HTTPException(500, "CRM not available")
    
    return [
        {
            "id": d.id,
            "title": d.title,
            "value": d.value,
            "stage": d.stage.value,
            "contact_id": d.contact_id
        }
        for d in crm.deals.values()
    ]


@app.get("/api/crm/contacts")
def get_crm_contacts():
    """Get all contacts."""
    if not CORE_AVAILABLE:
        raise HTTPException(500, "CRM not available")
    
    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "company": c.company,
            "lead_score": c.lead_score
        }
        for c in crm.contacts.values()
    ]


@app.get("/api/crm/hot-leads")
def get_hot_leads():
    """Get hot leads."""
    if not CORE_AVAILABLE:
        raise HTTPException(500, "CRM not available")
    
    hot = crm.get_hot_leads()
    return [
        {
            "id": c.id,
            "name": c.name,
            "company": c.company,
            "lead_score": c.lead_score
        }
        for c in hot
    ]


# ═══════════════════════════════════════════════════════════
# Scheduler Endpoints
# ═══════════════════════════════════════════════════════════

@app.get("/api/scheduler/meetings")
def get_meetings():
    """Get upcoming meetings."""
    if not CORE_AVAILABLE:
        raise HTTPException(500, "Scheduler not available")
    
    upcoming = scheduler.get_upcoming_meetings()
    return [
        {
            "id": m.id,
            "type": m.meeting_type.value,
            "attendee": m.attendee_name,
            "start": m.start_time.isoformat(),
            "end": m.end_time.isoformat(),
            "link": m.meeting_link
        }
        for m in upcoming
    ]


@app.get("/api/scheduler/stats")
def get_scheduler_stats():
    """Get scheduler statistics."""
    if not CORE_AVAILABLE:
        raise HTTPException(500, "Scheduler not available")
    
    return scheduler.get_stats()


# ═══════════════════════════════════════════════════════════
# Franchise Endpoints
# ═══════════════════════════════════════════════════════════

@app.get("/api/franchise/stats")
def get_franchise_stats():
    """Get franchise network stats."""
    if not CORE_AVAILABLE:
        raise HTTPException(500, "Franchise not available")
    
    return franchise.get_network_stats()


@app.get("/api/franchise/hq-revenue")
def get_hq_revenue():
    """Get HQ revenue from franchises."""
    if not CORE_AVAILABLE:
        raise HTTPException(500, "Franchise not available")
    
    return franchise.get_hq_revenue()


@app.get("/api/franchise/territories")
def get_territories(country: Optional[str] = None):
    """Get franchise territories."""
    if not CORE_AVAILABLE:
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
            "status": t.status.value
        }
        for t in territories
    ]


@app.get("/api/franchise/franchisees")
def get_franchisees():
    """Get all franchisees."""
    if not CORE_AVAILABLE:
        raise HTTPException(500, "Franchise not available")
    
    return [
        {
            "id": f.id,
            "name": f.name,
            "company": f.company,
            "tier": f.tier.value,
            "status": f.status.value,
            "territories": f.territories,
            "monthly_fee": f.monthly_fee
        }
        for f in franchise.franchisees.values()
    ]


# ═══════════════════════════════════════════════════════════
# Run Server
# ═══════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    print("🏯 Starting Agency OS API Server...")
    print("📖 Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
