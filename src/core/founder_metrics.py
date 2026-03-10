"""Founder Metrics — /founder metrics backend.

KPI intelligence engine: north star metric selection, KPI hierarchy setup,
alert rules configuration, weekly metrics dashboard, and daily alert checks.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

ProductType = Literal["saas", "usage_based", "marketplace", "devtool", "content"]
AlertSeverity = Literal["critical", "warning", "celebration"]
MetricTrend = Literal["growing", "stable", "declining"]


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class NorthStarMetric:
    """The single most important metric."""

    name: str
    description: str
    target: float
    current: float = 0.0
    unit: str = ""

    @property
    def pct_to_target(self) -> float:
        if self.target == 0:
            return 0.0
        return round((self.current / self.target) * 100, 1)


@dataclass
class KPIMetric:
    """A single KPI in the hierarchy."""

    name: str
    tier: int  # 1=north star, 2=growth, 3=health, 4=leading
    category: str  # revenue, acquisition, retention, product, operations
    target: str
    current: float = 0.0
    unit: str = ""


@dataclass
class AlertRule:
    """An alert trigger rule."""

    name: str
    severity: AlertSeverity
    condition: str
    threshold: float
    action: str


@dataclass
class MetricsConfig:
    """Complete metrics configuration."""

    north_star: NorthStarMetric
    kpis: list[KPIMetric]
    alerts: list[AlertRule]
    product_type: str


@dataclass
class MetricSnapshot:
    """A point-in-time metrics snapshot."""

    timestamp: str
    north_star_value: float
    north_star_trend: MetricTrend
    metrics: dict[str, float]
    alerts_triggered: list[str] = field(default_factory=list)
    celebrations: list[str] = field(default_factory=list)


# ── North Star Selection ─────────────────────────────────────────────

NORTH_STAR_MAP: dict[str, dict[str, str]] = {
    "saas": {
        "name": "MRR (Monthly Recurring Revenue)",
        "description": "Every decision asks: does this grow MRR?",
        "unit": "$",
    },
    "usage_based": {
        "name": "MAU x Avg Usage Per User",
        "description": "Users who actually use the product",
        "unit": "active-units",
    },
    "marketplace": {
        "name": "GMV (Gross Merchandise Value)",
        "description": "Total value transacted through platform",
        "unit": "$",
    },
    "devtool": {
        "name": "Daily Active Developers",
        "description": "Devs who shipped code using your tool today",
        "unit": "devs",
    },
    "content": {
        "name": "Weekly Active Readers",
        "description": "People who come back every week",
        "unit": "readers",
    },
}


def select_north_star(
    product_type: str, target: float = 0.0
) -> NorthStarMetric:
    """Select north star metric based on product type."""
    config = NORTH_STAR_MAP.get(product_type)
    if not config:
        config = NORTH_STAR_MAP["saas"]
    return NorthStarMetric(
        name=config["name"],
        description=config["description"],
        target=target,
        unit=config["unit"],
    )


# ── KPI Hierarchy ────────────────────────────────────────────────────


def build_kpi_hierarchy(product_type: str) -> list[KPIMetric]:
    """Build standard KPI hierarchy for product type."""
    kpis = [
        # Tier 2 — Growth
        KPIMetric("mrr", 2, "revenue", "15% growth/mo", unit="$"),
        KPIMetric("new_mrr", 2, "revenue", "positive each month", unit="$"),
        KPIMetric("churned_mrr", 2, "revenue", "< 5% of total MRR", unit="$"),
        KPIMetric("net_new_mrr", 2, "revenue", "positive", unit="$"),
        KPIMetric("new_signups", 2, "acquisition", "growing WoW"),
        KPIMetric("activation_rate", 2, "acquisition", "> 40%", unit="%"),
        KPIMetric("paid_conversion", 2, "acquisition", "> 5%", unit="%"),
        KPIMetric("cac", 2, "acquisition", "< LTV/3", unit="$"),
        # Tier 3 — Health
        KPIMetric("wk1_retention", 3, "retention", "> 60%", unit="%"),
        KPIMetric("mo1_retention", 3, "retention", "> 80%", unit="%"),
        KPIMetric("churn_rate", 3, "retention", "< 5% monthly", unit="%"),
        KPIMetric("ltv", 3, "retention", "> 3x CAC", unit="$"),
        KPIMetric("dau_mau_ratio", 3, "product", "> 0.2"),
        KPIMetric("support_tickets", 3, "product", "decreasing trend"),
    ]

    # Add ops metrics for usage-based / saas with agents
    if product_type in ("saas", "usage_based"):
        kpis.extend([
            KPIMetric("mcu_per_user", 3, "operations", "stable or growing"),
            KPIMetric("agent_success_rate", 3, "operations", "> 90%", unit="%"),
            KPIMetric("llm_cost_margin", 3, "operations", "> 60%", unit="%"),
        ])

    # Tier 4 — Leading indicators
    kpis.extend([
        KPIMetric("trial_to_paid_velocity", 4, "leading", "< 7 days avg"),
        KPIMetric("engagement_score", 4, "leading", "growing"),
        KPIMetric("referral_rate", 4, "leading", "> 10%", unit="%"),
    ])

    return kpis


# ── Alert Rules ──────────────────────────────────────────────────────


def build_alert_rules() -> list[AlertRule]:
    """Build default alert rule set."""
    return [
        # Critical
        AlertRule("mrr_drop", "critical", "MRR drops > 5% WoW", 5.0,
                  "/founder churn --analyze"),
        AlertRule("high_churn", "critical", "Churn rate > 10% monthly", 10.0,
                  "Investigate churn causes immediately"),
        AlertRule("agent_failure", "critical", "Agent success rate < 80%", 80.0,
                  "Check agent configs and prompts"),
        AlertRule("low_margin", "critical", "MCU margin < 60%", 60.0,
                  "Review LLM costs and pricing"),
        # Warning
        AlertRule("low_activation", "warning", "Activation rate < 40%", 40.0,
                  "Review onboarding flow"),
        AlertRule("low_engagement", "warning", "DAU/MAU < 0.15", 0.15,
                  "Investigate feature adoption"),
        AlertRule("support_spike", "warning", "Support tickets spike > 2x", 2.0,
                  "Check for product issues"),
        # Celebration
        AlertRule("mrr_1k", "celebration", "MRR milestone $1K", 1000,
                  "Share publicly! /launch tweet"),
        AlertRule("mrr_10k", "celebration", "MRR milestone $10K", 10000,
                  "Investor update time"),
        AlertRule("100_customers", "celebration", "100th customer", 100,
                  "Case study from top customer"),
    ]


# ── Metrics Setup ────────────────────────────────────────────────────


def setup_metrics(
    product_type: str, north_star_target: float = 0.0
) -> MetricsConfig:
    """Full metrics setup: north star + KPIs + alerts."""
    return MetricsConfig(
        north_star=select_north_star(product_type, north_star_target),
        kpis=build_kpi_hierarchy(product_type),
        alerts=build_alert_rules(),
        product_type=product_type,
    )


# ── Dashboard Check ──────────────────────────────────────────────────


def check_metrics(
    base_dir: str, mcu_gate=None, tenant_id: str = "default"
) -> MetricSnapshot:
    """Pull current metrics and generate dashboard snapshot."""
    base = Path(base_dir)
    metrics: dict[str, float] = {}
    alerts_triggered: list[str] = []
    celebrations: list[str] = []

    # Read MCU data if gate available
    if mcu_gate:
        try:
            balance = mcu_gate.get_balance(tenant_id)
            metrics["mcu_balance"] = balance
        except Exception:
            pass

    # Read memory for task stats
    memory_file = base / ".mekong" / "memory.json"
    if memory_file.exists():
        try:
            memory = json.loads(memory_file.read_text())
            tasks = memory if isinstance(memory, list) else memory.get("tasks", [])
            metrics["tasks_total"] = len(tasks)
            completed = [t for t in tasks if isinstance(t, dict) and t.get("status") == "done"]
            metrics["tasks_completed"] = len(completed)
            if tasks:
                metrics["success_rate"] = round(len(completed) / len(tasks) * 100, 1)
        except (json.JSONDecodeError, TypeError):
            pass

    # Determine north star trend
    trend: MetricTrend = "stable"
    ns_value = metrics.get("mcu_balance", 0.0)

    # Check for alert conditions
    sr = metrics.get("success_rate", 100.0)
    if sr < 80:
        alerts_triggered.append("agent_failure: success rate below 80%")
    elif sr < 90:
        alerts_triggered.append("low_success_rate: success rate below 90% (warning)")

    return MetricSnapshot(
        timestamp=datetime.now(timezone.utc).isoformat(),
        north_star_value=ns_value,
        north_star_trend=trend,
        metrics=metrics,
        alerts_triggered=alerts_triggered,
        celebrations=celebrations,
    )


# ── Alert Check (for daily cron) ─────────────────────────────────────


def check_alerts(
    base_dir: str, config: MetricsConfig | None = None
) -> list[dict[str, str]]:
    """Run alert checks against current metrics. Returns triggered alerts."""
    snapshot = check_metrics(base_dir)
    triggered: list[dict[str, str]] = []

    for alert_msg in snapshot.alerts_triggered:
        triggered.append({
            "severity": "critical" if "failure" in alert_msg else "warning",
            "message": alert_msg,
            "timestamp": snapshot.timestamp,
        })

    return triggered


# ── File I/O ─────────────────────────────────────────────────────────


def save_metrics_config(base_dir: str, config: MetricsConfig) -> list[str]:
    """Save metrics config to .mekong/founder/."""
    founder_dir = Path(base_dir) / ".mekong" / "founder"
    founder_dir.mkdir(parents=True, exist_ok=True)
    saved: list[str] = []

    # Metrics config
    path = founder_dir / "metrics-config.json"
    path.write_text(json.dumps(asdict(config), indent=2, ensure_ascii=False))
    saved.append(str(path))

    # Alert rules (separate for cron access)
    path = founder_dir / "alert-rules.json"
    path.write_text(json.dumps(
        [asdict(a) for a in config.alerts],
        indent=2, ensure_ascii=False,
    ))
    saved.append(str(path))

    return saved


def save_snapshot(base_dir: str, snapshot: MetricSnapshot) -> str:
    """Save metrics snapshot."""
    reports_dir = Path(base_dir) / ".mekong" / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    ts = datetime.now(timezone.utc).strftime("%Y%m%d")
    path = reports_dir / f"metrics-{ts}.json"
    path.write_text(json.dumps(asdict(snapshot), indent=2, ensure_ascii=False))
    return str(path)
