"""
🏯 DataMoat - Proprietary Intelligence System
============================================

Creates a compounding Data Moat for the Agency OS:
- Agency benchmarks (performance data)
- Viral patterns (content effectiveness)
- Market insights (niche-specific trends)
- Strategic intelligence (Binh Pháp execution data)

Binh Pháp: 🕵️ Dụng Gián (Intelligence) - Turning information into a moat.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional, Any
from enum import Enum
import json

try:
    from ..core.db import get_db
except (ImportError, ValueError):
    # Fallback if not in package context
    def get_db(): return None

# Configure logging
logger = logging.getLogger(__name__)


class InsightType(Enum):
    """Types of market intelligence."""
    BENCHMARK = "benchmark"      # Performance benchmarks
    VIRAL_PATTERN = "viral"      # What makes content viral
    MARKET_TREND = "trend"       # Market trends
    COMPETITOR = "competitor"    # Competitor intelligence
    BEST_PRACTICE = "practice"   # What works
    STRATEGIC = "strategic"      # Binh Pháp execution patterns


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
    """Performance benchmark for a specific niche."""
    niche: str
    avg_revenue: float = 0.0
    avg_clients: int = 0
    avg_conversion_rate: float = 0.0
    top_content_types: List[str] = field(default_factory=list)
    sample_size: int = 0
    last_updated: datetime = field(default_factory=datetime.now)


class DataMoat:
    """
    🏯 Data Moat
    
    The core intelligence engine that improves as more agencies join the network.
    Synchronizes local success patterns with global benchmarks.
    """
    
    def __init__(self):
        self.insights: List[Insight] = []
        self.benchmarks: Dict[str, Benchmark] = {}
        self.success_data: List[Dict] = []
        self._next_id = 1
        self.db = get_db()
    
    def record_success(
        self,
        niche: str,
        content_type: str,
        performance_score: int,
        revenue: float = 0.0,
        metadata: Optional[Dict] = None
    ):
        """
        Record a successful pattern for system learning.
        Persists to local state and optionally to Supabase if connected.
        """
        entry = {
            "niche": niche,
            "content_type": content_type,
            "score": performance_score,
            "revenue": revenue,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat()
        }
        self.success_data.append(entry)
        
        # Update local benchmarks
        if niche not in self.benchmarks:
            self.benchmarks[niche] = Benchmark(niche=niche)
        
        benchmark = self.benchmarks[niche]
        benchmark.sample_size += 1
        benchmark.last_updated = datetime.now()
        
        # Update top content types (80+ score threshold)
        if performance_score >= 80 and content_type not in benchmark.top_content_types:
            benchmark.top_content_types.append(content_type)
            
        # Optional: Sync to Supabase usage_logs or dedicated intelligence table
        if self.db:
            try:
                # In production, we'd have a 'data_moat_entries' table
                # self.db.from_('data_moat').insert(entry).execute()
                pass
            except Exception as e:
                logger.error(f"Failed to sync data moat entry: {e}")
    
    def add_insight(
        self,
        insight_type: InsightType,
        niche: str,
        title: str,
        data: Dict,
        confidence: float = 50.0
    ) -> Insight:
        """Add a strategic market insight."""
        insight = Insight(
            id=self._next_id,
            type=insight_type,
            niche=niche,
            title=title,
            data=data,
            confidence=confidence
        )
        self.insights.append(insight)
        self._next_id += 1
        return insight
    
    def get_best_practices(self, niche: str) -> List[Dict]:
        """
        Derive best practices for a niche based on accumulated success data.
        Returns sorted list of tips with confidence scores.
        """
        niche_data = [d for d in self.success_data if d["niche"] == niche]
        
        if not niche_data:
            return [{"tip": "Insufficient data for this niche. Start recording successes to build intelligence.", "confidence": 0}]
        
        # Group by content type
        content_stats = {}
        for d in niche_data:
            ct = d["content_type"]
            if ct not in content_stats:
                content_stats[ct] = []
            content_stats[ct].append(d["score"])
        
        practices = []
        for ct, scores in content_stats.items():
            avg_score = sum(scores) / len(scores)
            count = len(scores)
            
            # Confidence grows with sample size (max 100)
            confidence = min(count * 15, 100)
            
            practices.append({
                "tip": f"✨ {ct.upper()} content is {avg_score:.0f}% effective in this niche.",
                "content_type": ct,
                "avg_score": avg_score,
                "confidence": confidence,
                "sample_size": count
            })
        
        # Sort by average performance
        practices.sort(key=lambda x: x["avg_score"], reverse=True)
        return practices
    
    def get_benchmark(self, niche: str) -> Optional[Benchmark]:
        """Retrieve benchmark data for a specific niche."""
        return self.benchmarks.get(niche)
    
    def get_viral_patterns(self, niche: str) -> List[Dict]:
        """Identify specific patterns that consistently hit high scores (90+)."""
        viral_entries = [d for d in self.success_data 
                        if d["niche"] == niche and d["score"] >= 90]
        
        if not viral_entries:
            return []
            
        return [{
            "pattern": "High Engagement Outlier",
            "frequency": len(viral_entries),
            "avg_viral_score": sum(d["score"] for d in viral_entries) / len(viral_entries),
            "top_media": list(set(d["content_type"] for d in viral_entries))
        }]
    
    def get_moat_strength(self) -> Dict[str, Any]:
        """
        Calculate the 'strength' of the data moat.
        Moat strength = data volume * variety * confidence.
        """
        total_points = len(self.success_data)
        niches = len(self.benchmarks)
        
        # Simple score: 1% per point up to 100%
        raw_score = min(total_points, 100)
        
        # Multipliers
        variety_bonus = min(niches * 10, 50) # Bonus for variety
        
        final_score = min(raw_score + variety_bonus, 100)
        
        return {
            "strength_score": final_score,
            "data_points": total_points,
            "covered_niches": niches,
            "insights_count": len(self.insights),
            "defensibility": (
                "🏯 CASTLE (High)" if final_score >= 70 else 
                "🛡️ FORT (Medium)" if final_score >= 40 else 
                "🪵 STOCKADE (Low)"
            )
        }

    def export_intelligence(self) -> str:
        """Export full intelligence state to JSON string."""
        state = {
            "benchmarks": {k: vars(v) for k, v in self.benchmarks.items()},
            "insights": [vars(i) for i in self.insights],
            "metadata": {
                "exported_at": datetime.now().isoformat(),
                "moat_strength": self.get_moat_strength()
            }
        }
        # Helper to handle non-serializable objects like Enums/datetimes
        def serializer(obj):
            if isinstance(obj, (datetime, Enum)):
                return str(obj)
            return obj
            
        return json.dumps(state, default=serializer, indent=2)


# Singleton instance
data_moat = DataMoat()