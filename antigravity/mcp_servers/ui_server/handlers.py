"""
UI Server Handlers
==================
Logic for UI Version Checker MCP.
"""

import asyncio
import json
import logging
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class UIHandler:
    """
    UI Checker Logic
    Adapted for MCP usage.
    """

    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent.parent

    def get_package_version(self, package_path: Path) -> Optional[str]:
        """Get version from package.json."""
        pkg_file = package_path / "package.json"
        if pkg_file.exists():
            try:
                data = json.loads(pkg_file.read_text())
                return data.get("version")
            except Exception as e:
                logger.error(f"Failed to read package version from {pkg_file}: {e}")
        return None

    async def check_status(self) -> Dict[str, Any]:
        """Check UI package and integration status."""
        logger.info("Checking UI status...")
        # Check @agencyos/ui package
        ui_pkg = self.project_root / "packages/ui"
        ui_version = self.get_package_version(ui_pkg)

        components: List[str] = []
        if ui_pkg.exists():
            components_dir = ui_pkg / "src/components"
            if components_dir.exists():
                components = [p.stem for p in components_dir.glob("*.tsx")]

        # Check dashboard integration
        dashboard = self.project_root / "apps/dashboard"
        dashboard_pkg = dashboard / "package.json"

        dashboard_deps: Dict[str, str] = {}
        if dashboard_pkg.exists():
            try:
                data = json.loads(dashboard_pkg.read_text())
                dashboard_deps = data.get("dependencies", {})
            except Exception as e:
                logger.error(f"Failed to read dashboard dependencies: {e}")

        # Check git status
        git_log: List[str] = []
        try:
            result = await asyncio.create_subprocess_exec(
                "git", "log", "--oneline", "-3", "--", "packages/ui/",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=self.project_root
            )
            stdout, _ = await asyncio.wait_for(result.communicate(), timeout=5)
            if stdout.strip():
                git_log = stdout.decode().strip().split("\n")
        except Exception as e:
            logger.debug(f"Git log check failed: {e}")

        return {
            "ui_version": ui_version,
            "component_count": len(components),
            "components": components,
            "dashboard_version": dashboard_deps.get("@agencyos/ui"),
            "git_log": git_log
        }
