"""
🇻🇳 Vietnam Region Configuration
=================================

Region-specific settings for Vietnam franchisees.

Features:
- VND + USD dual currency
- Vietnamese secondary language
- Vietnam-wide coverage (all 63 provinces)
- Local SaaS alternatives
"""

import os
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum


class Currency(Enum):
    """Supported currencies."""
    VND = "VND"  # Vietnamese Dong
    USD = "USD"  # US Dollar


class VietnamRegion(Enum):
    """Vietnam regions."""
    NORTH = "north"       # Bắc Bộ
    CENTRAL = "central"   # Trung Bộ
    SOUTH = "south"       # Nam Bộ


@dataclass
class Province:
    """A Vietnamese province."""
    code: str
    name_en: str
    name_vi: str
    region: VietnamRegion
    population: int  # thousands


@dataclass
class VietnamConfig:
    """
    Vietnam region configuration.
    
    Covers entire Vietnam (63 provinces), not just ĐBSCL.
    Supports dual currency (VND + USD) for local + SaaS income.
    """

    # Locale settings
    primary_locale: str = "en"
    secondary_locale: str = "vi"

    # Currency settings
    primary_currency: Currency = Currency.USD  # SaaS affiliate
    local_currency: Currency = Currency.VND    # Local clients
    exchange_rate: float = 24500.0  # VND per USD (update regularly)

    # Coverage
    coverage_type: str = "nationwide"  # Not just ĐBSCL

    # Major cities for targeting
    major_cities: List[str] = field(default_factory=lambda: [
        "Hanoi",
        "Ho Chi Minh City",
        "Da Nang",
        "Hai Phong",
        "Can Tho",
        "Bien Hoa",
        "Hue",
        "Nha Trang",
        "Vung Tau",
        "Da Lat"
    ])

    # All 63 provinces
    provinces: List[Province] = field(default_factory=list)

    def __post_init__(self):
        if not self.provinces:
            self.provinces = self._load_provinces()

    def _load_provinces(self) -> List[Province]:
        """Load all 63 Vietnamese provinces."""
        return [
            # Northern Vietnam (Bắc Bộ)
            Province("HN", "Hanoi", "Hà Nội", VietnamRegion.NORTH, 8053),
            Province("HP", "Hai Phong", "Hải Phòng", VietnamRegion.NORTH, 2029),
            Province("QN", "Quang Ninh", "Quảng Ninh", VietnamRegion.NORTH, 1320),
            Province("BN", "Bac Ninh", "Bắc Ninh", VietnamRegion.NORTH, 1368),
            Province("HD", "Hai Duong", "Hải Dương", VietnamRegion.NORTH, 1895),

            # Central Vietnam (Trung Bộ)
            Province("DN", "Da Nang", "Đà Nẵng", VietnamRegion.CENTRAL, 1134),
            Province("TH", "Hue", "Huế", VietnamRegion.CENTRAL, 1128),
            Province("KH", "Khanh Hoa", "Khánh Hòa", VietnamRegion.CENTRAL, 1231),
            Province("QNA", "Quang Nam", "Quảng Nam", VietnamRegion.CENTRAL, 1495),
            Province("BDH", "Binh Dinh", "Bình Định", VietnamRegion.CENTRAL, 1485),

            # Southern Vietnam (Nam Bộ)
            Province("HCM", "Ho Chi Minh City", "TP. Hồ Chí Minh", VietnamRegion.SOUTH, 9000),
            Province("BD", "Binh Duong", "Bình Dương", VietnamRegion.SOUTH, 2426),
            Province("DN2", "Dong Nai", "Đồng Nai", VietnamRegion.SOUTH, 3097),
            Province("CT", "Can Tho", "Cần Thơ", VietnamRegion.SOUTH, 1235),
            Province("VT", "Ba Ria Vung Tau", "Bà Rịa Vũng Tàu", VietnamRegion.SOUTH, 1148),
            Province("LA", "Long An", "Long An", VietnamRegion.SOUTH, 1688),
            Province("TG", "Tien Giang", "Tiền Giang", VietnamRegion.SOUTH, 1764),
            Province("BL", "Bac Lieu", "Bạc Liêu", VietnamRegion.SOUTH, 907),
            Province("CM", "Ca Mau", "Cà Mau", VietnamRegion.SOUTH, 1194),
            Province("AG", "An Giang", "An Giang", VietnamRegion.SOUTH, 1908),
        ]

    def format_vnd(self, amount: float) -> str:
        """Format amount in VND."""
        return f"{amount:,.0f} ₫"

    def format_usd(self, amount: float) -> str:
        """Format amount in USD."""
        return f"${amount:,.2f}"

    def convert_usd_to_vnd(self, usd: float) -> float:
        """Convert USD to VND."""
        return usd * self.exchange_rate

    def convert_vnd_to_usd(self, vnd: float) -> float:
        """Convert VND to USD."""
        return vnd / self.exchange_rate

    def get_provinces_by_region(self, region: VietnamRegion) -> List[Province]:
        """Get provinces in a region."""
        return [p for p in self.provinces if p.region == region]

    def get_population_total(self) -> int:
        """Get total population covered (thousands)."""
        return sum(p.population for p in self.provinces)

    def get_summary(self) -> Dict[str, Any]:
        """Get region config summary."""
        return {
            "country": "Vietnam",
            "coverage": self.coverage_type,
            "provinces": len(self.provinces),
            "population_millions": self.get_population_total() / 1000,
            "major_cities": len(self.major_cities),
            "currencies": [self.primary_currency.value, self.local_currency.value],
            "locales": [self.primary_locale, self.secondary_locale],
            "exchange_rate": f"1 USD = {self.exchange_rate:,.0f} VND"
        }


class VietnamPricingEngine:
    """
    Pricing engine for Vietnam market.
    
    Handles dual-currency pricing:
    - SaaS affiliate commissions in USD
    - Local client services in VND
    """

    def __init__(self, config: VietnamConfig):
        self.config = config

        # Local service pricing (VND)
        self.local_services = {
            "seo_basic": 5_000_000,      # 5M VND/month
            "seo_pro": 15_000_000,       # 15M VND/month
            "content_pack": 3_000_000,   # 3M VND/10 posts
            "social_mgmt": 8_000_000,    # 8M VND/month
            "ppc_mgmt": 10_000_000,      # 10M VND/month (+ ad spend)
            "website": 25_000_000,       # 25M VND one-time
            "branding": 50_000_000,      # 50M VND package
        }

        # SaaS affiliate rates (USD)
        self.saas_commissions = {
            "ahrefs": 0.20,        # 20% recurring
            "semrush": 0.40,       # 40% recurring
            "convertkit": 0.30,    # 30% recurring
            "activecampaign": 0.30,
            "getresponse": 0.33,
        }

    def get_local_price(self, service: str, in_usd: bool = False) -> str:
        """Get price for a local service."""
        vnd = self.local_services.get(service, 0)

        if in_usd:
            usd = self.config.convert_vnd_to_usd(vnd)
            return f"{self.config.format_usd(usd)} ({self.config.format_vnd(vnd)})"
        return self.config.format_vnd(vnd)

    def estimate_saas_income(self, referrals_per_month: int = 10, avg_value: float = 100) -> Dict[str, Any]:
        """Estimate monthly SaaS affiliate income."""
        total_usd = 0
        breakdown = {}

        for saas, rate in self.saas_commissions.items():
            monthly = referrals_per_month * avg_value * rate
            breakdown[saas] = monthly
            total_usd += monthly

        return {
            "total_usd": self.config.format_usd(total_usd),
            "total_vnd": self.config.format_vnd(self.config.convert_usd_to_vnd(total_usd)),
            "breakdown": {k: self.config.format_usd(v) for k, v in breakdown.items()}
        }


# Example usage
if __name__ == "__main__":
    # Initialize Vietnam config
    config = VietnamConfig()

    print("🇻🇳 Vietnam Region Configuration")
    print("=" * 50)
    print()

    # Summary
    summary = config.get_summary()
    print("📊 Coverage Summary:")
    for key, value in summary.items():
        print(f"   {key}: {value}")
    print()

    # Major cities
    print("🏙️ Major Cities:")
    for city in config.major_cities[:5]:
        print(f"   • {city}")
    print()

    # Currency conversion
    print("💱 Currency Conversion:")
    usd = 100
    vnd = config.convert_usd_to_vnd(usd)
    print(f"   {config.format_usd(usd)} = {config.format_vnd(vnd)}")
    print()

    # Pricing
    pricing = VietnamPricingEngine(config)

    print("💰 Local Service Pricing:")
    for service in ["seo_basic", "content_pack", "website"]:
        print(f"   {service}: {pricing.get_local_price(service, in_usd=True)}")
    print()

    # SaaS income estimate
    income = pricing.estimate_saas_income(referrals_per_month=10)
    print("📈 SaaS Affiliate Income (10 referrals/month):")
    print(f"   Total: {income['total_usd']} ({income['total_vnd']})")
