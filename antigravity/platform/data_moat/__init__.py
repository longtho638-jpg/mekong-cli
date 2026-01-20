"""
Data Moat Facade.
"""
from .engine import DataMoat
from .models import Benchmark, Insight, InsightType

data_moat = DataMoat()

__all__ = ['data_moat', 'DataMoat', 'Insight', 'InsightType', 'Benchmark']
