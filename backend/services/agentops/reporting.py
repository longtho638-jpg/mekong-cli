"""
AgentOps Reporting - Logic for listing and summaries
"""
from typing import Any, Dict

class OpsReporting:
    """Generates reports and summaries for the AgentOps system."""

    def __init__(self, registry):
        self.registry = registry

    async def list_all_ops(self) -> Dict[str, Any]:
        """List all AgentOps modules organized by category"""
        ops_registry = self.registry.get_registry()
        categories = {
            "sales": [], "marketing": [], "creative": [], "hr": [],
            "finance": [], "engineering": [], "support": [], "legal": [],
            "admin": [], "ecommerce": [],
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
            "categories": {
                k: [o.model_dump() for o in v] for k, v in categories.items()
            },
            "status": "all_ready",
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
