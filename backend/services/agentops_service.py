"""
AgentOps Service - Business logic for AgentOps operations
"""

import os
from enum import Enum
from typing import Any, Dict, Optional
from backend.models.agentops import OpsStatus, OpsExecuteRequest, OpsExecuteResponse


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


class AgentOpsService:
    """Service for managing AgentOps operations"""
    
    def __init__(self):
        self.ops_registry: Dict[str, OpsStatus] = {}
        self._initialize_ops_registry()
    
    def _initialize_ops_registry(self):
        """Initialize all ops from enum"""
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        for ops in OpsCategory:
            agents_count = self._count_agents(ops.value, base_path)
            self.ops_registry[ops.value] = OpsStatus(
                name=ops.name.replace("_", " ").title(),
                category=ops.value,
                status="ready",
                agents_count=agents_count,
            )
    
    def _count_agents(self, ops_name: str, base_path: str) -> int:
        """Count agents in an ops directory"""
        ops_path = os.path.join(base_path, "backend", "agents", ops_name)
        
        if os.path.exists(ops_path):
            py_files = [
                f for f in os.listdir(ops_path) 
                if f.endswith(".py") and f != "__init__.py"
            ]
            return len(py_files)
        return 0
    
    async def list_all_ops(self) -> Dict[str, Any]:
        """List all AgentOps modules organized by category"""
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
            "ecommerce": [],
        }
        
        # Categorize ops
        for name, ops in self.ops_registry.items():
            if name in [
                "sdrops", "aeops", "saops", "isrops", "osrops", 
                "bdmops", "sales", "leadgenops"
            ]:
                categories["sales"].append(ops)
            elif name in [
                "hrops", "recruiterops", "ldops", "hrisops", 
                "hranalystops", "compbenops"
            ]:
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
        
        total_agents = sum(ops.agents_count for ops in self.ops_registry.values())
        
        return {
            "total_ops": len(self.ops_registry),
            "total_agents": total_agents,
            "categories": {k: [o.model_dump() for o in v] for k, v in categories.items()},
            "status": "all_ready",
        }
    
    async def get_ops_status(self, category: str) -> Dict[str, Any]:
        """Get status of specific AgentOps category"""
        if category not in self.ops_registry:
            raise ValueError(f"Unknown ops: {category}")
        
        ops = self.ops_registry[category]
        
        return {
            "ops": ops.model_dump(),
            "available_actions": ["status", "execute", "reset"],
        }
    
    async def execute_ops(self, request: OpsExecuteRequest) -> OpsExecuteResponse:
        """Execute an AgentOps action"""
        if request.category not in self.ops_registry:
            raise ValueError(f"Unknown ops: {request.category}")
        
        ops = self.ops_registry[request.category]
        
        # Simulated execution - in production would call actual agent
        return OpsExecuteResponse(
            category=request.category,
            action=request.action,
            success=True,
            result={
                "ops": ops.name,
                "action": request.action,
                "params": request.params,
                "message": f"Executed {request.action} on {ops.name}",
            }
        )
    
    async def get_health_check(self) -> Dict[str, Any]:
        """Get health check for AgentOps system"""
        healthy_count = sum(1 for ops in self.ops_registry.values() if ops.status == "ready")
        
        return {
            "status": "healthy" if healthy_count == len(self.ops_registry) else "degraded",
            "total_ops": len(self.ops_registry),
            "healthy_ops": healthy_count,
            "message": f"AgentOps: {healthy_count}/{len(self.ops_registry)} ready",
        }
    
    async def get_categories_summary(self) -> Dict[str, Any]:
        """Get summary by department category"""
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
            "dna": "agencyos.network",
        }
    
    async def get_binh_phap_chapters(self) -> Dict[str, Any]:
        """Get Binh Pháp 13 Chapters integrated with AgentOps"""
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
            "dna": "VC Studio integrated with AgentOps",
        }