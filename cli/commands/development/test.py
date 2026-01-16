"""
Test command for running verification workflows.
"""

from typing import List
from cli.commands.base import BaseCommand
import subprocess


class TestCommand(BaseCommand):
    """Test command for verification."""
    
    @property
    def description(self) -> str:
        return "Run enhanced test workflow"
    
    def execute(self, args: List[str]) -> None:
        print("\n🧪 TEST - Verification Mode")
        print("═" * 60)
        
        print("\n📋 Running test suite...")
        print("─" * 60)
        
        try:
            result = subprocess.run(
                ["python", "tests/test_wow.py"], capture_output=True, text=True, timeout=60
            )
            self.console.print(result.stdout)
            if result.returncode == 0:
                self.console.print("\n✅ All tests passed!")
            else:
                self.console.print("\n⚠️ Some tests failed. Review output above.")
        except FileNotFoundError:
            self.console.print("   Running pytest fallback...")
            try:
                subprocess.run(["python", "-m", "pytest", "tests/", "-v"], timeout=60)
            except Exception as e:
                self.console.print(f"   ❌ Error: {e}")
        except Exception as e:
            self.console.print(f"   ❌ Error: {e}")
        
        print("\n   Next: agencyos ship")