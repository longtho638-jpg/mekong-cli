#!/usr/bin/env python3
"""
🏯 Solo Founder Revenue Autopilot v2.0
Automated multi-platform launch for one-person venture studio

Features:
- Multi-platform launch (Twitter, LinkedIn, IndieHackers, DevHunt, ProductHunt)
- Gumroad monitoring
- AI-powered content generation (optional)
- Async sales tracking

Run: python3 scripts/solo_autopilot.py
"""

import json
import sys
import webbrowser
from datetime import datetime
from pathlib import Path
from typing import Optional

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.finance.gateways.gumroad import GumroadClient


class SoloAutopilot:
    """Automated revenue generation for solo founders."""

    def __init__(self):
        self.gumroad = GumroadClient()
        self.products_dir = Path(__file__).parent.parent / "products"
        self.marketing_dir = Path(__file__).parent.parent / "marketing"
        self.launch_log = Path(__file__).parent.parent / ".antigravity" / "launch_log.json"

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

    def get_linkedin_post(self) -> str:
        """Get LinkedIn post content."""
        linkedin_file = self.marketing_dir / "linkedin_post.md"
        if linkedin_file.exists():
            return linkedin_file.read_text()
        # Default template
        return """🚀 Just shipped 6 digital products for developers!

After 48 hours of focused work, I've created a complete toolkit:
- VSCode Starter Pack (FREE)
- AI Skills Pack ($27)
- Auth Starter ($27)
- FastAPI Pro ($37)
- Admin Dashboard ($47)

Built with #AI and shipped via @Gumroad.

Who else is building in public? 👇

#BuildInPublic #SoloFounder #DevTools"""

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

    def open_linkedin_compose(self):
        """Open LinkedIn share dialog."""
        webbrowser.open("https://www.linkedin.com/feed/?shareActive=true")
        print("💼 Opened LinkedIn Compose")

    def open_indie_hackers(self):
        """Open IndieHackers product submission."""
        webbrowser.open("https://www.indiehackers.com/products/new")
        print("🔥 Opened IndieHackers Product Submission")

    def open_dev_hunt(self):
        """Open DevHunt for dev tool discovery."""
        webbrowser.open("https://devhunt.org/submit")
        print("🚀 Opened DevHunt Submission")

    def open_product_hunt(self):
        """Open Product Hunt submission."""
        webbrowser.open("https://www.producthunt.com/posts/new")
        print("🦄 Opened Product Hunt Submission")

    def open_hacker_news(self):
        """Open Hacker News Show HN."""
        webbrowser.open("https://news.ycombinator.com/submit")
        print("🔶 Opened Hacker News Submit")

    def log_launch(self, platform: str, status: str = "completed"):
        """Log launch activity."""
        self.launch_log.parent.mkdir(parents=True, exist_ok=True)

        log_data = []
        if self.launch_log.exists():
            try:
                log_data = json.loads(self.launch_log.read_text())
            except json.JSONDecodeError:
                log_data = []

        log_data.append(
            {"timestamp": datetime.now().isoformat(), "platform": platform, "status": status}
        )

        self.launch_log.write_text(json.dumps(log_data, indent=2))

    def run_full_launch(self):
        """Execute full multi-platform launch sequence."""
        print("\n" + "=" * 60)
        print("  🏯 SOLO FOUNDER REVENUE AUTOPILOT v2.0")
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
        self.log_launch("gumroad", "checked")

        input("\n⏳ Press ENTER after checking Gumroad...")

        # 3. Twitter launch
        print("\n🐦 STEP 3: Twitter launch...")
        thread = self.get_twitter_thread()
        if thread:
            first_tweet = """I built a $1,000/month passive income machine with 6 digital products.

Total time: 48 hours
Tools: AI + Gumroad
Investment: $0

Here's the playbook 🧵👇

Free VSCode Pack: https://billmentor.gumroad.com/l/wtehzm"""
            self.open_twitter_compose(first_tweet)
            self.log_launch("twitter", "opened")

        input("\n⏳ Press ENTER after posting Twitter thread...")

        # 4. LinkedIn
        print("\n💼 STEP 4: LinkedIn post...")
        print("   Copying LinkedIn post to clipboard...")
        linkedin_post = self.get_linkedin_post()
        try:
            import subprocess

            subprocess.run(["pbcopy"], input=linkedin_post.encode(), check=True)
            print("   ✅ Post copied to clipboard!")
        except Exception:
            print("   ⚠️ Could not copy to clipboard, opening LinkedIn...")
        self.open_linkedin_compose()
        self.log_launch("linkedin", "opened")

        input("\n⏳ Press ENTER after LinkedIn post...")

        # 5. IndieHackers
        print("\n🔥 STEP 5: IndieHackers submission...")
        self.open_indie_hackers()
        self.log_launch("indiehackers", "opened")

        input("\n⏳ Press ENTER after IndieHackers submission...")

        # 6. DevHunt
        print("\n🎯 STEP 6: DevHunt submission...")
        self.open_dev_hunt()
        self.log_launch("devhunt", "opened")

        input("\n⏳ Press ENTER after DevHunt submission...")

        # 7. Product Hunt (optional)
        print("\n🦄 STEP 7: Product Hunt (optional)...")
        ph_choice = input("   Submit to Product Hunt? (y/n): ").strip().lower()
        if ph_choice == "y":
            self.open_product_hunt()
            self.log_launch("producthunt", "opened")

        # Summary
        print("\n" + "=" * 60)
        print("  ✅ LAUNCH SEQUENCE COMPLETE")
        print("=" * 60)
        print("""
📊 Platforms Launched:
  ✅ Gumroad - Products live
  ✅ Twitter - Thread posted
  ✅ LinkedIn - Post shared
  ✅ IndieHackers - Product submitted
  ✅ DevHunt - Tool submitted
  ✅ Product Hunt - (if selected)

🎯 Next Steps:
  1. Monitor Gumroad sales
  2. Engage Twitter replies
  3. Reply on LinkedIn comments
  4. Check IndieHackers feedback
  5. Track DevHunt upvotes

💰 Week 1 Target: $4,025

🔄 Run 'python3 scripts/solo_autopilot.py' again to check status
""")

    def quick_status(self):
        """Quick status check across all platforms."""
        print("\n" + "=" * 50)
        print("  📊 REVENUE AUTOPILOT STATUS")
        print("=" * 50)

        # Gumroad
        status = self.check_gumroad_status()
        print("\n🛒 Gumroad:")
        print(f"   Products: {status.get('products', 0)}")
        print(f"   Sales: {status.get('sales', 0)}")
        print(f"   Revenue: ${status.get('revenue', 0):.2f}")

        # Launch log
        if self.launch_log.exists():
            try:
                log_data = json.loads(self.launch_log.read_text())
                print(f"\n📝 Launch History: {len(log_data)} activities")
                for entry in log_data[-5:]:  # Last 5
                    print(
                        f"   • {entry['platform']}: {entry['status']} ({entry['timestamp'][:10]})"
                    )
            except Exception:
                pass

        print("\n" + "=" * 50)


def main():
    autopilot = SoloAutopilot()

    print("\n🏯 SOLO FOUNDER AUTOPILOT v2.0")
    print("Choose action:")
    print("  1. Full multi-platform launch")
    print("  2. Quick status check")
    print("  3. Open Twitter compose")
    print("  4. Open LinkedIn compose")
    print("  5. View Twitter thread")
    print("  6. Open all dashboards")

    choice = input("\nEnter choice (1-6): ").strip()

    if choice == "1":
        autopilot.run_full_launch()
    elif choice == "2":
        autopilot.quick_status()
    elif choice == "3":
        autopilot.open_twitter_compose()
    elif choice == "4":
        autopilot.open_linkedin_compose()
    elif choice == "5":
        print(autopilot.get_twitter_thread())
    elif choice == "6":
        autopilot.open_gumroad_dashboard()
        autopilot.open_twitter_compose()
        autopilot.open_linkedin_compose()
        print("✅ All dashboards opened!")
    else:
        print("Invalid choice")


if __name__ == "__main__":
    main()
