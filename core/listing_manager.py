"""
🏠 Listing Manager - Property Listings
========================================

Manage property listings for real estate clients.
Listings that sell!

Roles:
- Listing creation
- Photo/video management
- Syndication
- Performance tracking
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ListingStatus(Enum):
    """Lifecycle status of a property listing."""
    DRAFT = "draft"
    ACTIVE = "active"
    PENDING = "pending"
    SOLD = "sold"
    RENTED = "rented"
    OFF_MARKET = "off_market"


class PropertyType(Enum):
    """Categories of real estate properties."""
    HOUSE = "house"
    APARTMENT = "apartment"
    CONDO = "condo"
    LAND = "land"
    COMMERCIAL = "commercial"
    VILLA = "villa"


class ListingType(Enum):
    """Transaction types for listings."""
    SALE = "sale"
    RENT = "rent"
    LEASE = "lease"


@dataclass
class PropertyListing:
    """A real estate listing record entity."""
    id: str
    client_id: str
    title: str
    property_type: PropertyType
    listing_type: ListingType
    price: float
    location: str
    bedrooms: int = 0
    bathrooms: int = 0
    area_sqm: float = 0.0
    status: ListingStatus = ListingStatus.DRAFT
    views: int = 0
    inquiries: int = 0
    photos_count: int = 0
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.price < 0:
            raise ValueError("Price cannot be negative")


@dataclass
class ListingSyndication:
    """An external platform distribution channel."""
    id: str
    name: str
    platform: str  # zillow, batdongsan, facebook, etc.
    listings_count: int = 0
    is_active: bool = True


class ListingManager:
    """
    Listing Manager System.
    
    Orchestrates property listings, syndication channels, and engagement tracking.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.listings: Dict[str, PropertyListing] = {}
        self.syndications: Dict[str, ListingSyndication] = {}
        logger.info(f"Listing Manager initialized for {agency_name}")
    
    def create_listing(
        self,
        client_id: str,
        title: str,
        property_type: PropertyType,
        listing_type: ListingType,
        price: float,
        location: str,
        bedrooms: int = 0,
        bathrooms: int = 0,
        area: float = 0.0
    ) -> PropertyListing:
        """Register a new property listing."""
        if not title or not location:
            raise ValueError("Title and location are required")

        listing = PropertyListing(
            id=f"LST-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id, title=title,
            property_type=property_type, listing_type=listing_type,
            price=float(price), location=location,
            bedrooms=bedrooms, bathrooms=bathrooms, area_sqm=float(area)
        )
        self.listings[listing.id] = listing
        logger.info(f"Listing created: {title} ({listing.id})")
        return listing
    
    def publish_listing(self, listing_id: str, photos_count: int = 0) -> bool:
        """Set listing to ACTIVE status."""
        if listing_id not in self.listings: return False
        
        lst = self.listings[listing_id]
        lst.status = ListingStatus.ACTIVE
        lst.photos_count = photos_count
        logger.info(f"Listing published: {lst.title}")
        return True
    
    def record_engagement(self, listing_id: str, views: int, inquiries: int) -> bool:
        """Update engagement metrics for a listing."""
        if listing_id not in self.listings: return False
        
        lst = self.listings[listing_id]
        lst.views += views
        lst.inquiries += inquiries
        logger.debug(f"Engagement recorded for {listing_id}: +{views} views")
        return True
    
    def add_syndication(self, name: str, platform: str) -> ListingSyndication:
        """Configure a new syndication channel."""
        synd = ListingSyndication(
            id=f"SYN-{uuid.uuid4().hex[:6].upper()}",
            name=name, platform=platform
        )
        self.syndications[synd.id] = synd
        logger.info(f"Syndication added: {name}")
        return synd
    
    def format_dashboard(self) -> str:
        """Render the Listing Manager Dashboard."""
        active_lst = [l for l in self.listings.values() if l.status == ListingStatus.ACTIVE]
        total_val = sum(l.price for l in active_lst)
        total_views = sum(l.views for l in self.listings.values())
        total_inq = sum(l.inquiries for l in self.listings.values())
        cvr = (total_inq / total_views * 100.0) if total_views else 0.0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏠 LISTING MANAGER DASHBOARD{' ' * 30}║",
            f"║  {len(active_lst)} active │ ${total_val:,.0f} value │ {cvr:.1f}% CVR{' ' * 16}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE LISTINGS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        type_icons = {
            PropertyType.HOUSE: "🏠", PropertyType.APARTMENT: "🏢", 
            PropertyType.COMMERCIAL: "🏗️", PropertyType.VILLA: "🏡"
        }
        
        for lst in active_lst[:5]:
            icon = type_icons.get(lst.property_type, "🏠")
            title_disp = (lst.title[:18] + '..') if len(lst.title) > 20 else lst.title
            lines.append(f"║  🟢 {icon} {title_disp:<20} │ ${lst.price:>10,.0f} │ {lst.views:>4} views ║")
            
        lines.extend([
            "║                                                           ║",
            "║  📡 SYNDICATION CHANNELS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for s in list(self.syndications.values())[:3]:
            status = "🟢" if s.is_active else "🔴"
            lines.append(f"║    {status} {s.name:<15} │ {s.platform:<15} │ {s.listings_count:>3} active ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Listing]  [📡 Syndicate]  [📊 Analytics]         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Sold!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🏠 Initializing Listing Manager...")
    print("=" * 60)
    
    try:
        mgr = ListingManager("Saigon Digital Hub")
        
        # Seed
        l1 = mgr.create_listing("C1", "Luxury Villa", PropertyType.VILLA, ListingType.SALE, 2500000.0, "D2")
        mgr.publish_listing(l1.id, 15)
        mgr.record_engagement(l1.id, 500, 12)
        
        mgr.add_syndication("BatDongSan", "batdongsan.vn")
        
        print("\n" + mgr.format_dashboard())
        
    except Exception as e:
        logger.error(f"Manager Error: {e}")
