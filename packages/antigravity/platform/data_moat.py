"""
DataMoat - Proprietary intelligence system.

Creates Data Moat:
- Agency benchmarks (what works)
- Viral patterns (content intelligence)
- Market insights (trends)
- Self-improving AI data

🏯 Binh Pháp: Dụng Gián (Intelligence) - Information advantage
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class InsightType(Enum):
    """Types of intelligence."""

    BENCHMARK = "benchmark"  # Performance benchmarks
    VIRAL_PATTERN = "viral"  # What makes content viral
    MARKET_TREND = "trend"  # Market trends
    COMPETITOR = "competitor"  # Competitor intelligence
    BEST_PRACTICE = "practice"  # What works


@dataclass
class Insight:
    """A piece of market intelligence."""

    id: Optional[int] = None
    type: InsightType = InsightType.BENCHMARK
    niche: str = ""
    title: str = ""
    data: Dict = field(default_factory=dict)
    confidence: float = 0.0  # 0-100%
    sample_size: int = 0
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Benchmark:
    """Performance benchmark for a niche."""

    niche: str
    avg_revenue: float = 0.0
    avg_clients: int = 0
    avg_conversion_rate: float = 0.0
    top_content_types: List[str] = field(default_factory=list)
    sample_size: int = 0


class DataMoat:
    """
    Proprietary intelligence that improves over time.

    The more agencies use the platform, the better the data becomes.
    This creates a compounding competitive advantage.

    Example:
        moat = DataMoat()
        moat.record_success("Nông sản", "facebook", 95)
        moat.record_success("Nông sản", "tiktok", 87)

        insights = moat.get_best_practices("Nông sản")
        # Returns: ["facebook posts perform 95% better", ...]
    """

    def __init__(self):
        self.insights: List[Insight] = []
        self.benchmarks: Dict[str, Benchmark] = {}
        self.success_data: List[Dict] = []
        self._next_id = 1

    def record_success(
        self, niche: str, content_type: str, performance_score: int, revenue: float = 0.0
    ):
        """Record a successful pattern for learning."""
        self.success_data.append(
            {
                "niche": niche,
                "content_type": content_type,
                "score": performance_score,
                "revenue": revenue,
                "timestamp": datetime.now().isoformat(),
            }
        )

        # Update benchmarks
        if niche not in self.benchmarks:
            self.benchmarks[niche] = Benchmark(niche=niche)

        benchmark = self.benchmarks[niche]
        benchmark.sample_size += 1

        # Update top content types
        if content_type not in benchmark.top_content_types and performance_score >= 80:
            benchmark.top_content_types.append(content_type)

    def add_insight(
        self,
        insight_type: InsightType,
        niche: str,
        title: str,
        data: Dict,
        confidence: float = 50.0,
    ) -> Insight:
        """Add a market insight."""
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
        """Get best practices for a niche based on data."""
        practices = []

        # Analyze success data
        niche_data = [d for d in self.success_data if d["niche"] == niche]

        if not niche_data:
            return [{"tip": "Not enough data yet. Keep using the platform!", "confidence": 0}]

        # Find top performing content types
        content_scores = {}
        for d in niche_data:
            ct = d["content_type"]
            if ct not in content_scores:
                content_scores[ct] = []
            content_scores[ct].append(d["score"])

        for ct, scores in content_scores.items():
            avg_score = sum(scores) / len(scores)
            practices.append(
                {
                    "tip": f"{ct.title()} content performs at {avg_score:.0f}% effectiveness",
                    "content_type": ct,
                    "avg_score": avg_score,
                    "sample_size": len(scores),
                    "confidence": min(len(scores) * 10, 100),
                }
            )

        # Sort by score
        practices.sort(key=lambda x: x["avg_score"], reverse=True)
        return practices

    def get_benchmark(self, niche: str) -> Optional[Benchmark]:
        """Get benchmark for a niche."""
        return self.benchmarks.get(niche)

    def get_viral_patterns(self, niche: str) -> List[Dict]:
        """Get patterns that lead to viral content."""
        patterns = []

        # Find high-performing content
        viral_data = [d for d in self.success_data if d["niche"] == niche and d["score"] >= 90]

        if viral_data:
            patterns.append(
                {
                    "pattern": "High engagement content",
                    "count": len(viral_data),
                    "avg_score": sum(d["score"] for d in viral_data) / len(viral_data),
                }
            )

        return patterns

    def get_moat_strength(self) -> Dict:
        """Calculate data moat strength."""
        total_data_points = len(self.success_data)
        unique_niches = len(set(d["niche"] for d in self.success_data))
        avg_confidence = (
            sum(i.confidence for i in self.insights) / len(self.insights) if self.insights else 0
        )

        # Moat strength increases with data
        strength = min(total_data_points / 100, 100)  # Max 100%

        return {
            "strength_score": strength,
            "total_data_points": total_data_points,
            "unique_niches": unique_niches,
            "total_insights": len(self.insights),
            "avg_confidence": avg_confidence,
            "defensibility": "HIGH" if strength >= 70 else "MEDIUM" if strength >= 40 else "LOW",
        }
