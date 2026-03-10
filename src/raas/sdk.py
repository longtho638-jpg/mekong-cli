"""Mekong RaaS SDK — Python client aligned with /v1/ API endpoints."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Dict, Iterator, List, Optional

import httpx


class MekongAPIError(Exception):
    """Non-2xx response from the RaaS API."""

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"HTTP {status_code}: {detail}")


# ---------------------------------------------------------------------------
# Response dataclasses
# ---------------------------------------------------------------------------


@dataclass
class StepDetail:
    """Single step result within a completed task."""

    order: int
    title: str
    passed: bool
    exit_code: int
    summary: str


@dataclass
class Task:
    """Task state returned by GET /v1/tasks/{id}."""

    task_id: str
    status: str
    goal: str
    tenant_id: str
    total_steps: int = 0
    completed_steps: int = 0
    failed_steps: int = 0
    success_rate: float = 0.0
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    steps: List[StepDetail] = field(default_factory=list)


@dataclass
class TaskResult:
    """Immediate response from POST /v1/tasks."""

    task_id: str
    status: str
    tenant_id: str


@dataclass
class AgentInfo:
    """Agent metadata from GET /v1/agents."""

    name: str
    description: str


@dataclass
class AgentResult:
    """Response from POST /v1/agents/{name}/run."""

    agent: str
    status: str
    output: str
    errors: List[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Marketing response dataclasses
# ---------------------------------------------------------------------------


@dataclass
class ContentTemplate:
    """Content template fetched from RaaS Gateway."""

    template_id: str
    name: str
    description: str
    content_type: str
    channel: str
    template: str
    placeholders: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TemplateMetadata:
    """Metadata about available templates."""

    total: int
    categories: List[str]
    channels: List[str]
    content_types: List[str]


@dataclass
class RenderedContent:
    """Rendered content with injected analytics."""

    content_id: str
    template_id: str
    channel: str
    content_type: str
    rendered_content: str
    placeholders_used: Dict[str, Any]
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PerformanceData:
    """Performance metadata for published content."""

    content_id: str
    template_id: str
    channel: str
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    engagement_rate: float = 0.0
    click_through_rate: float = 0.0
    conversion_rate: float = 0.0
    revenue: float = 0.0
    published_at: str = ""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_sse_line(line: str) -> Optional[dict]:
    """Parse a single SSE line, returning the JSON payload or None."""
    if not line.startswith("data:"):
        return None
    payload = line[5:].strip()
    if not payload:
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def _parse_step(data: dict) -> StepDetail:
    return StepDetail(
        order=data["order"],
        title=data["title"],
        passed=data["passed"],
        exit_code=data["exit_code"],
        summary=data["summary"],
    )


def _parse_task(data: dict) -> Task:
    steps = [_parse_step(s) for s in data.get("steps", [])]
    return Task(
        task_id=data["task_id"],
        status=data["status"],
        goal=data["goal"],
        tenant_id=data["tenant_id"],
        total_steps=data.get("total_steps", 0),
        completed_steps=data.get("completed_steps", 0),
        failed_steps=data.get("failed_steps", 0),
        success_rate=data.get("success_rate", 0.0),
        errors=data.get("errors", []),
        warnings=data.get("warnings", []),
        steps=steps,
    )


def _raise_for_status(response: httpx.Response) -> None:
    """Raise MekongAPIError for non-2xx responses."""
    if response.is_success:
        return
    try:
        detail = response.json().get("detail", response.text)
    except Exception:
        detail = response.text
    raise MekongAPIError(response.status_code, detail)


# ---------------------------------------------------------------------------
# Synchronous client
# ---------------------------------------------------------------------------


class MekongClient:
    """Synchronous HTTP client for the Mekong RaaS /v1/ API.

    Args:
        base_url: Root URL of the RaaS gateway (e.g. ``https://api.mekong.dev``).
        api_key: Bearer token issued by the platform.
        timeout: Per-request timeout in seconds (default 30).
    """

    def __init__(self, base_url: str, api_key: str, timeout: float = 30.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._timeout = timeout

    @property
    def _headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self._api_key}"}

    def _request(self, method: str, path: str, **kwargs: Any) -> dict:
        url = f"{self._base_url}{path}"
        with httpx.Client(timeout=self._timeout) as client:
            r = client.request(method, url, headers=self._headers, **kwargs)
        _raise_for_status(r)
        return r.json()

    # -- Tasks ---------------------------------------------------------------

    def submit_task(self, goal: str, agent: Optional[str] = None,
                    recipe: Optional[str] = None,
                    options: Optional[Dict[str, Any]] = None) -> TaskResult:
        """Submit a goal for async execution (POST /v1/tasks)."""
        payload: Dict[str, Any] = {"goal": goal}
        if agent is not None:
            payload["agent"] = agent
        if recipe is not None:
            payload["recipe"] = recipe
        if options:
            payload["options"] = options
        data = self._request("POST", "/v1/tasks", json=payload)
        return TaskResult(
            task_id=data["task_id"], status=data["status"],
            tenant_id=data["tenant_id"],
        )

    def get_task(self, task_id: str) -> Task:
        """Poll full status for a task (GET /v1/tasks/{task_id})."""
        return _parse_task(self._request("GET", f"/v1/tasks/{task_id}"))

    def stream_task(self, task_id: str) -> Iterator[dict]:
        """Stream SSE events for a task (GET /v1/tasks/{task_id}/stream).

        Yields parsed JSON dicts for each ``data:`` line.
        """
        url = f"{self._base_url}/v1/tasks/{task_id}/stream"
        with httpx.Client(timeout=None) as client:
            with client.stream("GET", url, headers=self._headers) as r:
                _raise_for_status(r)
                for line in r.iter_lines():
                    event = _parse_sse_line(line)
                    if event is not None:
                        yield event

    # -- Agents --------------------------------------------------------------

    def list_agents(self) -> List[AgentInfo]:
        """List registered agents (GET /v1/agents)."""
        data = self._request("GET", "/v1/agents")
        return [AgentInfo(name=a["name"], description=a["description"]) for a in data]

    def run_agent(self, name: str, goal: str,
                  options: Optional[Dict[str, Any]] = None) -> AgentResult:
        """Run a named agent (POST /v1/agents/{name}/run)."""
        payload: Dict[str, Any] = {"goal": goal}
        if options:
            payload["options"] = options
        data = self._request("POST", f"/v1/agents/{name}/run", json=payload)
        return AgentResult(
            agent=data["agent"], status=data["status"],
            output=data["output"], errors=data.get("errors", []),
        )

    # -- Marketing -----------------------------------------------------------

    def list_marketing_templates(
        self,
        category: Optional[str] = None,
        channel: Optional[str] = None,
        content_type: Optional[str] = None,
    ) -> List[ContentTemplate]:
        """
        List available content templates from RaaS Gateway.

        Args:
            category: Filter by content category (e.g., "social", "email")
            channel: Filter by distribution channel (e.g., "linkedin", "twitter")
            content_type: Filter by content type (e.g., "thread", "blog_post")

        Returns:
            List of ContentTemplate objects
        """
        params = {}
        if category:
            params["category"] = category
        if channel:
            params["channel"] = channel
        if content_type:
            params["content_type"] = content_type

        data = self._request("GET", "/v1/marketing/templates", params=params)
        return [
            ContentTemplate(
                template_id=template["template_id"],
                name=template["name"],
                description=template["description"],
                content_type=template["content_type"],
                channel=template["channel"],
                template=template["template"],
                placeholders=template.get("placeholders", []),
                metadata=template.get("metadata", {}),
            )
            for template in data.get("templates", [])
        ]

    def get_marketing_template(self, template_id: str) -> ContentTemplate:
        """
        Get a specific content template by ID.

        Args:
            template_id: ID of the template to retrieve

        Returns:
            ContentTemplate object
        """
        data = self._request("GET", f"/v1/marketing/templates/{template_id}")
        return ContentTemplate(
            template_id=data["template_id"],
            name=data["name"],
            description=data["description"],
            content_type=data["content_type"],
            channel=data["channel"],
            template=data["template"],
            placeholders=data.get("placeholders", []),
            metadata=data.get("metadata", {}),
        )

    def get_marketing_template_metadata(self) -> TemplateMetadata:
        """
        Get metadata about available templates (categories, channels, content types).

        Returns:
            TemplateMetadata object
        """
        data = self._request("GET", "/v1/marketing/templates/metadata")
        return TemplateMetadata(
            total=data["total"],
            categories=data["categories"],
            channels=data["channels"],
            content_types=data["content_types"],
        )

    def render_marketing_content(
        self, template_id: str, placeholders: Dict[str, Any]
    ) -> RenderedContent:
        """
        Render a content template with dynamic placeholders.

        Args:
            template_id: ID of the template to render
            placeholders: Dictionary of placeholder values to inject

        Returns:
            RenderedContent object
        """
        payload = {"template_id": template_id, "placeholders": placeholders}
        data = self._request("POST", "/v1/marketing/render", json=payload)
        return RenderedContent(
            content_id=data["content_id"],
            template_id=data["template_id"],
            channel=data["channel"],
            content_type=data["content_type"],
            rendered_content=data["rendered_content"],
            placeholders_used=data["placeholders_used"],
            metadata=data.get("metadata", {}),
        )

    def track_marketing_performance(self, performance: PerformanceData) -> Dict[str, Any]:
        """
        Track performance metadata for published content.

        Args:
            performance: PerformanceData object containing metrics

        Returns:
            API response
        """
        payload = {
            "content_id": performance.content_id,
            "template_id": performance.template_id,
            "channel": performance.channel,
            "impressions": performance.impressions,
            "clicks": performance.clicks,
            "conversions": performance.conversions,
            "engagement_rate": performance.engagement_rate,
            "click_through_rate": performance.click_through_rate,
            "conversion_rate": performance.conversion_rate,
            "revenue": performance.revenue,
            "published_at": performance.published_at,
        }
        return self._request("POST", "/v1/marketing/performance", json=payload)

    def get_marketing_performance(self, content_id: str) -> PerformanceData:
        """
        Get performance data for specific content.

        Args:
            content_id: ID of the content to get performance for

        Returns:
            PerformanceData object
        """
        data = self._request("GET", f"/v1/marketing/performance/{content_id}")
        return PerformanceData(
            content_id=data["content_id"],
            template_id=data["template_id"],
            channel=data["channel"],
            impressions=data["impressions"],
            clicks=data["clicks"],
            conversions=data["conversions"],
            engagement_rate=data["engagement_rate"],
            click_through_rate=data["click_through_rate"],
            conversion_rate=data["conversion_rate"],
            revenue=data["revenue"],
            published_at=data["published_at"],
        )


# ---------------------------------------------------------------------------
# Async client
# ---------------------------------------------------------------------------


class MekongAsyncClient:
    """Async HTTP client for the Mekong RaaS /v1/ API.

    Args:
        base_url: Root URL of the RaaS gateway.
        api_key: Bearer token issued by the platform.
        timeout: Per-request timeout in seconds (default 30).
    """

    def __init__(self, base_url: str, api_key: str, timeout: float = 30.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._timeout = timeout

    @property
    def _headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self._api_key}"}

    async def _request(self, method: str, path: str, **kwargs: Any) -> dict:
        url = f"{self._base_url}{path}"
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            r = await client.request(method, url, headers=self._headers, **kwargs)
        _raise_for_status(r)
        return r.json()

    # -- Tasks ---------------------------------------------------------------

    async def submit_task(self, goal: str, agent: Optional[str] = None,
                          recipe: Optional[str] = None,
                          options: Optional[Dict[str, Any]] = None) -> TaskResult:
        """Submit a goal for async execution (POST /v1/tasks)."""
        payload: Dict[str, Any] = {"goal": goal}
        if agent is not None:
            payload["agent"] = agent
        if recipe is not None:
            payload["recipe"] = recipe
        if options:
            payload["options"] = options
        data = await self._request("POST", "/v1/tasks", json=payload)
        return TaskResult(
            task_id=data["task_id"], status=data["status"],
            tenant_id=data["tenant_id"],
        )

    async def get_task(self, task_id: str) -> Task:
        """Poll full status for a task (GET /v1/tasks/{task_id})."""
        data = await self._request("GET", f"/v1/tasks/{task_id}")
        return _parse_task(data)

    async def stream_task(self, task_id: str) -> AsyncIterator[dict]:
        """Stream SSE events for a task (GET /v1/tasks/{task_id}/stream).

        Yields parsed JSON dicts for each ``data:`` line.
        """
        url = f"{self._base_url}/v1/tasks/{task_id}/stream"
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("GET", url, headers=self._headers) as r:
                _raise_for_status(r)
                async for line in r.aiter_lines():
                    event = _parse_sse_line(line)
                    if event is not None:
                        yield event

    # -- Agents --------------------------------------------------------------

    async def list_agents(self) -> List[AgentInfo]:
        """List registered agents (GET /v1/agents)."""
        data = await self._request("GET", "/v1/agents")
        return [AgentInfo(name=a["name"], description=a["description"]) for a in data]

    async def run_agent(self, name: str, goal: str,
                        options: Optional[Dict[str, Any]] = None) -> AgentResult:
        """Run a named agent (POST /v1/agents/{name}/run)."""
        payload: Dict[str, Any] = {"goal": goal}
        if options:
            payload["options"] = options
        data = await self._request("POST", f"/v1/agents/{name}/run", json=payload)
        return AgentResult(
            agent=data["agent"], status=data["status"],
            output=data["output"], errors=data.get("errors", []),
        )

    # -- Marketing -----------------------------------------------------------

    async def list_marketing_templates(
        self,
        category: Optional[str] = None,
        channel: Optional[str] = None,
        content_type: Optional[str] = None,
    ) -> List[ContentTemplate]:
        """
        List available content templates from RaaS Gateway.

        Args:
            category: Filter by content category (e.g., "social", "email")
            channel: Filter by distribution channel (e.g., "linkedin", "twitter")
            content_type: Filter by content type (e.g., "thread", "blog_post")

        Returns:
            List of ContentTemplate objects
        """
        params = {}
        if category:
            params["category"] = category
        if channel:
            params["channel"] = channel
        if content_type:
            params["content_type"] = content_type

        data = await self._request("GET", "/v1/marketing/templates", params=params)
        return [
            ContentTemplate(
                template_id=template["template_id"],
                name=template["name"],
                description=template["description"],
                content_type=template["content_type"],
                channel=template["channel"],
                template=template["template"],
                placeholders=template.get("placeholders", []),
                metadata=template.get("metadata", {}),
            )
            for template in data.get("templates", [])
        ]

    async def get_marketing_template(self, template_id: str) -> ContentTemplate:
        """
        Get a specific content template by ID.

        Args:
            template_id: ID of the template to retrieve

        Returns:
            ContentTemplate object
        """
        data = await self._request("GET", f"/v1/marketing/templates/{template_id}")
        return ContentTemplate(
            template_id=data["template_id"],
            name=data["name"],
            description=data["description"],
            content_type=data["content_type"],
            channel=data["channel"],
            template=data["template"],
            placeholders=data.get("placeholders", []),
            metadata=data.get("metadata", {}),
        )

    async def get_marketing_template_metadata(self) -> TemplateMetadata:
        """
        Get metadata about available templates (categories, channels, content types).

        Returns:
            TemplateMetadata object
        """
        data = await self._request("GET", "/v1/marketing/templates/metadata")
        return TemplateMetadata(
            total=data["total"],
            categories=data["categories"],
            channels=data["channels"],
            content_types=data["content_types"],
        )

    async def render_marketing_content(
        self, template_id: str, placeholders: Dict[str, Any]
    ) -> RenderedContent:
        """
        Render a content template with dynamic placeholders.

        Args:
            template_id: ID of the template to render
            placeholders: Dictionary of placeholder values to inject

        Returns:
            RenderedContent object
        """
        payload = {"template_id": template_id, "placeholders": placeholders}
        data = await self._request("POST", "/v1/marketing/render", json=payload)
        return RenderedContent(
            content_id=data["content_id"],
            template_id=data["template_id"],
            channel=data["channel"],
            content_type=data["content_type"],
            rendered_content=data["rendered_content"],
            placeholders_used=data["placeholders_used"],
            metadata=data.get("metadata", {}),
        )

    async def track_marketing_performance(self, performance: PerformanceData) -> Dict[str, Any]:
        """
        Track performance metadata for published content.

        Args:
            performance: PerformanceData object containing metrics

        Returns:
            API response
        """
        payload = {
            "content_id": performance.content_id,
            "template_id": performance.template_id,
            "channel": performance.channel,
            "impressions": performance.impressions,
            "clicks": performance.clicks,
            "conversions": performance.conversions,
            "engagement_rate": performance.engagement_rate,
            "click_through_rate": performance.click_through_rate,
            "conversion_rate": performance.conversion_rate,
            "revenue": performance.revenue,
            "published_at": performance.published_at,
        }
        return await self._request("POST", "/v1/marketing/performance", json=payload)

    async def get_marketing_performance(self, content_id: str) -> PerformanceData:
        """
        Get performance data for specific content.

        Args:
            content_id: ID of the content to get performance for

        Returns:
            PerformanceData object
        """
        data = await self._request("GET", f"/v1/marketing/performance/{content_id}")
        return PerformanceData(
            content_id=data["content_id"],
            template_id=data["template_id"],
            channel=data["channel"],
            impressions=data["impressions"],
            clicks=data["clicks"],
            conversions=data["conversions"],
            engagement_rate=data["engagement_rate"],
            click_through_rate=data["click_through_rate"],
            conversion_rate=data["conversion_rate"],
            revenue=data["revenue"],
            published_at=data["published_at"],
        )
