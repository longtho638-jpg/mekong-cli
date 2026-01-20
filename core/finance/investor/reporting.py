"""
Investor pipeline reporting and analytics.
"""
from typing import Any, Dict, List

from .models import Investor, PipelineStage


class ReportingManager:
    def __init__(self):
        self.investors: Dict[str, Investor] = {}
        self.dd_checklist: List[Any] = []

    def get_pipeline_summary(self) -> Dict[str, List[Investor]]:
        """Get investors grouped by pipeline stage."""
        pipeline = {}
        for investor in self.investors.values():
            stage = investor.stage.value
            if stage not in pipeline:
                pipeline[stage] = []
            pipeline[stage].append(investor)
        return pipeline

    def get_stats(self) -> Dict[str, Any]:
        """Get investor relations statistics."""
        total = len(self.investors)
        by_stage = {}
        by_type = {}
        total_potential = 0
        closed_count = 0

        for inv in self.investors.values():
            stage = inv.stage.value
            by_stage[stage] = by_stage.get(stage, 0) + 1

            inv_type = inv.investor_type.value
            by_type[inv_type] = by_type.get(inv_type, 0) + 1

            if inv.stage == PipelineStage.CLOSED:
                closed_count += 1
                total_potential += inv.check_size_max
            elif inv.stage not in [PipelineStage.PASSED]:
                total_potential += (inv.check_size_min + inv.check_size_max) / 2

        dd_complete = sum(1 for item in self.dd_checklist if item.status == "complete")

        return {
            "total_investors": total,
            "by_stage": by_stage,
            "by_type": by_type,
            "pipeline_value": total_potential,
            "closed_count": closed_count,
            "dd_progress": dd_complete / len(self.dd_checklist) * 100 if self.dd_checklist else 0,
        }
