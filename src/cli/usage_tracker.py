"""
Usage Tracker — Track and sync usage metrics to RaaS Gateway.

Part of Phase 6: CLI Integration with RaaS Gateway
"""

import os
import json
import random
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional
from rich.console import Console

from src.cli.usage_types import UsageData

console = Console()


def get_usage_dir() -> Path:
    """Get the local usage tracking directory."""
    return Path.home() / ".mekong" / "usage"


def get_license_key(provided_key: Optional[str] = None) -> Optional[str]:
    """Resolve license key from argument, environment, or session."""
    if provided_key:
        return provided_key

    # Check environment
    env_key = os.getenv("RAAS_LICENSE_KEY")
    if env_key:
        return env_key

    # Check RaaS session
    try:
        from src.core.raas_auth import RaaSAuthClient

        client = RaaSAuthClient()
        session = client.get_session()
        if session.authenticated and session.tenant:
            return session.tenant.license_key
    except Exception:
        pass

    return None


def mask_license_key(license_key: str) -> str:
    """Mask license key for display."""
    if len(license_key) > 12:
        return f"{license_key[:8]}...{license_key[-4:]}"
    return "(hidden)"


def fetch_usage_from_gateway(
    license_key: str,
    start_hour: datetime,
    end_hour: datetime,
    auth_token: Optional[str] = None,
) -> Optional[UsageData]:
    """Fetch usage data from RaaS Gateway."""
    try:
        import requests
        from src.core.gateway_client import GatewayClient
        from src.core.raas_auth import get_auth_client

        client = GatewayClient()

        # Get auth token if not provided
        if not auth_token:
            auth_client = get_auth_client()
            session = auth_client.get_session()
            if session.authenticated:
                auth_token = session.token

        headers = {}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"

        usage_url = f"{client.gateway_url}/v1/usage"
        params = {
            "start_hour": start_hour.isoformat() + "Z",
            "end_hour": end_hour.isoformat() + "Z",
            "limit": 100,
        }

        response = requests.get(usage_url, headers=headers, params=params, timeout=10)

        if response.status_code == 200:
            return response.json()
        return None

    except Exception:
        return None


def generate_mock_usage(period: str) -> dict:
    """Generate mock usage data when gateway is unavailable."""
    total_requests = random.randint(100, 5000)
    total_tokens = total_requests * random.randint(500, 2000)
    total_duration = total_requests * random.randint(100, 5000)

    return {
        "summary": {
            "total_requests": total_requests,
            "total_tokens": total_tokens,
            "total_duration_ms": total_duration,
        },
        "period": period,
        "is_local": True,
    }


def sync_local_usage(force: bool = False, dry_run: bool = False) -> dict:
    """Sync local usage files to RaaS Gateway."""
    usage_dir = get_usage_dir()

    if not usage_dir.exists():
        return {"status": "no_data", "message": "No local usage data found"}

    usage_files = list(usage_dir.glob("*.json"))

    if not usage_files:
        return {"status": "no_files", "message": "No usage files to sync"}

    if dry_run:
        return {
            "status": "dry_run",
            "files": [str(f) for f in usage_files[:5]],
            "total_files": len(usage_files),
        }

    # Perform sync
    synced_count = 0
    failed_count = 0

    try:
        from src.raas.sync_client import get_sync_client

        client = get_sync_client()

        for usage_file in usage_files:
            try:
                with open(usage_file, "r") as f:
                    usage_data = json.load(f)

                result = client.sync_usage_batch(usage_data.get("events", []))

                if result.get("success"):
                    synced_count += len(usage_data.get("events", []))
                    # Archive processed file
                    archive_path = usage_dir / "archive" / usage_file.name
                    archive_path.parent.mkdir(exist_ok=True)
                    usage_file.rename(archive_path)
                else:
                    failed_count += 1

            except Exception as e:
                console.print(f"[dim]Error syncing {usage_file.name}: {str(e)}[/dim]")
                failed_count += 1

        return {
            "status": "complete" if failed_count == 0 else "partial",
            "synced_count": synced_count,
            "failed_count": failed_count,
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }


def get_period_bounds(period: str) -> tuple[datetime, datetime]:
    """Get start and end datetime for a period."""
    now = datetime.utcnow()

    if period == "current":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "previous":
        if now.month == 1:
            start = now.replace(year=now.year - 1, month=12, day=1, hour=0)
        else:
            start = now.replace(month=now.month - 1, day=1, hour=0)
    else:  # all
        start = now - timedelta(days=90)

    end = now.replace(hour=0, minute=0, second=0, microsecond=0)

    return start, end
