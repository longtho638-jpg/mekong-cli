"""
Product Catalog Service
=======================
Manage and build sellable assets.
"""

import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

# Product Definitions
PRODUCT_SPECS = {
    "vscode-starter": {
        "name": "VSCode Starter Pack",
        "price": 0,
        "source": [".vscode", "CLAUDE.md"],
        "description": "Professional VSCode configuration for AI-assisted development",
    },
    "auth-starter": {
        "name": "Auth Starter (Supabase)",
        "price": 2700,
        "source": ["apps/auth-starter"],
        "description": "Production-ready authentication with Supabase",
    },
    "ai-skills-pack": {
        "name": "AI Skills Pack",
        "price": 2700,
        "source": [".agent/skills"],
        "description": "10+ AI agent skills for multimodal development",
    },
    "agency-workflows": {
        "name": "Agency Automation Workflows",
        "price": 4700,
        "source": [".agent/workflows"],
        "description": "Complete workflow automation for digital agencies",
    },
    "agencyos-core": {
        "name": "AgencyOS Core License",
        "price": 250000,
        "source": ["core", "cli", "scripts"],
        "description": "Complete Venture Operating System source code",
        "private": True,
    },
}


class ProductCatalogService:
    def __init__(self):
        self.root_dir = Path.cwd()
        self.products_dir = self.root_dir / "products"
        self.products_dir.mkdir(exist_ok=True)

    def list_products(self) -> Dict[str, Dict]:
        return PRODUCT_SPECS

    def scan_assets(self) -> Dict[str, Any]:
        """Check availability of product sources."""
        found = []
        missing = []

        for key, spec in PRODUCT_SPECS.items():
            sources_exist = []
            for src in spec["source"]:
                src_path = self.root_dir / src
                if src_path.exists():
                    sources_exist.append(str(src_path))

            if sources_exist:
                found.append({"key": key, "name": spec["name"], "sources": sources_exist})
            else:
                missing.append({"key": key, "name": spec["name"]})

        return {"found": found, "missing": missing}

    def build_product(self, key: str) -> str:
        """Build ZIP for a product."""
        spec = PRODUCT_SPECS.get(key)
        if not spec:
            raise ValueError(f"Product {key} not found")

        version = datetime.now().strftime("%Y%m%d")
        zip_name = f"{key}-v{version}.zip"
        zip_path = self.products_dir / zip_name

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for src in spec["source"]:
                src_path = self.root_dir / src
                if not src_path.exists():
                    continue

                if src_path.is_file():
                    zf.write(src_path, src_path.name)
                else:
                    for file in src_path.rglob("*"):
                        if file.is_file() and not any(
                            p in str(file) for p in ["__pycache__", ".git", "node_modules", ".env"]
                        ):
                            arcname = str(file.relative_to(src_path.parent))
                            zf.write(file, arcname)

            # README
            readme = f"# {spec['name']}\n\n{spec['description']}\n\nBuilt with AgencyOS"
            zf.writestr("README.md", readme)

        return str(zip_path)
