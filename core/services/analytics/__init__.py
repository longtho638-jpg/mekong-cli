"""
Analytics Service Facade.
"""
from .engine import AnalyticsCalculationEngine
from .models import ClientMetrics, MetricPeriod, MetricSnapshot, RevenueEntry, RevenueType

# For backward compatibility
__all__ = [
    'MetricPeriod',
    'RevenueType',
    'RevenueEntry',
    'MetricSnapshot',
    'ClientMetrics',
    'AnalyticsCalculationEngine'
]
