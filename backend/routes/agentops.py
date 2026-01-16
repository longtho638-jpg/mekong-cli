"""
🏯 AgentOps API Routes
Unified endpoint for all 50 AgentOps modules
agencyos.network DNA
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, Any
from enum import Enum
import os

router = APIRouter(prefix="/api/agentops", tags=["AgentOps"])


# ============ AgentOps Categories ============

class OpsCategory(str, Enum):
    """All AgentOps categories aligned with agencyos.network DNA"""
    # Sales
    SDR = "sdrops"
    AE = "aeops"
    SA = "saops"
    ISR = "isrops"
    OSR = "osrops"
    BDM = "bdmops"
    SALES = "sales"
    LEADGEN = "leadgenops"
    
    # Marketing
    SEO = "seoops"
    PPC = "ppcops"
    SOCIAL_MEDIA = "socialmediaops"
    CONTENT = "contentops"
    CONTENT_MARKETING = "contentmarketingops"
    EMAIL_MARKETING = "emailmarketingops"
    INFLUENCER = "influencermarketingops"
    PAID_SOCIAL = "paidsocialops"
    BRAND = "brandmanagerops"
    PRODUCT_MARKETING = "productmarketingops"
    DIGITAL_MARKETING = "digitalmarketingops"
    B2B_CONTENT = "b2bcontentops"
    B2B_MARKETING = "b2bmarketingops"
    MARKETING_MANAGER = "marketingmanagerops"
    MARKETING_ANALYST = "marketinganalystops"
    MARKETING_COORD = "marketingcoordops"
    MARKET_RESEARCH = "marketresearchops"
    EVENT_MARKETING = "eventmarketingops"
    ABM = "abmops"
    PR = "props"
    
    # Creative
    COPYWRITER = "copywriterops"
    CREATIVE_STRATEGIST = "creativestrategistops"
    MEDIA = "mediaops"
    
    # HR
    HR = "hrops"
    RECRUITER = "recruiterops"
    LD = "ldops"
    HRIS = "hrisops"
    HR_ANALYST = "hranalystops"
    COMPBEN = "compbenops"
    
    # Finance
    FIN = "finops"
    TAX = "taxops"
    
    # Engineering
    SWE = "sweops"
    SE = "seops"
    
    # Support
    CS = "csops"
    SERVICE = "serviceops"
    
    # Legal
    LEGAL = "legalops"
    IP = "ipops"
    
    # Admin
    ADMIN = "adminops"
    ER = "erops"
    
    # Ecommerce
    ECOMMERCE = "ecommerceops"
    AMAZON_FBA = "amazonfbaops"
    SM = "smops"  # Store Manager


# ============ Models ============

class OpsStatus(BaseModel):
    """Status of an AgentOps module"""
    name: str
    category: str
    status: str = "ready"
    agents_count: int = 0
    last_run: Optional[str] = None


class OpsExecuteRequest(BaseModel):
    """Request to execute an AgentOps action"""
    category: str
    action: str
    params: Dict[str, Any] = {}


class OpsExecuteResponse(BaseModel):
    """Response from AgentOps execution"""
    category: str
    action: str
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None


# ============ In-memory state ============

ops_registry: Dict[str, OpsStatus] = {}


def init_ops_registry():
    """Initialize all ops from enum"""
    for ops in OpsCategory:
        ops_registry[ops.value] = OpsStatus(
            name=ops.name.replace("_", " ").title(),
            category=ops.value,
            status="ready",
            agents_count=count_agents(ops.value)
        )


def count_agents(ops_name: str) -> int:
    """Count agents in an ops directory"""
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ops_path = os.path.join(base_path, "agents", ops_name)
    
    if os.path.exists(ops_path):
        py_files = [f for f in os.listdir(ops_path) if f.endswith('.py') and f != '__init__.py']
        return len(py_files)
    return 0


# Initialize on import
init_ops_registry()


# ============ Routes ============

@router.get("/")
async def list_all_ops():
    """
    📊 List all AgentOps modules
    Returns status of all 50 ops aligned with agencyos.network
    """
    categories = {
        "sales": [],
        "marketing": [],
        "creative": [],
        "hr": [],
        "finance": [],
        "engineering": [],
        "support": [],
        "legal": [],
        "admin": [],
        "ecommerce": []
    }
    
    # Categorize ops
    for name, ops in ops_registry.items():
        if name in ["sdrops", "aeops", "saops", "isrops", "osrops", "bdmops", "sales", "leadgenops"]:
            categories["sales"].append(ops)
        elif name in ["hrops", "recruiterops", "ldops", "hrisops", "hranalystops", "compbenops"]:
            categories["hr"].append(ops)
        elif name in ["finops", "taxops"]:
            categories["finance"].append(ops)
        elif name in ["sweops", "seops"]:
            categories["engineering"].append(ops)
        elif name in ["csops", "serviceops"]:
            categories["support"].append(ops)
        elif name in ["legalops", "ipops"]:
            categories["legal"].append(ops)
        elif name in ["adminops", "erops"]:
            categories["admin"].append(ops)
        elif name in ["ecommerceops", "amazonfbaops", "smops"]:
            categories["ecommerce"].append(ops)
        elif name in ["copywriterops", "creativestrategistops", "mediaops"]:
            categories["creative"].append(ops)
        else:
            categories["marketing"].append(ops)
    
    total_agents = sum(ops.agents_count for ops in ops_registry.values())
    
    return {
        "total_ops": len(ops_registry),
        "total_agents": total_agents,
        "categories": {k: [o.model_dump() for o in v] for k, v in categories.items()},
        "status": "all_ready"
    }


@router.get("/health")
async def health_check():
    """
    🏥 Health check for AgentOps system
    """
    healthy_count = sum(1 for ops in ops_registry.values() if ops.status == "ready")
    
    return {
        "status": "healthy" if healthy_count == len(ops_registry) else "degraded",
        "total_ops": len(ops_registry),
        "healthy_ops": healthy_count,
        "message": f"AgentOps: {healthy_count}/{len(ops_registry)} ready"
    }


@router.get("/{category}")
async def get_ops_status(category: str):
    """
    📈 Get status of specific AgentOps category
    """
    if category not in ops_registry:
        raise HTTPException(status_code=404, detail=f"Unknown ops: {category}")
    
    ops = ops_registry[category]
    
    return {
        "ops": ops.model_dump(),
        "available_actions": ["status", "execute", "reset"]
    }


@router.post("/execute")
async def execute_ops(request: OpsExecuteRequest):
    """
    ⚡ Execute an AgentOps action
    """
    if request.category not in ops_registry:
        raise HTTPException(status_code=404, detail=f"Unknown ops: {request.category}")
    
    ops = ops_registry[request.category]
    
    # TODO: Implement actual agent execution
    # For now, return mock success
    return OpsExecuteResponse(
        category=request.category,
        action=request.action,
        success=True,
        result={
            "ops": ops.name,
            "action": request.action,
            "params": request.params,
            "message": f"Executed {request.action} on {ops.name}"
        }
    )


@router.get("/categories/summary")
async def get_categories_summary():
    """
    📊 Summary by department category
    """
    summary = {
        "Sales": {"count": 8, "ready": 8},
        "Marketing": {"count": 20, "ready": 20},
        "Creative": {"count": 3, "ready": 3},
        "HR": {"count": 6, "ready": 6},
        "Finance": {"count": 2, "ready": 2},
        "Engineering": {"count": 2, "ready": 2},
        "Support": {"count": 2, "ready": 2},
        "Legal": {"count": 2, "ready": 2},
        "Admin": {"count": 2, "ready": 2},
        "Ecommerce": {"count": 3, "ready": 3},
    }
    
    return {
        "departments": summary,
        "total": sum(d["count"] for d in summary.values()),
        "all_ready": all(d["count"] == d["ready"] for d in summary.values()),
        "dna": "agencyos.network"
    }


# ============ Binh Phap Integration ============

@router.get("/binh-phap/chapters")
async def get_binh_phap_chapters():
    """
    🏯 Binh Pháp 13 Chapters - Strategic Layer
    Integrated within AgentOps DNA
    """
    chapters = [
        {"ch": 1, "name": "Kế Hoạch", "vi": "Planning", "ops": "strategy"},
        {"ch": 2, "name": "Tác Chiến", "vi": "Resources", "ops": "finops"},
        {"ch": 3, "name": "Mưu Công", "vi": "Strategy", "ops": "bdmops"},
        {"ch": 4, "name": "Hình Thế", "vi": "Positioning", "ops": "brandmanagerops"},
        {"ch": 5, "name": "Thế Trận", "vi": "Momentum", "ops": "marketingmanagerops"},
        {"ch": 6, "name": "Hư Thực", "vi": "Weakness", "ops": "shield"},
        {"ch": 7, "name": "Quân Tranh", "vi": "Maneuvering", "ops": "salesops"},
        {"ch": 8, "name": "Cửu Biến", "vi": "Adaptation", "ops": "pivotops"},
        {"ch": 9, "name": "Hành Quân", "vi": "Operations", "ops": "all_agentops"},
        {"ch": 10, "name": "Địa Hình", "vi": "Terrain", "ops": "marketresearchops"},
        {"ch": 11, "name": "Cửu Địa", "vi": "Situations", "ops": "crisisops"},
        {"ch": 12, "name": "Hỏa Công", "vi": "Disruption", "ops": "growthops"},
        {"ch": 13, "name": "Dụng Gián", "vi": "Intelligence", "ops": "scout"},
    ]
    
    return {
        "chapters": chapters,
        "total": 13,
        "dna": "VC Studio integrated with AgentOps"
    }
