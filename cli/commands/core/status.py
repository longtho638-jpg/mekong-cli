"""
Status command for system health checks.
"""

from typing import List
from cli.commands.base import BaseCommand


class StatusCommand(BaseCommand):
    """Status command for system health."""
    
    @property
    def description(self) -> str:
        return "Check system status and license"
    
    def execute(self, args: List[str]) -> None:
        print("\n🏯 Agency OS - Status Check")
        print("═" * 60)
        
        try:
            from core.subscription_middleware import (
                SubscriptionMiddleware,
                SubscriptionTier,
            )
            
            email = "unknown"
            tier = "unknown"
            
            middleware = SubscriptionMiddleware()
            
            import json
            from pathlib import Path
            license_path = Path.home() / ".mekong" / "license.json"
            
            if license_path.exists():
                try:
                    data = json.loads(license_path.read_text())
                    email = data.get("email", "unknown")
                    self.console.print(f"\n👤 Account: {email}")
                except:
                    pass
            
            if email != "unknown":
                sub = middleware.get_subscription(email)
                tier = sub.get("tier", "FREE")
                
                limits = middleware.check_limit(email, "api_call")
                limit = limits.get("limit", 0)
                current = limits.get("current", 0)
                
                self.console.print(f"💎 License: {str(tier).upper()}")
                self.console.print(f"📊 API Quota: {current:,.0f} / {limit:,.0f}")
                
                warn = middleware.check_and_warn_quota(email)
                if warn.get("has_warning"):
                    self.console.print("\n⚠️  WARNINGS:")
                    for w in warn.get("warnings", []):
                        self.console.print(f"   - {w}")
                else:
                    self.console.print("\n✅ System Status: HEALTHY")
            else:
                self.console.print("❌ No active license found.")
                self.console.print("   Run: python3 scripts/activate_uitra.py <email>")
                
        except ImportError:
            self.console.print("❌ Core modules not found.")
        except Exception as e:
            self.console.print(f"❌ Error checking status: {e}")