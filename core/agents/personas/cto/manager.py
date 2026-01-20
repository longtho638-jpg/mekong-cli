"""
CTO Strategy and Debt Management Logic.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List

from .models import InitiativeStatus, TechDebt, TechDecision, TechInitiative, TechStack

logger = logging.getLogger(__name__)

class CTOManager:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.initiatives: Dict[str, TechInitiative] = {}
        self.decisions: List[TechDecision] = []
        self.tech_debt: Dict[str, TechDebt] = {}
        self.tech_stack: Dict[TechStack, List[str]] = {stack: [] for stack in TechStack}

    def add_initiative(
        self, name: str, description: str, impact: str = "high", owner: str = "CTO", months: int = 6
    ) -> TechInitiative:
        """Register a new strategic technology initiative."""
        if not name:
            raise ValueError("Initiative name is required")

        initiative = TechInitiative(
            id=f"INI-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            impact=impact,
            owner=owner,
            target_date=datetime.now() + timedelta(days=months * 30),
        )
        self.initiatives[initiative.id] = initiative
        logger.info(f"New Initiative: {name} (Target: {months}mo)")
        return initiative

    def record_decision(
        self, title: str, context: str, decision: str, consequences: str
    ) -> TechDecision:
        """Document an architectural decision record (ADR)."""
        adr = TechDecision(
            id=f"ADR-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            context=context,
            decision=decision,
            consequences=consequences,
        )
        self.decisions.append(adr)
        logger.info(f"ADR recorded: {title}")
        return adr

    def add_tech_debt(
        self, title: str, area: TechStack, severity: str, effort_days: int
    ) -> TechDebt:
        """Track identifying technical debt."""
        debt = TechDebt(
            id=f"TDB-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            area=area,
            severity=severity,
            effort_days=effort_days,
        )
        self.tech_debt[debt.id] = debt
        logger.warning(f"TECH DEBT LOGGED: {title} ({severity})")
        return debt

    def add_to_stack(self, category: TechStack, technology: str):
        """Standardize a technology into the agency stack."""
        if technology not in self.tech_stack[category]:
            self.tech_stack[category].append(technology)
            logger.debug(f"Stack Update: {category.value} -> {technology}")
