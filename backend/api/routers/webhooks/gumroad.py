"""
Gumroad Webhook Handler (Legacy).
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from .models import GumroadPurchase
from .processor import process_purchase

router = APIRouter()

# In-memory stores (shared state) - Note: In production this should be in DB
# Keeping as is from original file for compatibility
_customers = {}
_purchases = []
_affiliates = {}

@router.post("/gumroad")
async def gumroad_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        form_data = await request.form()
        data = dict(form_data)

        # Extract custom_fields if present (Gumroad sends as form fields)
        custom_fields = {}
        if "custom_fields" in data:
            import json
            try:
                custom_fields = json.loads(data.get("custom_fields", "{}"))
            except (json.JSONDecodeError, TypeError):
                # Fallback: check for individual custom field keys
                for key in data:
                    if key.startswith("custom_"):
                        custom_fields[key.replace("custom_", "")] = data[key]

        purchase = GumroadPurchase(
            email=data.get("email", ""),
            product_id=data.get("product_id", ""),
            product_name=data.get("product_name", "Unknown Product"),
            price=float(data.get("price", 0)),
            currency=data.get("currency", "USD"),
            sale_id=data.get("sale_id", ""),
            license_key=data.get("license_key"),
            purchaser_id=data.get("purchaser_id"),
            custom_fields=custom_fields if custom_fields else None,
        )
        background_tasks.add_task(
            process_purchase, purchase, _customers, _purchases, _affiliates
        )
        return {"status": "success", "message": "Purchase received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/customers")
async def list_customers():
    return {"count": len(_customers), "customers": list(_customers.values())}


@router.get("/affiliates")
async def list_affiliates():
    """List all affiliates and their stats."""
    return {
        "count": len(_affiliates),
        "affiliates": [
            {
                "code": aff["code"],
                "total_referrals": aff["total_referrals"],
                "total_sales": aff["total_sales"],
                "total_commission_pending": aff["total_commission_pending"],
                "total_commission_paid": aff["total_commission_paid"],
            }
            for aff in _affiliates.values()
        ]
    }


@router.get("/affiliates/{affiliate_code}")
async def get_affiliate_details(affiliate_code: str):
    """Get detailed affiliate information including all referrals."""
    if affiliate_code not in _affiliates:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    return _affiliates[affiliate_code]


@router.post("/license/validate")
async def validate_license(license_key: str, email: str):
    customer = _customers.get(email)
    if not customer or customer["license_key"] != license_key:
        raise HTTPException(status_code=401, detail="Invalid license")
    return {"valid": True, "product": customer["product_name"]}
