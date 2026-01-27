"""
MCP Server Wrapper for Workflow Engine.
Handles JSON-RPC over stdio.
"""
import asyncio
from antigravity.mcp.base import BaseMCPServer
from typing import Any, Dict, List

from .handlers import WorkflowEngineHandler


class WorkflowMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("workflow-server")
        self.handler = WorkflowEngineHandler()
        self.tools = [
            {
                "name": "list_workflows",
                "description": "List all available workflows",
                "inputSchema": {
                    "type": "object",
                    "properties": {},
                }
            },
            {
                "name": "execute_workflow",
                "description": "Execute a specific workflow by ID",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "workflow_id": {"type": "string", "description": "ID of the workflow to execute"},
                        "context": {"type": "object", "description": "Optional execution context data"}
                    },
                    "required": ["workflow_id"]
                }
            },
            {
                "name": "create_workflow",
                "description": "Create a new workflow",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "trigger_type": {
                            "type": "string",
                            "enum": ["manual", "cron", "webhook", "gumroad_sale", "new_lead", "email_received", "newsletter_subscribe", "newsletter_upgrade", "newsletter_limit_hit"]
                        },
                        "trigger_config": {"type": "object"}
                    },
                    "required": ["name", "trigger_type"]
                }
            }
        ]

    def get_tools(self) -> List[Dict[str, Any]]:
        return self.tools

    async def handle_tool_call(self, name: str, args: Dict[str, Any]) -> Any:
        """Dispatch tool calls to handler."""
        if name == "list_workflows":
            return self.handler.list_workflows()

        elif name == "execute_workflow":
            workflow_id = args.get("workflow_id")
            context = args.get("context", {})
            return self.handler.execute_workflow(workflow_id, context)

        elif name == "create_workflow":
            name_arg = args.get("name")
            trigger_type = args.get("trigger_type")
            trigger_config = args.get("trigger_config")
            return self.handler.create_workflow(name_arg, trigger_type, trigger_config)

        else:
            raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server = WorkflowMCPServer()
    server.run()
