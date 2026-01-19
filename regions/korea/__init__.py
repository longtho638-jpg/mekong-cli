"""
🇰🇷 Korea Region Configuration
================================

Region-specific settings for Korea franchisees.

Features:
- KRW + USD dual currency
- Korean secondary language
- Korea-wide coverage
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List


class Currency(Enum):
    """Supported currencies."""

    KRW = "KRW"  # Korean Won
    USD = "USD"  # US Dollar


@dataclass
class Province:
    """A Korean province/city."""

    code: str
    name_en: str
    name_ko: str
    population: int  # thousands


@dataclass
class KoreaConfig:
    """
    Korea region configuration.
    """

    # Locale settings
    primary_locale: str = "en"
    secondary_locale: str = "ko"

    # Currency settings
    primary_currency: Currency = Currency.USD
    local_currency: Currency = Currency.KRW
    exchange_rate: float = 1300.0  # KRW per USD

    # Coverage
    coverage_type: str = "nationwide"

    # Major cities
    major_cities: List[str] = field(
        default_factory=lambda: [
            "Seoul",
            "Busan",
            "Incheon",
            "Daegu",
            "Daejeon",
            "Gwangju",
            "Ulsan",
            "Suwon",
        ]
    )

    # Provinces
    provinces: List[Province] = field(default_factory=list)

    def __post_init__(self):
        if not self.provinces:
            self.provinces = self._load_provinces()

    def _load_provinces(self) -> List[Province]:
        """Load major Korean provinces/cities."""
        return [
            Province("11", "Seoul", "서울", 9700),
            Province("26", "Busan", "부산", 3400),
            Province("28", "Incheon", "인천", 2900),
            Province("27", "Daegu", "대구", 2400),
            Province("30", "Daejeon", "대전", 1500),
            Province("29", "Gwangju", "광주", 1500),
            Province("31", "Ulsan", "울산", 1100),
            Province("41", "Gyeonggi", "경기", 13500),
        ]

    def format_krw(self, amount: float) -> str:
        """Format amount in KRW."""
        return f"₩{amount:,.0f}"

    def format_usd(self, amount: float) -> str:
        """Format amount in USD."""
        return f"${amount:,.2f}"

    def convert_usd_to_krw(self, usd: float) -> float:
        """Convert USD to KRW."""
        return usd * self.exchange_rate

    def get_summary(self) -> Dict[str, Any]:
        """Get region config summary."""
        return {
            "country": "Korea",
            "coverage": self.coverage_type,
            "provinces": len(self.provinces),
            "population_millions": sum(p.population for p in self.provinces) / 1000,
            "major_cities": len(self.major_cities),
            "currencies": [self.primary_currency.value, self.local_currency.value],
            "locales": [self.primary_locale, self.secondary_locale],
            "exchange_rate": f"1 USD = {self.exchange_rate:,.0f} KRW",
        }


class KoreaPricingEngine:
    """Pricing engine for Korea market."""

    def __init__(self, config: KoreaConfig):
        self.config = config

        # Local service pricing (KRW)
        self.local_services = {
            "seo_basic": 500_000,  # ₩500,000/month
            "seo_pro": 1_500_000,  # ₩1,500,000/month
            "content_pack": 300_000,  # ₩300,000/10 posts
            "social_mgmt": 800_000,  # ₩800,000/month
            "website": 3_000_000,  # ₩3,000,000 one-time
            "branding": 5_000_000,  # ₩5,000,000 package
        }

    def get_local_price(self, service: str, in_usd: bool = False) -> str:
        """Get price for a local service."""
        krw = self.local_services.get(service, 0)

        if in_usd:
            usd = krw / self.config.exchange_rate
            return f"{self.config.format_usd(usd)} ({self.config.format_krw(krw)})"
        return self.config.format_krw(krw)


# Example usage
if __name__ == "__main__":
    config = KoreaConfig()

    print("🇰🇷 Korea Region Configuration")
    print("=" * 50)
    print()

    summary = config.get_summary()
    print("📊 Coverage Summary:")
    for key, value in summary.items():
        print(f"   {key}: {value}")
    print()

    print("🏙️ Major Cities:")
    for city in config.major_cities[:5]:
        print(f"   • {city}")
    print()

    print("💱 Currency Conversion:")
    usd = 100
    krw = config.convert_usd_to_krw(usd)
    print(f"   {config.format_usd(usd)} = {config.format_krw(krw)}")
    print()

    pricing = KoreaPricingEngine(config)
    print("💰 Service Pricing:")
    for service in ["seo_basic", "website"]:
        print(f"   {service}: {pricing.get_local_price(service, in_usd=True)}")
