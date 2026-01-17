"""
Revenue Forecasting Service
===========================
"""

import uuid
from typing import List
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class Forecast:
    period: str
    predicted: float
    confidence: float

class RevenueForecasting:
    def __init__(self):
        self.sources = []

    def add_source(self, name: str, value: float, growth: float = 0.0):
        self.sources.append({"name": name, "value": value, "growth": growth})

    def generate(self, months: int = 6) -> List[Forecast]:
        base = sum(s["value"] for s in self.sources)
        avg_growth = sum(s["growth"] for s in self.sources) / (len(self.sources) or 1)
        
        forecasts = []
        for i in range(1, months + 1):
            val = base * ((1 + avg_growth) ** i)
            forecasts.append(Forecast(
                period=(datetime.now() + timedelta(days=30*i)).strftime("%b %Y"),
                predicted=val,
                confidence=90 - (i * 2)
            ))
        return forecasts