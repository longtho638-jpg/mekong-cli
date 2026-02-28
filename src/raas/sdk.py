"""Mekong RaaS SDK — Thin Python client for AgencyOS integration."""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterator

import httpx


class MekongAPIError(Exception):
    """Non-2xx response from the RaaS API."""

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"HTTP {status_code}: {detail}")


@dataclass
class Mission:
    """Single RaaS mission as returned by the API."""

    id: str
    status: str
    goal: str
    complexity: str
    credits_cost: int
    created_at: str
    started_at: str | None
    completed_at: str | None
    error_message: str | None
    logs_url: str | None


@dataclass
class DashboardSummary:
    """Aggregated tenant view: missions, credits, and platform health."""

    missions: dict
    credits: dict
    health: str


class MekongClient:
    """Synchronous HTTP client for the Mekong RaaS API.

    Args:
        base_url: Root URL of the RaaS gateway.
        api_key: Bearer token issued by the platform.
        timeout: Per-request timeout in seconds (default 30.0).
    """

    def __init__(self, base_url: str, api_key: str, timeout: float = 30.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._timeout = timeout

    @property
    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._api_key}"}

    def _request(self, method: str, path: str, **kwargs) -> dict:
        """Execute a request, return JSON body, raise MekongAPIError on non-2xx."""
        url = f"{self._base_url}{path}"
        with httpx.Client(timeout=self._timeout) as client:
            r = client.request(method, url, headers=self._headers, **kwargs)
        if not r.is_success:
            try:
                detail = r.json().get("detail", r.text)
            except Exception:
                detail = r.text
            raise MekongAPIError(r.status_code, detail)
        return r.json()

    def _parse_mission(self, data: dict) -> Mission:
        return Mission(
            id=data["id"], status=data["status"], goal=data["goal"],
            complexity=data["complexity"], credits_cost=data["credits_cost"],
            created_at=data["created_at"], started_at=data.get("started_at"),
            completed_at=data.get("completed_at"), error_message=data.get("error_message"),
            logs_url=data.get("logs_url"),
        )

    def create_mission(self, goal: str, complexity: str | None = None) -> Mission:
        """Submit a new mission. complexity: simple | standard | complex."""
        payload: dict = {"goal": goal}
        if complexity is not None:
            payload["complexity"] = complexity
        return self._parse_mission(self._request("POST", "/missions", json=payload))

    def get_mission(self, mission_id: str) -> Mission:
        """Fetch current state of a mission by UUID."""
        return self._parse_mission(self._request("GET", f"/missions/{mission_id}"))

    def cancel_mission(self, mission_id: str) -> Mission:
        """Request cancellation of a queued or running mission."""
        return self._parse_mission(self._request("POST", f"/missions/{mission_id}/cancel"))

    def list_missions(self, limit: int = 20, offset: int = 0) -> list[Mission]:
        """Retrieve a paginated list of missions for the authenticated tenant."""
        data = self._request("GET", "/missions", params={"limit": limit, "offset": offset})
        items = data if isinstance(data, list) else data.get("items", [])
        return [self._parse_mission(m) for m in items]

    def get_logs(self, mission_id: str) -> str:
        """Return raw execution log text for a mission."""
        url = f"{self._base_url}/missions/{mission_id}/logs"
        with httpx.Client(timeout=self._timeout) as client:
            r = client.get(url, headers=self._headers)
        if not r.is_success:
            try:
                detail = r.json().get("detail", r.text)
            except Exception:
                detail = r.text
            raise MekongAPIError(r.status_code, detail)
        return r.text

    def get_dashboard_summary(self) -> DashboardSummary:
        """Fetch aggregated tenant dashboard data."""
        data = self._request("GET", "/dashboard/summary")
        return DashboardSummary(
            missions=data.get("missions", {}),
            credits=data.get("credits", {}),
            health=data.get("health", "unknown"),
        )

    def stream_events(self) -> Iterator[dict]:
        """Consume the SSE event stream, yielding parsed JSON dicts per event."""
        url = f"{self._base_url}/events/stream"
        with httpx.Client(timeout=None) as client:
            with client.stream("GET", url, headers=self._headers) as r:
                if not r.is_success:
                    raise MekongAPIError(r.status_code, "SSE stream error")
                for line in r.iter_lines():
                    if line.startswith("data:"):
                        payload = line[5:].strip()
                        if payload:
                            try:
                                yield json.loads(payload)
                            except json.JSONDecodeError:
                                pass
