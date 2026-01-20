"""
Digital Merchandiser Engine logic.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict

from .models import DisplayStatus, DisplayType, ProductDisplay, StoreTheme

logger = logging.getLogger(__name__)

class MerchandiserEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.displays: Dict[str, ProductDisplay] = {}
        self.themes: Dict[str, StoreTheme] = {}

    def create_display(
        self, store_id: str, name: str, display_type: DisplayType, days_active: int = 7
    ) -> ProductDisplay:
        """Create a new visual display record."""
        if not store_id or not name:
            raise ValueError("Store ID and Name are required")

        display = ProductDisplay(
            id=f"DSP-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id,
            name=name,
            display_type=display_type,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=days_active),
        )
        self.displays[display.id] = display
        logger.info(f"Created display: {name} for store {store_id}")
        return display

    def launch_display(self, display_id: str) -> bool:
        """Mark a display as live."""
        if display_id not in self.displays:
            return False

        d = self.displays[display_id]
        d.status = DisplayStatus.LIVE
        d.start_date = datetime.now()
        logger.info(f"Display {display_id} is now LIVE")
        return True

    def register_theme(
        self, store_id: str, name: str, color: str, font: str, layout: str = "standard"
    ) -> StoreTheme:
        """Define a new visual theme for a storefront."""
        theme = StoreTheme(
            id=f"THM-{uuid.uuid4().hex[:6].upper()}",
            store_id=store_id,
            name=name,
            primary_color=color,
            font_family=font,
            layout=layout,
        )
        self.themes[theme.id] = theme
        logger.info(f"Theme registered: {name} ({color})")
        return theme
