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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ListingStatus(Enum):
    """Listing status."""
    DRAFT = "draft"
    ACTIVE = "active"
    PENDING = "pending"
    SOLD = "sold"
    RENTED = "rented"
    OFF_MARKET = "off_market"


class PropertyType(Enum):
    """Property types."""
    HOUSE = "house"
    APARTMENT = "apartment"
    CONDO = "condo"
    LAND = "land"
    COMMERCIAL = "commercial"
    VILLA = "villa"


class ListingType(Enum):
    """Listing types."""
    SALE = "sale"
    RENT = "rent"
    LEASE = "lease"


@dataclass
class PropertyListing:
    """A property listing."""
    id: str
    client_id: str
    title: str
    property_type: PropertyType
    listing_type: ListingType
    price: float
    location: str
    bedrooms: int = 0
    bathrooms: int = 0
    area_sqm: float = 0
    status: ListingStatus = ListingStatus.DRAFT
    views: int = 0
    inquiries: int = 0
    photos_count: int = 0
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class ListingSyndication:
    """Syndication channel."""
    id: str
    name: str
    platform: str  # zillow, batdongsan, facebook, etc.
    listings_count: int = 0
    is_active: bool = True


class ListingManager:
    """
    Listing Manager.
    
    Manage property listings.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.listings: Dict[str, PropertyListing] = {}
        self.syndications: Dict[str, ListingSyndication] = {}
    
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
        area: float = 0
    ) -> PropertyListing:
        """Create a property listing."""
        listing = PropertyListing(
            id=f"LST-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id,
            title=title,
            property_type=property_type,
            listing_type=listing_type,
            price=price,
            location=location,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            area_sqm=area
        )
        self.listings[listing.id] = listing
        return listing
    
    def publish_listing(self, listing: PropertyListing, photos: int = 0):
        """Publish a listing."""
        listing.status = ListingStatus.ACTIVE
        listing.photos_count = photos
    
    def record_engagement(self, listing: PropertyListing, views: int, inquiries: int):
        """Record listing engagement."""
        listing.views += views
        listing.inquiries += inquiries
    
    def mark_sold(self, listing: PropertyListing):
        """Mark listing as sold."""
        listing.status = ListingStatus.SOLD
    
    def add_syndication(self, name: str, platform: str) -> ListingSyndication:
        """Add syndication channel."""
        synd = ListingSyndication(
            id=f"SYN-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            platform=platform
        )
        self.syndications[synd.id] = synd
        return synd
    
    def get_stats(self) -> Dict[str, Any]:
        """Get listing statistics."""
        active = sum(1 for l in self.listings.values() if l.status == ListingStatus.ACTIVE)
        sold = sum(1 for l in self.listings.values() if l.status == ListingStatus.SOLD)
        total_value = sum(l.price for l in self.listings.values() if l.status == ListingStatus.ACTIVE)
        total_views = sum(l.views for l in self.listings.values())
        total_inquiries = sum(l.inquiries for l in self.listings.values())
        
        return {
            "total": len(self.listings),
            "active": active,
            "sold": sold,
            "total_value": total_value,
            "views": total_views,
            "inquiries": total_inquiries,
            "conversion": (total_inquiries / total_views * 100) if total_views else 0
        }
    
    def format_dashboard(self) -> str:
        """Format listing manager dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏠 LISTING MANAGER                                       ║",
            f"║  {stats['active']} active │ ${stats['total_value']:,.0f} value │ {stats['conversion']:.1f}% CVR  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 PROPERTY LISTINGS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"draft": "📝", "active": "🟢", "pending": "🟡",
                       "sold": "✅", "rented": "🔑", "off_market": "⏸️"}
        type_icons = {"house": "🏠", "apartment": "🏢", "condo": "🏬",
                     "land": "🌳", "commercial": "🏗️", "villa": "🏡"}
        
        for listing in list(self.listings.values())[:5]:
            s_icon = status_icons.get(listing.status.value, "⚪")
            t_icon = type_icons.get(listing.property_type.value, "🏠")
            
            lines.append(f"║  {s_icon} {t_icon} {listing.title[:18]:<18} │ ${listing.price:>10,.0f} │ {listing.views:>4} views  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY TYPE                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for ptype in list(PropertyType)[:4]:
            count = sum(1 for l in self.listings.values() if l.property_type == ptype)
            value = sum(l.price for l in self.listings.values() if l.property_type == ptype)
            icon = type_icons.get(ptype.value, "🏠")
            lines.append(f"║    {icon} {ptype.value.title():<12} │ {count:>2} │ ${value:>12,.0f}        ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📡 SYNDICATION                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for synd in list(self.syndications.values())[:3]:
            status = "🟢" if synd.is_active else "🔴"
            lines.append(f"║    {status} {synd.name:<15} │ {synd.platform:<15} │ {synd.listings_count:>3}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Listing]  [📡 Syndicate]  [📊 Analytics]         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Listings that sell!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    lm = ListingManager("Saigon Digital Hub")
    
    print("🏠 Listing Manager")
    print("=" * 60)
    print()
    
    l1 = lm.create_listing("CLT-001", "Luxury Villa District 2", PropertyType.VILLA, ListingType.SALE, 2500000, "District 2, HCMC", 5, 4, 450)
    l2 = lm.create_listing("CLT-001", "Modern Apartment", PropertyType.APARTMENT, ListingType.RENT, 1500, "District 7, HCMC", 2, 2, 80)
    l3 = lm.create_listing("CLT-002", "Commercial Space", PropertyType.COMMERCIAL, ListingType.LEASE, 5000, "District 1, HCMC", 0, 2, 200)
    
    lm.publish_listing(l1, 15)
    lm.publish_listing(l2, 10)
    
    lm.record_engagement(l1, 500, 12)
    lm.record_engagement(l2, 300, 8)
    
    lm.add_syndication("BatDongSan.vn", "batdongsan")
    lm.add_syndication("Facebook Marketplace", "facebook")
    
    print(lm.format_dashboard())
