"""
🫣 Peekaboo Quota Automation
==============================
Integrates Peekaboo Mac automation with Antigravity Quota Monitor.

Features:
- Visual quota capture from Antigravity panel
- AI analysis of quota percentages
- Auto wake-up when quota drops below threshold
- Natural language automation

Usage:
    python3 scripts/quota_peekaboo.py capture
    python3 scripts/quota_peekaboo.py analyze
    python3 scripts/quota_peekaboo.py wakeup --model claude-sonnet
    python3 scripts/quota_peekaboo.py auto
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class PeekabooQuotaManager:
    """
    Integrates Peekaboo with Antigravity Quota Monitor.

    Uses Peekaboo's see/click/agent commands to:
    1. Capture Antigravity quota panel screenshots
    2. AI analyze quota percentages
    3. Auto wake-up models when quota drops
    """

    QUOTA_THRESHOLD_WARNING = 30
    QUOTA_THRESHOLD_CRITICAL = 10

    def __init__(self, cache_dir: Optional[Path] = None):
        self.cache_dir = cache_dir or Path.home() / ".mekong" / "peekaboo_cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def check_peekaboo_installed(self) -> bool:
        """Check if Peekaboo is installed."""
        try:
            result = subprocess.run(
                ["peekaboo", "--version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False

    def capture_quota_panel(
        self, app_name: str = "Antigravity"
    ) -> Optional[Dict[str, Any]]:
        """
        Capture Antigravity quota panel using Peekaboo see command.

        Returns snapshot data with UI elements.
        """
        print(f"📸 Capturing {app_name} quota panel...")

        try:
            result = subprocess.run(
                [
                    "peekaboo",
                    "see",
                    "--app",
                    app_name,
                    "--json-output",
                ],
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode == 0:
                data = json.loads(result.stdout)

                # Save snapshot to cache
                snapshot_file = (
                    self.cache_dir
                    / f"quota_snapshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                )
                with open(snapshot_file, "w") as f:
                    json.dump(data, f, indent=2)

                print(
                    f"✅ Captured snapshot: {data.get('data', {}).get('snapshot_id', 'unknown')}"
                )
                return data
            else:
                print(f"❌ Capture failed: {result.stderr}")
                return None

        except (subprocess.TimeoutExpired, json.JSONDecodeError) as e:
            print(f"❌ Error: {e}")
            return None

    def analyze_quota_screenshot(
        self, image_path: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Use Peekaboo image --analyze to AI-analyze quota screenshot.

        Detects:
        - Model names
        - Quota percentages
        - Reset times
        """
        print("🔍 Analyzing quota with AI...")

        cmd = [
            "peekaboo",
            "image",
            "--mode",
            "window",
            "--analyze",
            "--json-output",
        ]

        if image_path:
            cmd.extend(["--path", image_path])

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,  # AI analysis can take time
            )

            if result.returncode == 0:
                data = json.loads(result.stdout)
                print("✅ Analysis complete")
                return data
            else:
                print(f"❌ Analysis failed: {result.stderr}")
                return None

        except (subprocess.TimeoutExpired, json.JSONDecodeError) as e:
            print(f"❌ Error: {e}")
            return None

    def auto_wakeup(self, model_name: str = "Claude Sonnet") -> bool:
        """
        Auto wake-up a model using Peekaboo agent.

        This uses natural language to:
        1. Open Antigravity
        2. Start a new chat
        3. Send a minimal message to trigger quota refresh
        """
        print(f"⏰ Waking up {model_name}...")

        prompt = f"""
        Open Antigravity IDE and do the following:
        1. Click on the chat panel
        2. Start a new conversation if needed
        3. Select the model: {model_name}
        4. Type "Hello" and press Enter
        5. Wait 2 seconds for the response
        """

        try:
            result = subprocess.run(
                [
                    "peekaboo",
                    prompt.strip(),
                    "--max-steps",
                    "10",
                ],
                capture_output=True,
                text=True,
                timeout=120,  # Agent can take time
            )

            if result.returncode == 0:
                print(f"✅ Successfully woke up {model_name}")
                return True
            else:
                print(f"❌ Wake-up failed: {result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            print("❌ Wake-up timed out")
            return False

    def run_automation(self, threshold: int = 30) -> Dict[str, Any]:
        """
        Full automation flow:
        1. Capture quota panel
        2. Detect low quota models
        3. Auto wake-up if needed
        """
        print("🤖 Running full Peekaboo quota automation...")

        # First try to get quota from our internal engine
        try:
            from antigravity.core.quota import QuotaEngine

            engine = QuotaEngine()
            status = engine.get_current_status()

            low_quota_models = []
            for model in status["models"]:
                if model["remaining_percent"] < threshold:
                    low_quota_models.append(model)

            if low_quota_models:
                print(f"⚠️ Found {len(low_quota_models)} models below {threshold}%")
                for model in low_quota_models:
                    print(f"   🔴 {model['name']}: {model['remaining_percent']:.0f}%")

                # Wake up the lowest one
                lowest = min(low_quota_models, key=lambda m: m["remaining_percent"])
                self.auto_wakeup(lowest["name"])
            else:
                print(f"✅ All models above {threshold}% - no action needed")

            return {
                "status": "completed",
                "low_quota_models": low_quota_models,
                "timestamp": datetime.now().isoformat(),
            }

        except ImportError:
            print("⚠️ QuotaEngine not available, using visual capture")
            snapshot = self.capture_quota_panel()
            return {
                "status": "visual_capture",
                "snapshot": snapshot,
                "timestamp": datetime.now().isoformat(),
            }


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="🫣 Peekaboo Quota Automation")

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Capture
    subparsers.add_parser("capture", help="Capture quota panel screenshot")

    # Analyze
    subparsers.add_parser("analyze", help="AI analyze quota screenshot")

    # Wakeup
    wakeup_parser = subparsers.add_parser("wakeup", help="Wake up a model")
    wakeup_parser.add_argument(
        "--model", default="Claude Sonnet", help="Model to wake up"
    )

    # Auto
    auto_parser = subparsers.add_parser("auto", help="Full automation flow")
    auto_parser.add_argument(
        "--threshold", type=int, default=30, help="Quota threshold"
    )

    # Check
    subparsers.add_parser("check", help="Check Peekaboo installation")

    args = parser.parse_args()
    manager = PeekabooQuotaManager()

    if args.command == "check":
        if manager.check_peekaboo_installed():
            print("✅ Peekaboo is installed!")
            subprocess.run(["peekaboo", "--version"])
        else:
            print(
                "❌ Peekaboo not found. Install with: brew install steipete/tap/peekaboo"
            )
            sys.exit(1)

    elif args.command == "capture":
        result = manager.capture_quota_panel()
        if result:
            print(json.dumps(result, indent=2)[:1000])

    elif args.command == "analyze":
        result = manager.analyze_quota_screenshot()
        if result:
            print(json.dumps(result, indent=2)[:1000])

    elif args.command == "wakeup":
        manager.auto_wakeup(args.model)

    elif args.command == "auto":
        result = manager.run_automation(args.threshold)
        print(json.dumps(result, indent=2))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
