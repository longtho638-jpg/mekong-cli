#!/usr/bin/env python3
"""
🎨 UI Version Checker v1.0
==========================
Check UI package versions and sync status across all apps.
"""

import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional


def get_package_version(package_path: Path) -> Optional[str]:
    """Get version from package.json."""
    pkg_file = package_path / "package.json"
    if pkg_file.exists():
        data = json.loads(pkg_file.read_text())
        return data.get("version")
    return None


def check_ui_status():
    """Check UI package and integration status."""
    print("\n🎨 UI VERSION CHECKER")
    print("=" * 50)

    project_root = Path(__file__).parent.parent.parent

    # Check @agencyos/ui package
    ui_pkg = project_root / "packages/ui"
    ui_version = get_package_version(ui_pkg)

    print("\n📦 @agencyos/ui")
    print(f"   Version: {ui_version or 'Not found'}")

    if ui_pkg.exists():
        components_dir = ui_pkg / "src/components"
        if components_dir.exists():
            components = list(components_dir.glob("*.tsx"))
            print(f"   Components: {len(components)}")
            for comp in components:
                print(f"      → {comp.stem}")

    # Check dashboard integration
    dashboard = project_root / "apps/dashboard"
    dashboard_pkg = dashboard / "package.json"

    print("\n📊 Dashboard Integration")
    if dashboard_pkg.exists():
        data = json.loads(dashboard_pkg.read_text())
        deps = data.get("dependencies", {})
        if "@agencyos/ui" in deps:
            print(f"   ✅ @agencyos/ui: {deps['@agencyos/ui']}")
        else:
            print("   ⚠️ @agencyos/ui not installed")
            print("   Run: cd apps/dashboard && pnpm add @agencyos/ui@workspace:*")

    # Check git status
    print("\n📝 Last UI Commits")
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", "-3", "--", "packages/ui/"],
            capture_output=True,
            text=True,
            cwd=project_root,
        )
        if result.stdout.strip():
            for line in result.stdout.strip().split("\n"):
                print(f"   {line}")
        else:
            print("   No commits yet")
    except Exception:
        print("   Could not check git")

    print("\n" + "-" * 50)
    print(f"   Last check: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)


if __name__ == "__main__":
    check_ui_status()
