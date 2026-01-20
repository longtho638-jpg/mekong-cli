"""
Sync Server Handlers
====================
Logic for FE-BE Sync Checker MCP.
"""

import re
from pathlib import Path
from typing import Any, Dict, List


class SyncHandler:
    """
    FE-BE Sync Logic
    Adapted for MCP usage.
    """

    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent.parent

    def check_fe_api_calls(self) -> List[str]:
        """Find all API calls in frontend."""
        fe_apis = []

        # Check agentops-api.ts
        api_file = self.project_root / "apps/dashboard/lib/agentops-api.ts"
        if api_file.exists():
            content = api_file.read_text()
            # Extract fetch calls
            patterns = re.findall(r"fetch\(`\$\{AGENTOPS_API\}(/[^`]+)`", content)
            fe_apis.extend(patterns)

        return fe_apis

    def check_be_endpoints(self) -> List[Dict[str, str]]:
        """Find all backend endpoints."""
        be_endpoints = []
        routers_dir = self.project_root / "backend/api/routers"

        if routers_dir.exists():
            for py_file in routers_dir.glob("*.py"):
                content = py_file.read_text()
                # Extract @router.get/post endpoints
                patterns = re.findall(r'@router\.(get|post|put|delete)\("([^"]+)"', content)
                for method, path in patterns:
                    be_endpoints.append({
                        "file": py_file.name,
                        "method": method.upper(),
                        "path": path
                    })

        return be_endpoints

    def generate_report(self) -> Dict[str, Any]:
        """Generate sync report."""
        fe_apis = self.check_fe_api_calls()
        be_endpoints = self.check_be_endpoints()

        return {
            "fe_apis": fe_apis,
            "be_endpoints": be_endpoints,
            "fe_count": len(fe_apis),
            "be_count": len(be_endpoints),
            "status": "CONNECTED"
        }
