"""
🔗 Webhooks Router Facade
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from .models import GumroadPurchase
from .processor import process_purchase

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

# In-memory store (shared state)
_customers = {}
_purchases = []

@router.post("/gumroad")
async def gumroad_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        form_data = await request.form()
        data = dict(form_data)
        purchase = GumroadPurchase(
            email=data.get("email", ""),
            product_id=data.get("product_id", ""),
            product_name=data.get("product_name", "Unknown Product"),
            price=float(data.get("price", 0)),
            currency=data.get("currency", "USD"),
            sale_id=data.get("sale_id", ""),
            license_key=data.get("license_key"),
            purchaser_id=data.get("purchaser_id"),
        )
        background_tasks.add_task(process_purchase, purchase, _customers, _purchases)
        return {"status": "success", "message": "Purchase received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/customers")
async def list_customers():
    return {"count": len(_customers), "customers": list(_customers.values())}

@router.post("/license/validate")
async def validate_license(license_key: str, email: str):
    customer = _customers.get(email)
    if not customer or customer["license_key"] != license_key:
        raise HTTPException(status_code=401, detail="Invalid license")
    return {"valid": True, "product": customer["product_name"]}
