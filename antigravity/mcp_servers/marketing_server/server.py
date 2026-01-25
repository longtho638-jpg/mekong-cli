"""
MCP Server Wrapper for Marketing Engine.
Handles JSON-RPC over stdio.
"""
import asyncio
from typing import Any, Dict, List

from antigravity.mcp.base import BaseMCPServer
from .handlers import MarketingHandler

class MarketingMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("marketing-server")
        self.handler = MarketingHandler()
        self.tools = [
            {
                "name": "content_pipeline",
                "description": "Run full content production pipeline (Topic -> Research -> Content -> SEO -> Social)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "topic": {
                            "type": "string",
                            "description": "Content topic or keyword"
                        }
                    },
                    "required": ["topic"]
                }
            },
            {
                "name": "lead_pipeline",
                "description": "Run lead generation and qualification pipeline",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "generate_ideas",
                "description": "Generate content ideas",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "count": {
                            "type": "integer",
                            "description": "Number of ideas to generate",
                            "default": 3
                        }
                    }
                }
            },
            {
                "name": "audit_seo",
                "description": "Perform an SEO audit on a URL",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "URL to audit"}
                    },
                    "required": ["url"]
                }
            },
            {
                "name": "analyze_cro",
                "description": "Analyze page for Conversion Rate Optimization",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "URL to analyze"},
                        "page_type": {"type": "string", "description": "Type of page (landing, pricing, etc.)", "default": "landing"}
                    },
                    "required": ["url"]
                }
            },
            {
                "name": "generate_copy",
                "description": "Generate marketing copy for a specific page type",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "page_type": {"type": "string", "description": "Type of page"},
                        "context": {"type": "object", "description": "Context about product and audience"}
                    },
                    "required": ["page_type"]
                }
            },
            {
                "name": "pricing_strategy",
                "description": "Develop a pricing strategy",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "product_type": {"type": "string", "description": "Type of product (SaaS, etc.)"},
                        "target_market": {"type": "string", "description": "Target audience (SMB, Enterprise)"}
                    },
                    "required": ["product_type", "target_market"]
                }
            }
        ]

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        """Dispatch tool calls to handler."""
        if name == "content_pipeline":
            topic = args.get("topic")
            return await self.handler.content_pipeline(topic)

        elif name == "lead_pipeline":
            return await self.handler.lead_pipeline()

        elif name == "generate_ideas":
            count = args.get("count", 3)
            return await self.handler.generate_ideas(count)

        elif name == "audit_seo":
            url = args.get("url")
            return await self.handler.audit_seo(url)

        elif name == "analyze_cro":
            url = args.get("url")
            page_type = args.get("page_type", "landing")
            return await self.handler.analyze_cro(url, page_type)

        elif name == "generate_copy":
            page_type = args.get("page_type")
            context = args.get("context", {})
            return await self.handler.generate_copy(page_type, context)

        elif name == "pricing_strategy":
            product_type = args.get("product_type")
            target_market = args.get("target_market")
            return await self.handler.pricing_strategy(product_type, target_market)

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = MarketingMCPServer()
    server.run()
