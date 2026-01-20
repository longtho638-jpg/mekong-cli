"""
Command Router for Antigravity CLI.
Routes CLI slash commands to appropriate MCP Server tools.
"""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class Route:
    server: str
    tool: str
    args_map: Dict[str, str] = None

class CommandRouter:
    """Routes commands to MCP tools."""

    def __init__(self):
        self.routes = self._init_routes()

    def _init_routes(self) -> Dict[str, Route]:
        """Initialize command to MCP mapping."""
        return {
            # Revenue Commands -> Revenue Server
            "revenue": Route("revenue_server", "get_revenue_report"),
            "money": Route("revenue_server", "check_pipeline"),
            "sales": Route("revenue_server", "check_sales"),

            # Shipping Commands -> Coding Server
            "ship": Route("coding_server", "ship_feature", {"message": "message"}),
            "build": Route("coding_server", "build_project", {"feature": "feature"}),
            "deploy": Route("coding_server", "deploy_production"),

            # Recovery Commands -> Recovery Server
            "recover": Route("recovery_server", "auto_recover", {"target": "system"}),
            "fix": Route("recovery_server", "diagnose_issue", {"issue": "context"}),

            # Sync Commands -> Sync Server
            "sync": Route("sync_server", "check_sync_status"),
            "bridge": Route("sync_server", "sync_bridge"),

            # UI Commands -> UI Server
            "ui-check": Route("ui_server", "check_ui_version"),
            "design": Route("ui_server", "generate_component", {"prompt": "description"}),

            # Agency Commands -> Agency Server
            "onboard": Route("agency_server", "onboard_client", {"name": "name", "vertical": "vertical"}),
            "contract": Route("agency_server", "generate_contract", {"client": "name"}),
            "invoice": Route("agency_server", "generate_invoice", {"client": "name", "amount": "amount"}),

            # Strategy Commands -> Agency Server (Binh Phap)
            "binh-phap": Route("agency_server", "analyze_strategy", {"context": "situation"}),
            "win": Route("agency_server", "validate_win_win_win", {"decision": "proposal"}),
            "audit": Route("agency_server", "audit_client", {"client_name": "client_name", "vertical": "vertical"}),

            # Commander Commands -> Commander Server
            "status": Route("commander_server", "get_system_status"),
            "health": Route("commander_server", "health_check"),

            # Marketing Commands -> Marketing Server
            "marketing": Route("marketing_server", "generate_campaign", {"topic": "theme"}),
            "content": Route("marketing_server", "create_content", {"type": "format"}),
        }

    def get_route(self, command: str) -> Optional[Route]:
        """Get route for a command."""
        return self.routes.get(command)

    def resolve_args(self, route: Route, cli_args: List[str]) -> Dict[str, Any]:
        """Resolve CLI arguments to tool arguments."""
        if not route.args_map or not cli_args:
            return {}

        tool_args = {}
        # Simple positional mapping for now
        # In a real implementation, this would be more sophisticated
        list(route.args_map.keys())
        # The values in args_map are the keys expected by the tool
        tool_arg_names = list(route.args_map.values())
        
        for i, arg in enumerate(cli_args):
            if i < len(tool_arg_names):
                tool_args[tool_arg_names[i]] = arg

        return tool_args
