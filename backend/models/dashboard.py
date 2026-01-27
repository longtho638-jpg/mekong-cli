from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field

# --- Widget Models ---

class WidgetPosition(BaseModel):
    x: int
    y: int
    w: int
    h: int

class WidgetConfig(BaseModel):
    # Flexible config based on widget type
    title: Optional[str] = None
    metric: Optional[str] = None
    chart_type: Optional[str] = None # line, bar, etc.
    data_source: Optional[str] = None
    refresh_interval: Optional[int] = None
    options: Dict[str, Any] = {}

class DashboardWidgetBase(BaseModel):
    widget_type: str # chart, kpi, text
    config: WidgetConfig
    position: WidgetPosition

class DashboardWidgetCreate(DashboardWidgetBase):
    pass

class DashboardWidget(DashboardWidgetBase):
    id: UUID
    dashboard_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard Config Models ---

class DashboardConfigBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False
    layout_config: Dict[str, Any] = {} # Global layout settings

class DashboardConfigCreate(DashboardConfigBase):
    widgets: List[DashboardWidgetCreate] = []

class DashboardConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None
    layout_config: Optional[Dict[str, Any]] = None
    widgets: Optional[List[DashboardWidgetCreate]] = None

class DashboardConfig(DashboardConfigBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    widgets: List[DashboardWidget] = []

    class Config:
        from_attributes = True

# --- Data Models ---

class MetricRequest(BaseModel):
    metric: str
    date_range: str # today, 7d, 30d, etc.
    segment: Optional[str] = None

class MetricDataPoint(BaseModel):
    timestamp: datetime
    value: float
    label: Optional[str] = None
    category: Optional[str] = None

class MetricResponse(BaseModel):
    metric: str
    value: Union[float, str, int]
    trend: Optional[float] = None # Percentage
    trend_label: Optional[str] = None
    data: List[MetricDataPoint] = []
