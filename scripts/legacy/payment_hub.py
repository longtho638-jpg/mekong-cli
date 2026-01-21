#!/usr/bin/env python3
"""
🏯 AgencyOS Payment Hub v2.0 - Venture Studio Command Center
============================================================

Focus: PayPal REST API + Gumroad + Venture Revenue Engine

Commands:
    python3 scripts/payment_hub.py status     # All platforms status
    python3 scripts/payment_hub.py products   # List all products
    python3 scripts/payment_hub.py revenue    # Global Revenue summary
    python3 scripts/payment_hub.py venture    # 🏯 Venture Portfolio P&L
    python3 scripts/payment_hub.py sync       # Sync products
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add package path for RevenueEngine
sys.path.append(str(Path(__file__).parent.parent))

try:
    from antigravity.core.revenue_engine import Currency, RevenueEngine
except ImportError:
    # Fallback for dev environment without package install
    sys.path.append(
        os.path.join(os.path.dirname(__file__), "../antigravity/core")
    )
    try:
        from revenue_engine import Currency, RevenueEngine
    except ImportError:
        # print("⚠️  RevenueEngine not found. Some features disabled.")
        RevenueEngine = None

import requests

# =============================================================================
# CONFIGURATION
# =============================================================================


class Config:
    """Payment Hub configuration."""

    # PayPal
    PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")
    PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")

    # Gumroad
    GUMROAD_TOKEN = os.getenv("GUMROAD_ACCESS_TOKEN", "")
    GUMROAD_API = "https://api.gumroad.com/v2"

    # Venture Portfolio (Multi-tenant)
    PORTFOLIO = {
        "AgencyOS": ["agencyos", "vibe", "starter"],
        "VietnamServices": ["vietnamese", "agency", "kit"],
        "MekongSaaS": ["saas", "multi-tenant", "mekong"],
        "AI_Lab": ["ai", "skills", "agent"],
    }

    # Revenue Share (Equity/Fee)
    VENTURE_FEE = 0.05  # 5% management fee

    @classmethod
    def paypal_base_url(cls):
        if cls.PAYPAL_MODE == "live":
            return "https://api-m.paypal.com"
        return "https://api-m.sandbox.paypal.com"


# =============================================================================
# PAYPAL CLIENT
# =============================================================================


class PayPalClient:
    """PayPal REST API client."""

    def __init__(self):
        self.config = Config
        self._access_token = None

    def is_configured(self) -> bool:
        return bool(self.config.PAYPAL_CLIENT_ID and self.config.PAYPAL_CLIENT_SECRET)

    def _get_token(self) -> str:
        if self._access_token:
            return self._access_token

        import base64

        auth = base64.b64encode(
            f"{self.config.PAYPAL_CLIENT_ID}:{self.config.PAYPAL_CLIENT_SECRET}".encode()
        ).decode()

        resp = requests.post(
            f"{self.config.paypal_base_url()}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data="grant_type=client_credentials",
            timeout=30,
        )

        if resp.status_code == 200:
            self._access_token = resp.json().get("access_token")
            return self._access_token
        return ""

    def get_products(self) -> list:
        """Get PayPal catalog products."""
        token = self._get_token()
        if not token:
            return []

        resp = requests.get(
            f"{self.config.paypal_base_url()}/v1/catalogs/products",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )

        if resp.status_code == 200:
            return resp.json().get("products", [])
        return []

    def get_transactions(self, days: int = 30) -> list:
        """Get recent transactions."""
        token = self._get_token()
        if not token:
            return []

        end = datetime.utcnow()
        start = end - timedelta(days=days)

        resp = requests.get(
            f"{self.config.paypal_base_url()}/v1/reporting/transactions",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "start_date": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "end_date": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
            },
            timeout=30,
        )

        if resp.status_code == 200:
            return resp.json().get("transaction_details", [])
        return []

    def status(self) -> dict:
        """Get PayPal status."""
        return {
            "configured": self.is_configured(),
            "mode": self.config.PAYPAL_MODE,
            "authenticated": bool(self._get_token()) if self.is_configured() else False,
        }


# =============================================================================
# GUMROAD CLIENT
# =============================================================================


class GumroadClient:
    """Gumroad API client."""

    def __init__(self):
        self.config = Config

    def is_configured(self) -> bool:
        return bool(self.config.GUMROAD_TOKEN)

    def get_user(self) -> dict:
        """Get Gumroad user info."""
        if not self.is_configured():
            return {}

        resp = requests.get(
            f"{self.config.GUMROAD_API}/user",
            params={"access_token": self.config.GUMROAD_TOKEN},
            timeout=30,
        )

        if resp.status_code == 200:
            return resp.json().get("user", {})
        return {}

    def get_products(self) -> list:
        """Get Gumroad products."""
        if not self.is_configured():
            return []

        resp = requests.get(
            f"{self.config.GUMROAD_API}/products",
            params={"access_token": self.config.GUMROAD_TOKEN},
            timeout=30,
        )

        if resp.status_code == 200:
            return resp.json().get("products", [])
        return []

    def get_sales(self, page: int = 1) -> list:
        """Get Gumroad sales."""
        if not self.is_configured():
            return []

        resp = requests.get(
            f"{self.config.GUMROAD_API}/sales",
            params={"access_token": self.config.GUMROAD_TOKEN, "page": page},
            timeout=30,
        )

        if resp.status_code == 200:
            return resp.json().get("sales", [])
        return []

    def status(self) -> dict:
        """Get Gumroad status."""
        user = self.get_user() if self.is_configured() else {}
        return {
            "configured": self.is_configured(),
            "authenticated": bool(user),
            "email": user.get("email", ""),
        }


# =============================================================================
# PAYMENT HUB
# =============================================================================


class PaymentHub:
    """Unified payment command center."""

    def __init__(self):
        self.paypal = PayPalClient()
        self.gumroad = GumroadClient()
        self.engine = RevenueEngine() if RevenueEngine else None

    def cmd_status(self):
        """Show all platforms status."""
        print("\n" + "=" * 60)
        print("🏯 VENTURE PAYMENT HUB P&L")
        print("=" * 60)

        # PayPal
        pp = self.paypal.status()
        print("\n💳 PayPal REST API")
        print(f"   Mode: {pp['mode']}")
        print(f"   Configured: {'✅' if pp['configured'] else '❌'}")
        print(f"   Authenticated: {'✅' if pp['authenticated'] else '❌'}")

        # Gumroad
        gr = self.gumroad.status()
        print("\n🛒 Gumroad")
        print(f"   Configured: {'✅' if gr['configured'] else '❌'}")
        print(f"   Authenticated: {'✅' if gr['authenticated'] else '❌'}")
        if gr.get("email"):
            print(f"   Account: {gr['email']}")

        # Summary
        print("\n" + "-" * 60)
        total_ok = sum([pp["authenticated"], gr["authenticated"]])
        print(f"📊 Active Platforms: {total_ok}/2")
        print("=" * 60 + "\n")

    def cmd_products(self):
        """List all products across platforms."""
        print("\n" + "=" * 60)
        print("📦 ALL VENTURE ASSETS")
        print("=" * 60)

        # PayPal products
        print("\n💳 PayPal Catalog:")
        pp_products = self.paypal.get_products()
        if pp_products:
            for p in pp_products[:10]:
                print(f"   • {p.get('name', 'N/A')} (ID: {p.get('id', 'N/A')[:20]}...)")
        else:
            print("   (No products or not configured)")

        # Gumroad products
        print("\n🛒 Gumroad:")
        gr_products = self.gumroad.get_products()
        if gr_products:
            for p in gr_products[:10]:
                price = p.get("price", 0) / 100 if p.get("price") else 0
                status = "✅" if p.get("published") else "📝"
                print(f"   {status} {p.get('name', 'N/A')} - ${price:.2f}")
        else:
            print("   (No products or not configured)")

        # Summary
        print("\n" + "-" * 60)
        print(
            f"📊 Total: {len(pp_products)} PayPal + {len(gr_products)} Gumroad = {len(pp_products) + len(gr_products)}"
        )
        print("=" * 60 + "\n")

    def cmd_revenue(self, save: bool = False):
        """Show revenue summary with P&L report."""
        print("\n" + "=" * 60)
        print("💰 GLOBAL REVENUE CONSOLIDATION")
        print("=" * 60)

        total = 0.0
        breakdown = {}

        # Gumroad sales
        print("\n🛒 GUMROAD REVENUE:")
        gr_sales = self.gumroad.get_sales()
        gr_total = 0.0
        gr_count = len(gr_sales)
        if gr_sales:
            for s in gr_sales[:5]:
                amt = float(s.get("price", 0)) / 100
                gr_total += amt
                print(f"   • ${amt:.2f} - {s.get('product_name', 'N/A')}")
            if gr_count > 5:
                print(f"   ... and {gr_count - 5} more sales")
        print(f"   💵 Subtotal: ${gr_total:.2f} ({gr_count} sales)")
        breakdown["gumroad"] = gr_total
        total += gr_total

        # PayPal transactions
        print("\n💳 PAYPAL REVENUE:")
        pp_txns = self.paypal.get_transactions(30)
        pp_total = 0.0
        pp_count = len(pp_txns)
        if pp_txns:
            for t in pp_txns[:5]:
                amt = float(
                    t.get("transaction_info", {})
                    .get("transaction_amount", {})
                    .get("value", 0)
                )
                pp_total += amt
                print(f"   • ${amt:.2f}")
        print(f"   💵 Subtotal: ${pp_total:.2f} ({pp_count} transactions)")
        breakdown["paypal"] = pp_total
        total += pp_total

        # P&L Summary
        print("\n" + "-" * 60)
        print("📊 P&L SUMMARY")
        print("-" * 60)

        # Revenue breakdown
        print(f"\n   GROSS REVENUE: ${total:.2f}")
        for platform, amount in breakdown.items():
            pct = (amount / total * 100) if total > 0 else 0
            bar = "█" * int(pct / 5) if pct > 0 else "░"
            print(
                f"     {platform.capitalize():<10} ${amount:>8.2f} ({pct:>5.1f}%) {bar}"
            )

        # Estimated fees
        gumroad_fee = gr_total * 0.10  # 10% Gumroad fee
        paypal_fee = pp_total * 0.05  # ~5% PayPal fee
        total_fees = gumroad_fee + paypal_fee
        net_revenue = total - total_fees

        print("\n   FEES (estimated):")
        print(f"     Gumroad (10%): -${gumroad_fee:.2f}")
        print(f"     PayPal (~5%):  -${paypal_fee:.2f}")
        print("   ─────────────────────────")
        print(f"   💵 NET REVENUE: ${net_revenue:.2f}")

        # Goal tracking via RevenueEngine if available
        if self.engine:
            dashboard = self.engine.get_goal_dashboard()
            print("\n" + "-" * 60)
            print("🏆 VENTURE GOAL TRACKING (RevenueEngine)")
            print("-" * 60)
            print(f"   🎯 2026 Target: ${dashboard['target_arr']:,.0f} ARR")
            print(f"   📈 Current ARR: ${dashboard['current_arr']:,.2f}")
            print(f"   🚀 Progress:    {dashboard['progress_percent']:.2f}%")
            if dashboard["months_to_goal"] > 0:
                print(
                    f"   ⏳ Time to Goal: {dashboard['months_to_goal']} months (at current growth)"
                )

        print("\n" + "=" * 60 + "\n")

    def cmd_venture_report(self):
        """Generate breakdown by Venture Portfolio."""
        print("\n" + "=" * 60)
        print("🏯 VENTURE PORTFOLIO REPORT")
        print("=" * 60)

        # Aggregate all sales
        gr_sales = self.gumroad.get_sales()
        # Note: PayPal sales often lack product item details in simple transaction list,
        # so this demo focuses on Gumroad tagging for now.

        portfolio_map = {k: 0.0 for k in Config.PORTFOLIO.keys()}
        portfolio_map["Unassigned"] = 0.0

        total_tracked = 0.0

        for s in gr_sales:
            name = s.get("product_name", "").lower()
            amt = float(s.get("price", 0)) / 100

            assigned = False
            for venture, keywords in Config.PORTFOLIO.items():
                if any(k in name for k in keywords):
                    portfolio_map[venture] += amt
                    assigned = True
                    break

            if not assigned:
                portfolio_map["Unassigned"] += amt

            total_tracked += amt

        # Print Table
        print(f"\n{'VENTURE':<20} | {'REVENUE':<10} | {'SHARE (5%)':<10}")
        print("-" * 46)

        for venture, revenue in portfolio_map.items():
            if revenue > 0:
                share = revenue * Config.VENTURE_FEE
                print(f"{venture:<20} | ${revenue:>9.2f} | ${share:>9.2f}")

        print("-" * 46)
        print(
            f"{'TOTAL':<20} | ${total_tracked:>9.2f} | ${total_tracked * Config.VENTURE_FEE:>9.2f}"
        )
        print("\n💡 Share = Venture Studio Management Fee")
        print("=" * 60 + "\n")

    def cmd_sync(self, action: str = "compare"):
        """Sync products between platforms."""
        print("\n" + "=" * 60)
        print("🔄 ASSET SYNC")
        print("=" * 60)

        # Get products from both platforms
        pp_products = self.paypal.get_products()
        gr_products = self.gumroad.get_products()

        if action == "compare":
            self._sync_compare(pp_products, gr_products)
        elif action == "export":
            self._sync_export(gr_products)
        elif action == "import":
            print("\n⚠️  Import to PayPal Catalog requires API permissions")
            print("   Use: python3 scripts/paypal_sdk.py catalog create ...")
        else:
            print(f"\n❓ Unknown action: {action}")
            print("   Use: compare, export, import")

        print("=" * 60 + "\n")

    def _sync_compare(self, pp_products: list, gr_products: list):
        """Compare products between platforms."""
        print("\n📊 COMPARISON:")
        print(f"   PayPal Catalog: {len(pp_products)} products")
        print(f"   Gumroad:        {len(gr_products)} products")

        # Build name sets
        pp_names = {p.get("name", "").lower() for p in pp_products}
        gr_names = {p.get("name", "").lower() for p in gr_products}

        # Find differences
        only_paypal = pp_names - gr_names
        only_gumroad = gr_names - pp_names
        both = pp_names & gr_names

        if both:
            print(f"\n✅ In Both ({len(both)}):")
            for name in list(both)[:5]:
                print(f"   • {name}")
            if len(both) > 5:
                print(f"   ... and {len(both) - 5} more")

        if only_paypal:
            print(f"\n💳 Only in PayPal ({len(only_paypal)}):")
            for name in list(only_paypal)[:5]:
                print(f"   • {name}")

        if only_gumroad:
            print(f"\n🛒 Only in Gumroad ({len(only_gumroad)}):")
            for name in list(only_gumroad)[:5]:
                print(f"   • {name}")

        if not only_paypal and not only_gumroad:
            print("\n✅ Products are in sync!")

    def _sync_export(self, gr_products: list):
        """Export Gumroad products to JSON for PayPal import."""
        from pathlib import Path

        if not gr_products:
            print("\n❌ No Gumroad products to export")
            return

        export_data = []
        for p in gr_products:
            export_data.append(
                {
                    "name": p.get("name", ""),
                    "description": p.get("description", "")[:250]
                    if p.get("description")
                    else "",
                    "price": p.get("price", 0) / 100 if p.get("price") else 0,
                    "type": "DIGITAL",
                    "category": "SOFTWARE",
                    "gumroad_id": p.get("id", ""),
                    "gumroad_url": p.get("short_url", ""),
                    "published": p.get("published", False),
                }
            )

        # Save to file
        export_path = Path("products_export.json")
        with open(export_path, "w") as f:
            json.dump(export_data, f, indent=2)

        print(f"\n✅ Exported {len(export_data)} products to {export_path}")
        print("\n📋 Products:")
        for p in export_data[:5]:
            print(f"   • {p['name']} - ${p['price']:.2f}")
        if len(export_data) > 5:
            print(f"   ... and {len(export_data) - 5} more")
        print("\n💡 Use this file to create PayPal Catalog products")

    def run(self, args):
        """Run payment hub command."""
        if len(args) < 2:
            self.cmd_status()
            print("Commands:")
            print("  status   - Show all platforms status")
            print("  products - List all products")
            print("  revenue  - Show revenue summary")
            print("  venture  - 🏯 Venture Portfolio Report")
            print("  sync     - Compare products (default)")
            print("  sync compare - Compare products")
            print("  sync export  - Export Gumroad to JSON")
            return

        cmd = args[1].lower()

        if cmd == "status":
            self.cmd_status()
        elif cmd == "products":
            self.cmd_products()
        elif cmd == "revenue":
            self.cmd_revenue()
        elif cmd == "venture":
            self.cmd_venture_report()
        elif cmd == "sync":
            action = args[2].lower() if len(args) > 2 else "compare"
            self.cmd_sync(action)
        else:
            print(f"Unknown command: {cmd}")
            print("Use: status, products, revenue, venture, sync")


# =============================================================================
# CLI
# =============================================================================

if __name__ == "__main__":
    hub = PaymentHub()
    hub.run(sys.argv)
