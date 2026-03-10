"""
RAAS License Management UI - FastAPI Web Interface

Phase 2/5: Local web UI for license management.
Serves HTML dashboard with real-time license status and activation form.
"""

import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
import uvicorn

from src.lib.raas_gate_validator import validate_at_startup, get_validator


def create_license_ui_app() -> FastAPI:
    """Create FastAPI app for license management UI."""

    app = FastAPI(
        title="RAAS License Manager",
        description="Local web interface for managing RAAS license",
        version="1.0.0",
    )

    # Enable CORS for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8080",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Template directory
    TEMPLATE_DIR = Path(__file__).parent / "templates"

    class ActivateLicenseRequest(BaseModel):
        license_key: str = Field(..., min_length=1, description="License key to activate")

    class ValidateLicenseRequest(BaseModel):
        license_key: str = Field(..., min_length=1, description="License key to validate")

    @app.get("/", response_class=HTMLResponse)
    async def license_dashboard():
        """Serve license management dashboard."""
        template_path = TEMPLATE_DIR / "license_dashboard.html"
        if not template_path.exists():
            raise HTTPException(status_code=404, detail="Dashboard template not found")

        with open(template_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read(), status_code=200)

    @app.get("/api/status")
    async def get_license_status():
        """Get current license status."""
        validator = get_validator()
        is_valid, error = validate_at_startup()

        # Get tier and features
        tier = validator.get_tier()
        features = validator.get_features()

        # Check if no license
        result = validator._run_validator() if hasattr(validator, '_run_validator') else {}
        no_license = result.get("no_license", False) if result else False

        return JSONResponse({
            "valid": is_valid,
            "tier": tier,
            "features": features,
            "feature_count": len(features),
            "no_license": no_license,
            "error": error if not is_valid else None,
            "status": "active" if is_valid else ("no_license" if no_license else "invalid"),
        })

    @app.post("/api/activate")
    async def activate_license(req: ActivateLicenseRequest):
        """Activate a license key by saving to .env file."""
        license_key = req.license_key.strip()

        # Validate key format
        if not license_key.startswith("raas") and not license_key.startswith("RPP-") and not license_key.startswith("REP-"):
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "Invalid license key format. Must start with 'raas', 'RPP-', or 'REP-'",
                }
            )

        # Save to .env file
        env_path = Path(".env")
        env_content = ""

        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                env_content = f.read()

            # Remove existing RAAS_LICENSE_KEY line
            lines = env_content.split("\n")
            lines = [line for line in lines if not line.strip().startswith("RAAS_LICENSE_KEY=")]
            env_content = "\n".join(lines)
            if env_content and not env_content.endswith("\n"):
                env_content += "\n"

        # Add new license key
        env_content += f"RAAS_LICENSE_KEY={license_key}\n"

        with open(env_path, "w", encoding="utf-8") as f:
            f.write(env_content)

        # Update environment variable for current session
        os.environ["RAAS_LICENSE_KEY"] = license_key

        # Validate the new license
        validator = get_validator()
        is_valid, error = validator.validate(license_key)

        if is_valid:
            tier = validator.get_tier()
            features = validator.get_features()
            return JSONResponse({
                "success": True,
                "message": "License activated successfully",
                "tier": tier,
                "features": features,
            })
        else:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": error or "License validation failed",
                }
            )

    @app.post("/api/validate")
    async def validate_license(req: ValidateLicenseRequest):
        """Validate a license key without activating."""
        license_key = req.license_key.strip()

        # Use validator to check
        validator = get_validator()
        is_valid, error = validator.validate(license_key)

        tier = validator.get_tier() if hasattr(validator, 'get_tier') else "unknown"
        features = validator.get_features() if hasattr(validator, 'get_features') else []

        return JSONResponse({
            "valid": is_valid,
            "tier": tier,
            "features": features,
            "feature_count": len(features),
            "error": error if not is_valid else None,
        })

    @app.post("/api/deactivate")
    async def deactivate_license():
        """Deactivate current license by removing from .env file."""
        env_path = Path(".env")

        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                env_content = f.read()

            # Remove RAAS_LICENSE_KEY line
            lines = env_content.split("\n")
            lines = [line for line in lines if not line.strip().startswith("RAAS_LICENSE_KEY=")]
            env_content = "\n".join(lines)

            with open(env_path, "w", encoding="utf-8") as f:
                f.write(env_content)

        # Remove from environment
        if "RAAS_LICENSE_KEY" in os.environ:
            del os.environ["RAAS_LICENSE_KEY"]

        return JSONResponse({
            "success": True,
            "message": "License deactivated",
            "tier": "free",
        })

    return app


# Create app instance
app = create_license_ui_app()


def run_license_ui(host: str = "127.0.0.1", port: int = 8080, open_browser: bool = True):
    """Run the license management UI server."""

    url = f"http://{host}:{port}"
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║  🚀 RAAS License Manager                                  ║
╠═══════════════════════════════════════════════════════════╣
║  Dashboard: {url}                                  ║
║                                                           ║
║  Press Ctrl+C to stop                                     ║
╚═══════════════════════════════════════════════════════════╝
    """)

    if open_browser:
        import webbrowser
        webbrowser.open(url, new=2)

    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    import sys

    host = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8080
    open_browser = "--no-open" not in sys.argv

    run_license_ui(host, port, open_browser)
