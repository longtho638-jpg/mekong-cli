"""
🇯🇵 Japan Region Configuration
================================

Region-specific settings for Japan franchisees.

Features:
- JPY + USD dual currency
- Japanese secondary language
- Japan-wide coverage
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List


class Currency(Enum):
    """Supported currencies."""

    JPY = "JPY"  # Japanese Yen
    USD = "USD"  # US Dollar


class JapanRegion(Enum):
    """Japan regions."""

    HOKKAIDO = "hokkaido"
    TOHOKU = "tohoku"
    KANTO = "kanto"
    CHUBU = "chubu"
    KANSAI = "kansai"
    CHUGOKU = "chugoku"
    SHIKOKU = "shikoku"
    KYUSHU = "kyushu"


@dataclass
class Prefecture:
    """A Japanese prefecture."""

    code: str
    name_en: str
    name_jp: str
    region: JapanRegion
    population: int  # thousands


@dataclass
class JapanConfig:
    """
    Japan region configuration.
    """

    # Locale settings
    primary_locale: str = "en"
    secondary_locale: str = "ja"

    # Currency settings
    primary_currency: Currency = Currency.USD
    local_currency: Currency = Currency.JPY
    exchange_rate: float = 150.0  # JPY per USD

    # Coverage
    coverage_type: str = "nationwide"

    # Major cities
    major_cities: List[str] = field(
        default_factory=lambda: [
            "Tokyo",
            "Osaka",
            "Nagoya",
            "Yokohama",
            "Fukuoka",
            "Sapporo",
            "Kobe",
            "Kyoto",
        ]
    )

    # Prefectures
    prefectures: List[Prefecture] = field(default_factory=list)

    def __post_init__(self):
        if not self.prefectures:
            self.prefectures = self._load_prefectures()

    def _load_prefectures(self) -> List[Prefecture]:
        """Load major Japanese prefectures."""
        return [
            Prefecture("13", "Tokyo", "東京都", JapanRegion.KANTO, 13960),
            Prefecture("27", "Osaka", "大阪府", JapanRegion.KANSAI, 8800),
            Prefecture("23", "Aichi", "愛知県", JapanRegion.CHUBU, 7500),
            Prefecture("14", "Kanagawa", "神奈川県", JapanRegion.KANTO, 9200),
            Prefecture("40", "Fukuoka", "福岡県", JapanRegion.KYUSHU, 5100),
            Prefecture("01", "Hokkaido", "北海道", JapanRegion.HOKKAIDO, 5200),
            Prefecture("26", "Kyoto", "京都府", JapanRegion.KANSAI, 2600),
            Prefecture("28", "Hyogo", "兵庫県", JapanRegion.KANSAI, 5500),
        ]

    def format_jpy(self, amount: float) -> str:
        """Format amount in JPY."""
        return f"¥{amount:,.0f}"

    def format_usd(self, amount: float) -> str:
        """Format amount in USD."""
        return f"${amount:,.2f}"

    def convert_usd_to_jpy(self, usd: float) -> float:
        """Convert USD to JPY."""
        return usd * self.exchange_rate

    def get_summary(self) -> Dict[str, Any]:
        """Get region config summary."""
        return {
            "country": "Japan",
            "coverage": self.coverage_type,
            "prefectures": len(self.prefectures),
            "population_millions": sum(p.population for p in self.prefectures) / 1000,
            "major_cities": len(self.major_cities),
            "currencies": [self.primary_currency.value, self.local_currency.value],
            "locales": [self.primary_locale, self.secondary_locale],
            "exchange_rate": f"1 USD = {self.exchange_rate:,.0f} JPY",
        }


class JapanPricingEngine:
    """Pricing engine for Japan market."""

    def __init__(self, config: JapanConfig):
        self.config = config

        # Local service pricing (JPY)
        self.local_services = {
            "seo_basic": 50_000,  # ¥50,000/month
            "seo_pro": 150_000,  # ¥150,000/month
            "content_pack": 30_000,  # ¥30,000/10 posts
            "social_mgmt": 80_000,  # ¥80,000/month
            "website": 300_000,  # ¥300,000 one-time
            "branding": 500_000,  # ¥500,000 package
        }

    def get_local_price(self, service: str, in_usd: bool = False) -> str:
        """Get price for a local service."""
        jpy = self.local_services.get(service, 0)

        if in_usd:
            usd = jpy / self.config.exchange_rate
            return f"{self.config.format_usd(usd)} ({self.config.format_jpy(jpy)})"
        return self.config.format_jpy(jpy)


# Example usage
if __name__ == "__main__":
    config = JapanConfig()

    print("🇯🇵 Japan Region Configuration")
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
    jpy = config.convert_usd_to_jpy(usd)
    print(f"   {config.format_usd(usd)} = {config.format_jpy(jpy)}")
    print()

    pricing = JapanPricingEngine(config)
    print("💰 Service Pricing:")
    for service in ["seo_basic", "website"]:
        print(f"   {service}: {pricing.get_local_price(service, in_usd=True)}")
