"""Hybrid LLM Router - Task Classifier (ALGO 1).

Phân loại task thành profile để routing đến model phù hợp.
Reference: hybrid-llm-router-spec.md
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass
class TaskProfile:
    """Output của TaskClassifier."""

    complexity: Literal["simple", "standard", "complex", "bulk"]
    domain: Literal["code", "creative", "ops", "analysis", "sales", "support"]
    agent_role: Literal["cto", "cmo", "coo", "cfo", "cs", "sales", "editor", "data"]
    requires_reasoning: bool
    requires_creativity: bool
    data_sensitivity: Literal["public", "internal", "sensitive"]
    estimated_tokens: int = 0
    mcu_cost: int = 1
    preferred_tier: Literal["local", "api_cheap", "api_mid", "api_best"] = "api_cheap"


class TaskClassifier:
    """ALGO 1: Phân loại task → TaskProfile."""

    # STEP 1 — DOMAIN DETECTION
    DOMAIN_SIGNALS = {
        "code": [
            "code",
            "implement",
            "fix",
            "deploy",
            "bug",
            "api",
            "function",
            "class",
            "test",
            "refactor",
            "build",
            "script",
            "database",
        ],
        "creative": [
            "write",
            "content",
            "blog",
            "email",
            "copy",
            "post",
            "announce",
            "marketing",
            "social",
            "newsletter",
            "landing",
            "viết",
        ],
        "ops": [
            "monitor",
            "check",
            "status",
            "health",
            "backup",
            "cron",
            "alert",
            "restart",
            "log",
            "metrics",
            "uptime",
        ],
        "analysis": [
            "report",
            "analyze",
            "chart",
            "revenue",
            "usage",
            "trend",
            "summary",
            "dashboard",
            "insight",
            "data",
            "stats",
        ],
        "sales": [
            "upsell",
            "churn",
            "follow-up",
            "lead",
            "convert",
            "offer",
            "trial",
            "upgrade",
            "retention",
            "email sequence",
        ],
        "support": [
            "ticket",
            "user report",
            "error message",
            "help",
            "faq",
            "refund",
            "complaint",
            "không hiểu",
            "lỗi",
        ],
    }

    # STEP 2 — AGENT ROLE ASSIGNMENT
    DOMAIN_TO_AGENT = {
        "code": "cto",
        "creative": "cmo",
        "ops": "coo",
        "analysis": "data",
        "sales": "sales",
        "support": "cs",
    }

    # STEP 3 — COMPLEXITY SCORING
    COMPLEXITY_MAP = {
        range(0, 3): "simple",  # 0-2
        range(3, 5): "standard",  # 3-4
        range(5, 7): "complex",  # 5-6
        range(7, 100): "complex",  # 7+
    }

    # STEP 6 — MCU COST ASSIGNMENT
    MCU_COST_MAP = {
        "simple": 1,
        "standard": 3,
        "complex": 5,
        "bulk": 5,  # hard cap
    }

    def classify(self, goal: str, context: dict | None = None) -> TaskProfile:
        """Phân loại task thành TaskProfile.

        Args:
            goal: Natural language goal
            context: Optional context (tenant_id, history, etc.)

        Returns:
            TaskProfile với đầy đủ metadata
        """
        context = context or {}

        # STEP 1: Domain detection
        domain = self._detect_domain(goal)

        # STEP 2: Agent role assignment
        agent_role = self._assign_agent_role(goal, domain)

        # STEP 3: Complexity scoring
        complexity = self._score_complexity(goal, domain)

        # STEP 4: Reasoning + Creativity flags
        requires_reasoning = self._check_requires_reasoning(goal, domain, complexity)
        requires_creativity = self._check_requires_creativity(goal, domain)

        # STEP 5: Data sensitivity
        data_sensitivity = self._detect_data_sensitivity(goal)

        # STEP 6: MCU cost assignment
        mcu_cost = self.MCU_COST_MAP.get(complexity, 1)

        # Token estimation
        estimated_tokens = self._estimate_tokens(complexity)

        # Preferred tier (set in ALGO 2, default here)
        preferred_tier = self._determine_preferred_tier(
            data_sensitivity, agent_role
        )

        return TaskProfile(
            complexity=complexity,
            domain=domain,
            agent_role=agent_role,
            requires_reasoning=requires_reasoning,
            requires_creativity=requires_creativity,
            data_sensitivity=data_sensitivity,
            estimated_tokens=estimated_tokens,
            mcu_cost=mcu_cost,
            preferred_tier=preferred_tier,
        )

    def _detect_domain(self, goal: str) -> Literal["code", "creative", "ops", "analysis", "sales", "support"]:
        """Bước 1: Domain detection bằng keyword matching."""
        goal_lower = goal.lower()
        domain_scores: dict[str, int] = {d: 0 for d in self.DOMAIN_SIGNALS}

        for domain, keywords in self.DOMAIN_SIGNALS.items():
            for keyword in keywords:
                if keyword in goal_lower:
                    domain_scores[domain] += 1

        # Return domain có score cao nhất
        max_score = max(domain_scores.values())
        if max_score == 0:
            return "ops"  # Default domain

        for domain, score in domain_scores.items():
            if score == max_score:
                return domain  # type: ignore

        return "ops"

    def _assign_agent_role(
        self, goal: str, domain: str
    ) -> Literal["cto", "cmo", "coo", "cfo", "cs", "sales", "editor", "data"]:
        """Bước 2: Agent role assignment với override rules."""
        goal_lower = goal.lower()

        # Override rules
        if any(kw in goal_lower for kw in ["changelog", "docs", "tutorial"]):
            return "editor"
        if any(kw in goal_lower for kw in ["revenue", "polar", "invoice"]):
            return "cfo"
        if "marketing" in goal_lower and "email" in goal_lower:
            return "cmo"

        return self.DOMAIN_TO_AGENT.get(domain, "coo")  # type: ignore

    def _score_complexity(
        self, goal: str, domain: str
    ) -> Literal["simple", "standard", "complex", "bulk"]:
        """Bước 3: Complexity scoring."""
        score = 0

        # Token estimation heuristic
        word_count = len(goal.split())
        if word_count < 15:
            score += 1
        elif word_count <= 40:
            score += 2
        else:
            score += 3

        # File scope signals
        if any(kw in goal.lower() for kw in ["file", "module", "system", "architecture"]):
            score += 2
        if any(kw in goal.lower() for kw in ["multiple", "several", "all"]):
            score += 1

        # Domain weight
        if domain == "code":
            score += 2
        elif domain == "ops":
            score -= 1
        elif domain == "analysis":
            score += 1

        # Map score → complexity
        for range_obj, complexity in self.COMPLEXITY_MAP.items():
            if score in range_obj:
                return complexity  # type: ignore

        return "complex"

    def _check_requires_reasoning(
        self, goal: str, domain: str, complexity: str
    ) -> bool:
        """Bước 4: Check requires_reasoning flag."""
        if domain in ["code", "sales"]:
            return True
        if complexity == "complex":
            return True
        if any(kw in goal.lower() for kw in ["design", "architecture", "strategy", "why"]):
            return True
        return False

    def _check_requires_creativity(self, goal: str, domain: str) -> bool:
        """Bước 4: Check requires_creativity flag."""
        if domain in ["creative", "sales"]:
            return True
        if any(kw in goal.lower() for kw in ["engaging", "compelling", "creative", "catchy"]):
            return True
        return False

    def _detect_data_sensitivity(
        self, goal: str
    ) -> Literal["public", "internal", "sensitive"]:
        """Bước 5: Data sensitivity detection."""
        goal_lower = goal.lower()

        sensitive_keywords = [
            "password",
            "secret",
            "key",
            "token",
            "private",
            "confidential",
        ]
        internal_keywords = ["customer", "user data", "tenant", "billing"]

        if any(kw in goal_lower for kw in sensitive_keywords):
            return "sensitive"
        if any(kw in goal_lower for kw in internal_keywords):
            return "internal"
        return "public"

    def _estimate_tokens(
        self, complexity: str
    ) -> Literal[1200, 3500, 8000]:
        """Token estimation dựa trên complexity."""
        estimates = {
            "simple": 1200,  # 800 in + 400 out
            "standard": 3500,  # 2000 in + 1500 out
            "complex": 8000,  # 5000 in + 3000 out
            "bulk": 8000,
        }
        return estimates.get(complexity, 1200)

    def _determine_preferred_tier(
        self, data_sensitivity: str, agent_role: str
    ) -> Literal["local", "api_cheap", "api_mid", "api_best"]:
        """Xác định preferred tier dựa trên sensitivity."""
        if data_sensitivity == "sensitive":
            return "local"
        if data_sensitivity == "internal":
            return "local"  # prefer local, allow api if needed
        return "api_cheap"
