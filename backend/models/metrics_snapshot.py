from datetime import date, datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class MetricsSnapshot(BaseModel):
    """
    Pydantic model for Business Metrics Snapshot
    Maps to 'metrics_snapshots' table
    Stores daily aggregated metrics like MRR, Churn, DAU/MAU
    """
    id: Optional[str] = None
    date: date
    metric_name: str
    metric_value: float
    dimensions: Dict[str, Any] = {}
    created_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}
