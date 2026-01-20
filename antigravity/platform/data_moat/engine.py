"""
Data Moat core intelligence engine.
"""

import json
import logging
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from .models import Benchmark, Insight, InsightType

logger = logging.getLogger(__name__)


class DataMoat:
    """🏯 Data Moat Engine."""

    def __init__(self):
        self.insights: List[Insight] = []
        self.benchmarks: Dict[str, Benchmark] = {}
        self.success_data: List[Dict] = []
        self._next_id = 1

    def record_success(
        self,
        niche: str,
        content_type: str,
        performance_score: int,
        revenue: float = 0.0,
        metadata: Optional[Dict] = None,
    ):
        entry = {
            "niche": niche,
            "content_type": content_type,
            "score": performance_score,
            "revenue": revenue,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat(),
        }
        self.success_data.append(entry)
        if niche not in self.benchmarks:
            self.benchmarks[niche] = Benchmark(niche=niche)
        benchmark = self.benchmarks[niche]
        benchmark.sample_size += 1
        benchmark.last_updated = datetime.now()
        if performance_score >= 80 and content_type not in benchmark.top_content_types:
            benchmark.top_content_types.append(content_type)

    def get_benchmark(self, niche: str) -> Optional[Benchmark]:
        """Get benchmark for a specific niche."""
        return self.benchmarks.get(niche)

    def add_insight(
        self,
        insight_type: InsightType,
        niche: str,
        title: str,
        data: Dict,
        confidence: float = 50.0,
    ) -> Insight:
        insight = Insight(
            id=self._next_id,
            type=insight_type,
            niche=niche,
            title=title,
            data=data,
            confidence=confidence,
        )
        self.insights.append(insight)
        self._next_id += 1
        return insight

    def get_best_practices(self, niche: str) -> List[Dict]:
        niche_data = [d for d in self.success_data if d["niche"] == niche]
        if not niche_data:
            return [{"tip": "Insufficient data.", "confidence": 0}]
        content_stats = {}
        for d in niche_data:
            ct = d["content_type"]
            if ct not in content_stats:
                content_stats[ct] = []
            content_stats[ct].append(d["score"])
        practices = []
        for ct, scores in content_stats.items():
            avg_score = sum(scores) / len(scores)
            confidence = min(len(scores) * 15, 100)
            practices.append(
                {
                    "tip": f"✨ {ct.upper()} content is {avg_score:.0f}% effective.",
                    "content_type": ct,
                    "avg_score": avg_score,
                    "confidence": confidence,
                    "sample_size": len(scores),
                }
            )
        practices.sort(key=lambda x: x["avg_score"], reverse=True)
        return practices

    def get_moat_strength(self) -> Dict[str, Any]:
        total_points = len(self.success_data)
        niches = len(self.benchmarks)
        final_score = min(min(total_points, 100) + min(niches * 10, 50), 100)
        return {
            "strength_score": final_score,
            "data_points": total_points,
            "covered_niches": niches,
            "insights_count": len(self.insights),
            "defensibility": "🏯 CASTLE"
            if final_score >= 70
            else "🛡️ FORT"
            if final_score >= 40
            else "🪵 STOCKADE",
        }

    def export_intelligence(self) -> str:
        state = {
            "benchmarks": {k: vars(v) for k, v in self.benchmarks.items()},
            "insights": [vars(i) for i in self.insights],
            "metadata": {
                "exported_at": datetime.now().isoformat(),
                "moat_strength": self.get_moat_strength(),
            },
        }

        def serializer(obj):
            return str(obj) if isinstance(obj, (datetime, Enum)) else obj

        return json.dumps(state, default=serializer, indent=2)
