"""
MCP Server Wrapper for Agency Engine.
Handles JSON-RPC over stdio.
"""
import asyncio
from antigravity.mcp.base import BaseMCPServer
from typing import Any, Dict, List

from .handlers import AgencyHandler


class AgencyMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("agency-server")
        self.handler = AgencyHandler()
        self.tools = [
            {
                "name": "onboard_client",
                "description": "Run client onboarding pipeline (Contract -> Invoice -> Portal -> Welcome)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Client/company name"
                        },
                        "vertical": {
                            "type": "string",
                            "description": "Optional vertical name (healthcare, fintech, saas)"
                        }
                    },
                    "required": ["name"]
                }
            },
            {
                "name": "validate_win",
                "description": "Validate decision against WIN-WIN-WIN framework",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "decision": {
                            "type": "string",
                            "description": "Decision or opportunity to evaluate"
                        }
                    },
                    "required": ["decision"]
                }
            },
            {
                "name": "audit_client",
                "description": "Run a vertical-specific audit for a client (Healthcare, Fintech, SaaS)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "client_name": {
                            "type": "string",
                            "description": "Client/company name"
                        },
                        "vertical": {
                            "type": "string",
                            "description": "Vertical name (healthcare, fintech, saas)"
                        },
                        "system_config": {
                            "type": "object",
                            "description": "Optional system configuration to audit"
                        }
                    },
                    "required": ["client_name", "vertical"]
                }
            },
            {
                "name": "outreach_pipeline",
                "description": "Run urgent outreach campaign",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            }
        ]

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        """Dispatch tool calls to handler."""
        if name == "onboard_client":
            client_name = args.get("name")
            vertical = args.get("vertical")
            return await self.handler.onboard_client(client_name, vertical)

        elif name == "validate_win":
            decision = args.get("decision")
            return await self.handler.validate_win(decision)

        elif name == "audit_client":
            client_name = args.get("client_name")
            vertical = args.get("vertical")
            system_config = args.get("system_config")
            return await self.handler.audit_client(client_name, vertical, system_config)

        elif name == "outreach_pipeline":
            return await self.handler.outreach_pipeline()

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = AgencyMCPServer()
    server.run()
