from fastapi import APIRouter
from backend.api.schemas import CommandRequest
import sys
import os

# Ensure core is reachable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from core.hybrid_router import HybridRouter
    hybrid_router = HybridRouter()
    ROUTER_AVAILABLE = True
except ImportError:
    ROUTER_AVAILABLE = False
    hybrid_router = None

router = APIRouter(prefix="/api/router", tags=["Hybrid Router"])

@router.get("/stats")
async def get_router_stats():
    """Get Hybrid Router statistics"""
    if not ROUTER_AVAILABLE:
        return {"error": "Hybrid Router not available"}
        
    stats = hybrid_router.get_stats()
    return {
        "stats": stats,
        "strategy": {
            "boss": "GPT-4/Gemini Pro (complex tasks)",
            "worker": "Llama 3.1 (simple tasks)"
        },
        "target_savings": "70%"
    }

@router.post("/route")
async def route_task(request: CommandRequest):
    """Route a task to optimal AI provider"""
    if not ROUTER_AVAILABLE:
        return {"error": "Hybrid Router not available"}

    task_type, complexity = HybridRouter.analyze_task(request.prompt)
    result = hybrid_router.route(task_type, complexity, len(request.prompt.split()) * 2)
    
    return {
        "provider": result.provider,
        "model": result.model,
        "estimated_cost": result.estimated_cost,
        "reason": result.reason,
        "task_analysis": {
            "type": task_type.value,
            "complexity": complexity.value
        }
    }
