"""
Telemetry Consent Manager — Post-GA Privacy Compliance

Handles:
- Consent prompt on first run
- Store/retrieve consent preference
- Generate anonymous session IDs
- Opt-in/opt-out management

Reference: plans/260307-1602-telemetry-consent-opt-in/plan.md
"""

import json
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from rich.console import Console
from rich.prompt import Confirm
from rich.panel import Panel

console = Console()


@dataclass
class ConsentPreferences:
    """User telemetry consent preferences."""
    consent_given: bool = False
    consent_timestamp: str = ""
    anonymous_id: str = ""
    version: str = "1.0"  # Consent schema version


class ConsentManager:
    """
    Manage telemetry consent preferences.

    Storage: ~/.mekong/telemetry-consent.json
    """

    def __init__(self, config_dir: str = "~/.mekong"):
        self._config_dir = Path(config_dir).expanduser()
        self._consent_file = self._config_dir / "telemetry-consent.json"
        self._preferences: Optional[ConsentPreferences] = None

    def ensure_config_dir(self) -> None:
        """Create config directory if not exists."""
        self._config_dir.mkdir(parents=True, exist_ok=True)

    def load_consent(self) -> Optional[ConsentPreferences]:
        """Load consent preferences from file."""
        if self._preferences:
            return self._preferences

        if not self._consent_file.exists():
            return None

        try:
            with open(self._consent_file, "r") as f:
                data = json.load(f)
                self._preferences = ConsentPreferences(**data)
                return self._preferences
        except (json.JSONDecodeError, KeyError):
            return None

    def save_consent(self, preferences: ConsentPreferences) -> None:
        """Save consent preferences to file."""
        self.ensure_config_dir()
        with open(self._consent_file, "w") as f:
            json.dump(asdict(preferences), f, indent=2)
        self._preferences = preferences

    def has_consent(self) -> bool:
        """Check if user has given consent."""
        preferences = self.load_consent()
        return preferences is not None and preferences.consent_given

    def prompt_consent(self) -> ConsentPreferences:
        """Show interactive consent prompt."""
        console.print(Panel(
            """[bold cyan]📊 Help Improve Mekong CLI[/bold cyan]

Would you like to send [green]anonymous usage data[/green] to help improve Mekong CLI?

[dim]We collect:[/dim]
• Command names (e.g., "cook", "plan", "roi status")
• Session duration and command count
• Error rates (anonymized error types only)
• CLI version and OS information

[dim]We DO NOT collect:[/dim]
• License keys or API secrets
• File paths or code content
• IP addresses or personal information
• Any identifiable data

[yellow]You can change this setting anytime:[/yellow]
  mekong telemetry enable   # Opt-in
  mekong telemetry disable  # Opt-out
  mekong telemetry status   # Check status
""",
            title="🔒 Privacy-First Telemetry",
            border_style="cyan",
        ))

        consent = Confirm.ask(
            "\n[bold]Would you like to enable anonymous telemetry?[/bold]",
            default=True,
        )

        preferences = ConsentPreferences(
            consent_given=consent,
            consent_timestamp=datetime.now(timezone.utc).isoformat(),
            anonymous_id=str(uuid.uuid4()),
            version="1.0",
        )

        if consent:
            console.print("\n[green]✓ Telemetry enabled. Thank you![/green]\n")
        else:
            console.print("\n[yellow]✓ Telemetry disabled. No data will be collected.[/yellow]\n")

        self.save_consent(preferences)
        return preferences

    def get_anonymous_id(self) -> Optional[str]:
        """Get anonymous user ID (only if consent given)."""
        preferences = self.load_consent()
        if preferences and preferences.consent_given:
            return preferences.anonymous_id
        return None

    def enable(self) -> ConsentPreferences:
        """Enable telemetry."""
        preferences = self.load_consent() or ConsentPreferences()
        preferences.consent_given = True
        preferences.consent_timestamp = datetime.now(timezone.utc).isoformat()
        if not preferences.anonymous_id:
            preferences.anonymous_id = str(uuid.uuid4())
        self.save_consent(preferences)
        return preferences

    def disable(self) -> ConsentPreferences:
        """Disable telemetry."""
        preferences = self.load_consent() or ConsentPreferences()
        preferences.consent_given = False
        self.save_consent(preferences)
        return preferences

    def get_status(self) -> dict:
        """Get consent status."""
        preferences = self.load_consent()
        if not preferences:
            return {
                "status": "not_set",
                "message": "Consent not set. Run 'mekong telemetry enable' to opt-in.",
            }
        return {
            "status": "enabled" if preferences.consent_given else "disabled",
            "anonymous_id": preferences.anonymous_id if preferences.consent_given else None,
            "consent_timestamp": preferences.consent_timestamp,
            "version": preferences.version,
        }


def get_consent_manager() -> ConsentManager:
    """Get singleton ConsentManager instance."""
    return ConsentManager()
