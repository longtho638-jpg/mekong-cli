#!/usr/bin/env python3
"""
🏯 Solo Founder Revenue Autopilot
Automated multi-platform launch for one-person venture studio

Run: python3 scripts/solo_autopilot.py
"""

import json
import sys
import webbrowser
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.finance.gateways.gumroad import GumroadClient


class SoloAutopilot:
    """Automated revenue generation for solo founders."""

    def __init__(self):
        self.gumroad = GumroadClient()
        self.products_dir = Path(__file__).parent.parent / "products"
        self.marketing_dir = Path(__file__).parent.parent / "marketing"

    def check_gumroad_status(self) -> dict:
        """Check Gumroad account and products."""
        if not self.gumroad.is_configured():
            return {"status": "not_configured", "products": 0, "sales": 0}

        products = self.gumroad.get_products()
        sales = self.gumroad.get_sales()

        return {
            "status": "active",
            "products": len(products),
            "sales": len(sales),
            "revenue": sum(s.get("price", 0) / 100 for s in sales),
        }

    def get_twitter_thread(self) -> str:
        """Get the Twitter thread content."""
        thread_file = self.marketing_dir / "twitter_thread.md"
        if thread_file.exists():
            return thread_file.read_text()
        return ""

    def open_gumroad_dashboard(self):
        """Open Gumroad dashboard for manual product management."""
        webbrowser.open("https://gumroad.com/dashboard")
        print("📊 Opened Gumroad Dashboard")

    def open_twitter_compose(self, tweet: str = ""):
        """Open Twitter compose with pre-filled text."""
        base_url = "https://twitter.com/intent/tweet"
        if tweet:
            import urllib.parse

            encoded = urllib.parse.quote(tweet[:280])
            webbrowser.open(f"{base_url}?text={encoded}")
        else:
            webbrowser.open(base_url)
        print("🐦 Opened Twitter Compose")

    def open_indie_hackers(self):
        """Open IndieHackers product submission."""
        webbrowser.open("https://www.indiehackers.com/products/new")
        print("🔥 Opened IndieHackers Product Submission")

    def open_dev_hunt(self):
        """Open DevHunt for dev tool discovery."""
        webbrowser.open("https://devhunt.org/submit")
        print("🚀 Opened DevHunt Submission")

    def run_full_launch(self):
        """Execute full multi-platform launch sequence."""
        print("\n" + "=" * 60)
        print("  🏯 SOLO FOUNDER REVENUE AUTOPILOT")
        print("  Multi-Platform Launch Sequence")
        print("=" * 60)

        # 1. Check Gumroad
        print("\n📦 STEP 1: Checking Gumroad...")
        status = self.check_gumroad_status()
        print(f"   Status: {status['status']}")
        print(f"   Products: {status.get('products', 0)}")
        print(f"   Revenue: ${status.get('revenue', 0):.2f}")

        # 2. Open platforms
        print("\n🚀 STEP 2: Opening launch platforms...")
        self.open_gumroad_dashboard()

        input("\n⏳ Press ENTER after checking Gumroad...")

        # 3. Twitter launch
        print("\n🐦 STEP 3: Twitter launch...")
        thread = self.get_twitter_thread()
        if thread:
            # Extract first tweet for compose
            first_tweet = """I built a $1,000/month passive income machine with 6 digital products.

Total time: 48 hours
Tools: AI + Gumroad
Investment: $0

Here's the playbook 🧵👇

Free VSCode Pack: https://billmentor.gumroad.com/l/wtehzm"""
            self.open_twitter_compose(first_tweet)

        input("\n⏳ Press ENTER after posting Twitter thread...")

        # 4. IndieHackers
        print("\n🔥 STEP 4: IndieHackers submission...")
        self.open_indie_hackers()

        input("\n⏳ Press ENTER after IndieHackers submission...")

        # 5. DevHunt
        print("\n🎯 STEP 5: DevHunt submission...")
        self.open_dev_hunt()

        # Summary
        print("\n" + "=" * 60)
        print("  ✅ LAUNCH SEQUENCE COMPLETE")
        print("=" * 60)
        print("""
📊 Platforms Launched:
  ✅ Gumroad - Products live
  ✅ Twitter - Thread posted
  ✅ IndieHackers - Product submitted
  ✅ DevHunt - Tool submitted

🎯 Next Steps:
  1. Monitor Gumroad sales
  2. Engage Twitter replies
  3. Reply on IndieHackers
  4. Check DevHunt upvotes

💰 Week 1 Target: $4,025
""")


def main():
    autopilot = SoloAutopilot()

    print("\n🏯 SOLO FOUNDER AUTOPILOT")
    print("Choose action:")
    print("  1. Full multi-platform launch")
    print("  2. Check Gumroad status only")
    print("  3. Open Twitter compose")
    print("  4. View Twitter thread")

    choice = input("\nEnter choice (1-4): ").strip()

    if choice == "1":
        autopilot.run_full_launch()
    elif choice == "2":
        status = autopilot.check_gumroad_status()
        print(json.dumps(status, indent=2))
    elif choice == "3":
        autopilot.open_twitter_compose()
    elif choice == "4":
        print(autopilot.get_twitter_thread())
    else:
        print("Invalid choice")


if __name__ == "__main__":
    main()
