from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/vietnam", tags=["Vietnam Region"])

try:
    from regions.vietnam import VietnamConfig, VietnamPricingEngine
    vietnam_config = VietnamConfig()
    vietnam_pricing = VietnamPricingEngine(vietnam_config)
    VIETNAM_AVAILABLE = True
except ImportError:
    VIETNAM_AVAILABLE = False

@router.get("/config")
def get_vietnam_config():
    """Get Vietnam region configuration."""
    if not VIETNAM_AVAILABLE:
        raise HTTPException(500, "Vietnam region not available")
    
    return vietnam_config.get_summary()

@router.get("/provinces")
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

@router.get("/pricing")
def get_vietnam_pricing():
    """Get Vietnam service pricing."""
    if not VIETNAM_AVAILABLE:
        raise HTTPException(500, "Vietnam region not available")
    
    return {
        service: vietnam_pricing.get_local_price(service, in_usd=True)
        for service in vietnam_pricing.local_services.keys()
    }

@router.get("/convert")
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
