"""
MCP Tool Definitions.
"""

from typing import Any, Dict, List


def get_tools() -> List[Dict[str, Any]]:
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
