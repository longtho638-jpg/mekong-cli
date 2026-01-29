"""
Webhooks API.
"""

from fastapi import APIRouter

from .management import router as management_router
from .models import GumroadPurchase  # Keep for legacy compat if needed
from .router import router as webhook_router

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

# Include the new router with standard providers
router.include_router(webhook_router)

# Include management endpoints
router.include_router(management_router, prefix="/manage", tags=["Webhook Management"])

# Legacy Gumroad support (if still needed here, or moved to router.py)
# For now, we can import the gumroad handler if it was in __init__.py previously
# But to be clean, let's keep __init__.py minimal and delegate.

from . import router as router_module
# Note: The previous __init__.py had the implementation inline.
# We should probably port it to router.py or a dedicated gumroad.py
