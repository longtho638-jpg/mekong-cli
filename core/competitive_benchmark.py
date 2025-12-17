"""
📊 Competitive Benchmarking - Industry Comparison
===================================================

Compare against industry benchmarks.
Know where you stand!

Features:
- Industry benchmarks
- Percentile ranking
- Gap analysis
- Improvement suggestions
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class BenchmarkCategory(Enum):
    """Benchmark categories."""
    PRICING = "pricing"
    GROWTH = "growth"
    PROFITABILITY = "profitability"
    EFFICIENCY = "efficiency"
    CLIENT = "client"


class Percentile(Enum):
    """Percentile rankings."""
    TOP_10 = "top_10"
    TOP_25 = "top_25"
    MEDIAN = "median"
    BOTTOM_25 = "bottom_25"


@dataclass
class Benchmark:
    """An industry benchmark."""
    metric: str
    category: BenchmarkCategory
    your_value: float
    industry_avg: float
    top_performers: float
    unit: str = ""


class CompetitiveBenchmarking:
    """
    Competitive Benchmarking.
    
    Industry comparison.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.benchmarks: List[Benchmark] = []
        self._load_defaults()
    
    def _load_defaults(self):
        """Load default benchmarks."""
        defaults = [
            ("Hourly Rate", BenchmarkCategory.PRICING, 125, 100, 200, "$"),
            ("Project Value", BenchmarkCategory.PRICING, 8000, 5000, 15000, "$"),
            ("Revenue Growth", BenchmarkCategory.GROWTH, 15, 12, 30, "%"),
            ("Client Growth", BenchmarkCategory.GROWTH, 20, 15, 35, "%"),
            ("Profit Margin", BenchmarkCategory.PROFITABILITY, 42, 30, 50, "%"),
            ("Revenue/Employee", BenchmarkCategory.PROFITABILITY, 150, 120, 200, "k"),
            ("Utilization Rate", BenchmarkCategory.EFFICIENCY, 82, 70, 85, "%"),
            ("On-Time Delivery", BenchmarkCategory.EFFICIENCY, 88, 80, 95, "%"),
            ("Client Retention", BenchmarkCategory.CLIENT, 92, 85, 95, "%"),
            ("NPS Score", BenchmarkCategory.CLIENT, 72, 50, 80, ""),
        ]
        
        for metric, category, your_value, industry_avg, top, unit in defaults:
            self.benchmarks.append(Benchmark(metric, category, your_value, industry_avg, top, unit))
    
    def get_percentile(self, benchmark: Benchmark) -> Percentile:
        """Get percentile ranking."""
        if benchmark.your_value >= benchmark.top_performers:
            return Percentile.TOP_10
        elif benchmark.your_value >= benchmark.industry_avg * 1.2:
            return Percentile.TOP_25
        elif benchmark.your_value >= benchmark.industry_avg:
            return Percentile.MEDIAN
        else:
            return Percentile.BOTTOM_25
    
    def get_gap(self, benchmark: Benchmark) -> float:
        """Get gap to top performers."""
        return benchmark.top_performers - benchmark.your_value
    
    def format_dashboard(self) -> str:
        """Format benchmarking dashboard."""
        above_avg = sum(1 for b in self.benchmarks if b.your_value >= b.industry_avg)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 COMPETITIVE BENCHMARKING                              ║",
            f"║  {above_avg}/{len(self.benchmarks)} above industry average                         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Metric          │ You    │ Avg    │ Top    │ Rank      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        percentile_icons = {"top_10": "🥇", "top_25": "🥈", "median": "🔵", "bottom_25": "⚪"}
        
        for benchmark in self.benchmarks[:8]:
            percentile = self.get_percentile(benchmark)
            icon = percentile_icons[percentile.value]
            
            you = f"{benchmark.your_value:,.0f}{benchmark.unit}"
            avg = f"{benchmark.industry_avg:,.0f}{benchmark.unit}"
            top = f"{benchmark.top_performers:,.0f}{benchmark.unit}"
            
            lines.append(f"║  {benchmark.metric[:15]:<15} │ {you:>6} │ {avg:>6} │ {top:>6} │ {icon} {percentile.value[4:] if 'top' in percentile.value else percentile.value[:6]:<6}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 IMPROVEMENT OPPORTUNITIES                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        # Find biggest gaps
        gaps = [(b, self.get_gap(b)) for b in self.benchmarks]
        gaps.sort(key=lambda x: x[1], reverse=True)
        
        for benchmark, gap in gaps[:3]:
            if gap > 0:
                lines.append(f"║    📈 {benchmark.metric}: +{gap:,.0f}{benchmark.unit} to reach top          ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📊 Industry Report]  [🎯 Set Targets]  [📈 Track]       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Know your position!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    benchmarking = CompetitiveBenchmarking("Saigon Digital Hub")
    
    print("📊 Competitive Benchmarking")
    print("=" * 60)
    print()
    
    print(benchmarking.format_dashboard())
