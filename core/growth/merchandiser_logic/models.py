"""
Data models and Enums for Digital Merchandiser.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional


class DisplayType(Enum):
    """Types of visual display components."""
    HOMEPAGE_HERO = "homepage_hero"
    COLLECTION_BANNER = "collection_banner"
    PRODUCT_FEATURE = "product_feature"
    PROMO_POPUP = "promo_popup"
    CATEGORY_BANNER = "category_banner"

class DisplayStatus(Enum):
    """Current state of a display item."""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    LIVE = "live"
    EXPIRED = "expired"

@dataclass
class ProductDisplay:
    """A visual product display entity."""
    id: str
    store_id: str
    name: str
    display_type: DisplayType
    status: DisplayStatus = DisplayStatus.DRAFT
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    clicks: int = 0
    conversions: int = 0

    def __post_init__(self):
        if self.clicks < 0 or self.conversions < 0:
            raise ValueError("Engagement metrics cannot be negative")

    @property
    def conversion_rate(self) -> float:
        """Calculate CVR based on recorded engagement."""
        if self.clicks <= 0:
            return 0.0
        return (self.conversions / self.clicks) * 100.0

@dataclass
class StoreTheme:
    """Store theme configuration record."""
    id: str
    store_id: str
    name: str
    primary_color: str
    font_family: str
    layout: str = "standard"  # standard, minimal, bold
