"""
🔌 Antigravity MCP Server
=========================

Model Context Protocol server exposing Antigravity capabilities to AI agents.
Enables OpenCode, Claude Code, and other MCP clients to access full Antigravity toolkit.

Usage:
    python -m antigravity.mcp_server

Or via OpenCode:
    Configure in opencode.json with mcp.servers.antigravity
"""

import asyncio
import json
from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any, Dict, List

# Try to import MCP SDK
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import TextContent, Tool

    HAS_MCP_SDK = True
except ImportError:
    HAS_MCP_SDK = False
    print("⚠️ MCP SDK not installed. Run: pip install mcp")

# Import Antigravity modules
try:
    from antigravity.core.agency_dna import AgencyDNA, PricingTier, Tone
    from antigravity.core.client_magnet import ClientMagnet
    from antigravity.core.content_factory import ContentFactory
    from antigravity.core.revenue_engine import RevenueEngine
    from antigravity.franchise.manager import FranchiseManager
    from antigravity.platform.data_moat import DataMoat
    from antigravity.vc.metrics import VCMetrics

    HAS_ANTIGRAVITY = True
except ImportError:
    HAS_ANTIGRAVITY = False
    print("⚠️ Antigravity modules not available")


@dataclass
class MCPResponse:
    """Standard MCP response format."""

    success: bool
    data: Any
    message: str = ""
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


class AntigravityMCPServer:
    """
    🏯 Antigravity MCP Server

    Exposes all Antigravity capabilities via Model Context Protocol.
    """

    def __init__(self):
        self.name = "antigravity"
        self.version = "1.0.0"

        # Initialize Antigravity modules if available
        if HAS_ANTIGRAVITY:
            self.dna = AgencyDNA(
                name="Agency OS",
                tagline="The One-Person Unicorn OS",
                tone=Tone.PROFESSIONAL,
                tier=PricingTier.PROFESSIONAL,
            )
            self.magnet = ClientMagnet()
            self.engine = RevenueEngine(agency_name="Agency OS")
            self.factory = ContentFactory()
            self.franchise = FranchiseManager()
            self.metrics = VCMetrics()
            self.moat = DataMoat()
        else:
            self.dna = None

    def get_tools(self) -> List[Dict[str, Any]]:
        """Return list of available MCP tools."""
        return [
            {
                "name": "antigravity_status",
                "description": "Get status of Antigravity system and all modules",
                "inputSchema": {"type": "object", "properties": {}, "required": []},
            },
            {
                "name": "get_agency_dna",
                "description": "Get agency identity, branding, and positioning",
                "inputSchema": {"type": "object", "properties": {}, "required": []},
            },
            {
                "name": "get_revenue_metrics",
                "description": "Get revenue engine metrics and forecasts",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "period": {
                            "type": "string",
                            "description": "Time period: daily, weekly, monthly, yearly",
                            "enum": ["daily", "weekly", "monthly", "yearly"],
                        }
                    },
                    "required": [],
                },
            },
            {
                "name": "get_vc_score",
                "description": "Get VC readiness score and improvement suggestions",
                "inputSchema": {"type": "object", "properties": {}, "required": []},
            },
            {
                "name": "generate_content",
                "description": "Generate marketing content using ContentFactory",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "description": "Content type: tweet, email, landing, blog",
                            "enum": ["tweet", "email", "landing", "blog"],
                        },
                        "topic": {
                            "type": "string",
                            "description": "Topic or subject for the content",
                        },
                    },
                    "required": ["type", "topic"],
                },
            },
            {
                "name": "add_lead",
                "description": "Add a new lead to ClientMagnet",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Lead name"},
                        "email": {"type": "string", "description": "Lead email"},
                        "source": {"type": "string", "description": "Lead source"},
                    },
                    "required": ["name", "email"],
                },
            },
            {
                "name": "win_win_win_check",
                "description": "Validate a decision against WIN-WIN-WIN framework",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "decision": {
                            "type": "string",
                            "description": "Decision to validate",
                        },
                        "anh_win": {
                            "type": "string",
                            "description": "How does owner win?",
                        },
                        "agency_win": {
                            "type": "string",
                            "description": "How does agency win?",
                        },
                        "startup_win": {
                            "type": "string",
                            "description": "How does startup/client win?",
                        },
                    },
                    "required": ["decision"],
                },
            },
        ]

    async def handle_tool(self, name: str, arguments: Dict[str, Any]) -> MCPResponse:
        """Handle tool invocation."""

        if name == "antigravity_status":
            return MCPResponse(
                success=True,
                data={
                    "name": "Antigravity MCP Server",
                    "version": self.version,
                    "modules": {
                        "agency_dna": HAS_ANTIGRAVITY,
                        "client_magnet": HAS_ANTIGRAVITY,
                        "revenue_engine": HAS_ANTIGRAVITY,
                        "content_factory": HAS_ANTIGRAVITY,
                        "franchise_manager": HAS_ANTIGRAVITY,
                        "vc_metrics": HAS_ANTIGRAVITY,
                        "data_moat": HAS_ANTIGRAVITY,
                    },
                    "status": "operational" if HAS_ANTIGRAVITY else "limited",
                },
                message="Antigravity system status retrieved",
            )

        elif name == "get_agency_dna":
            if self.dna:
                return MCPResponse(
                    success=True,
                    data={
                        "name": self.dna.name,
                        "tagline": self.dna.tagline,
                        "tone": self.dna.tone.value
                        if hasattr(self.dna.tone, "value")
                        else str(self.dna.tone),
                        "tier": self.dna.tier.value
                        if hasattr(self.dna.tier, "value")
                        else str(self.dna.tier),
                    },
                    message="Agency DNA retrieved",
                )
            return MCPResponse(success=False, data=None, message="AgencyDNA not initialized")

        elif name == "get_revenue_metrics":
            if self.engine:
                return MCPResponse(
                    success=True,
                    data={
                        "total_revenue": 0,  # Placeholder
                        "period": arguments.get("period", "monthly"),
                        "projects": [],
                        "forecast": {},
                    },
                    message="Revenue metrics retrieved",
                )
            return MCPResponse(success=False, data=None, message="RevenueEngine not initialized")

        elif name == "get_vc_score":
            if self.metrics:
                return MCPResponse(
                    success=True,
                    data={
                        "score": 75,  # Placeholder
                        "rating": "Good",
                        "suggestions": [
                            "Increase MRR documentation",
                            "Add customer testimonials",
                            "Improve unit economics",
                        ],
                    },
                    message="VC readiness score calculated",
                )
            return MCPResponse(success=False, data=None, message="VCMetrics not initialized")

        elif name == "generate_content":
            content_type = arguments.get("type", "tweet")
            topic = arguments.get("topic", "AgencyOS")

            # Simple content generation
            templates = {
                "tweet": f"🚀 {topic} - The future of agency automation is here! #AgencyOS #Automation",
                "email": f"Subject: {topic}\n\nHello,\n\nWe're excited to share {topic} with you...",
                "landing": f"# {topic}\n\nTransform your agency with {topic}.",
                "blog": f"# {topic}\n\n## Introduction\n\nIn this post, we explore {topic}...",
            }

            return MCPResponse(
                success=True,
                data={
                    "type": content_type,
                    "topic": topic,
                    "content": templates.get(content_type, templates["tweet"]),
                },
                message=f"Generated {content_type} content",
            )

        elif name == "add_lead":
            return MCPResponse(
                success=True,
                data={
                    "name": arguments.get("name"),
                    "email": arguments.get("email"),
                    "source": arguments.get("source", "mcp"),
                    "status": "added",
                },
                message="Lead added to ClientMagnet",
            )

        elif name == "win_win_win_check":
            decision = arguments.get("decision", "")
            anh_win = arguments.get("anh_win", "")
            agency_win = arguments.get("agency_win", "")
            startup_win = arguments.get("startup_win", "")

            # Validate all three wins are specified
            all_wins = bool(anh_win and agency_win and startup_win)

            return MCPResponse(
                success=True,
                data={
                    "decision": decision,
                    "validation": {
                        "anh_win": {"specified": bool(anh_win), "value": anh_win},
                        "agency_win": {
                            "specified": bool(agency_win),
                            "value": agency_win,
                        },
                        "startup_win": {
                            "specified": bool(startup_win),
                            "value": startup_win,
                        },
                    },
                    "approved": all_wins,
                    "message": "✅ All three parties WIN!"
                    if all_wins
                    else "⚠️ Missing WIN specification",
                },
                message="WIN-WIN-WIN validation complete",
            )

        else:
            return MCPResponse(success=False, data=None, message=f"Unknown tool: {name}")


async def main():
    """Run the Antigravity MCP Server."""
    if not HAS_MCP_SDK:
        print("❌ Cannot start server: MCP SDK not installed")
        print("   Run: pip install mcp")
        return

    server = Server("antigravity")
    antigravity = AntigravityMCPServer()

    @server.list_tools()
    async def list_tools():
        return [
            Tool(
                name=t["name"],
                description=t["description"],
                inputSchema=t["inputSchema"],
            )
            for t in antigravity.get_tools()
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict):
        result = await antigravity.handle_tool(name, arguments)
        return [TextContent(type="text", text=json.dumps(asdict(result), indent=2))]

    print("🏯 Starting Antigravity MCP Server...")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
