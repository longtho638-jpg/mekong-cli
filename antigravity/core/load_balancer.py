"""
Multi-Key Load Balancer for Antigravity Proxy
Rotates requests across multiple accounts for optimal quota usage.

Inspired by: https://github.com/Mirrowel/LLM-API-Key-Proxy
"""

import json
import random
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional


@dataclass
class AccountKey:
    """Represents a single API account/key."""

    name: str
    api_key: str
    provider: str  # 'claude' or 'gemini'
    model: str
    priority: int = 1  # Higher = more likely to be selected
    cooldown_until: Optional[datetime] = None
    request_count: int = 0
    error_count: int = 0
    last_used: Optional[datetime] = None
    quota_percent: float = 100.0  # Remaining quota

    def is_available(self) -> bool:
        """Check if key is available (not in cooldown)."""
        if self.cooldown_until:
            return datetime.now() > self.cooldown_until
        return True

    def set_cooldown(self, seconds: int = 60):
        """Put key in cooldown after rate limit."""
        self.cooldown_until = datetime.now() + timedelta(seconds=seconds)
        self.error_count += 1

    def record_use(self):
        """Record successful usage."""
        self.request_count += 1
        self.last_used = datetime.now()


class MultiKeyLoadBalancer:
    """
    Load balancer for rotating between multiple API keys/accounts.

    Strategies:
    - random: Random selection weighted by priority
    - round_robin: Sequential rotation through available keys
    - least_used: Select key with lowest request count
    - quota_aware: Select key with highest remaining quota
    """

    def __init__(
        self, keys: list[AccountKey], strategy: str = "random", state_file: Optional[Path] = None
    ):
        self.keys = keys
        self.strategy = strategy
        self.state_file = state_file or Path.home() / ".antigravity" / "key_state.json"
        self.current_index = 0  # For round-robin

        # Load persisted state
        self._load_state()

    def get_next_key(self, provider_filter: Optional[str] = None) -> Optional[AccountKey]:
        """
        Get next available key based on strategy.

        Args:
            provider_filter: Optional filter for 'claude' or 'gemini'

        Returns:
            Selected AccountKey or None if all exhausted
        """
        available = [k for k in self.keys if k.is_available()]

        if provider_filter:
            available = [k for k in available if k.provider == provider_filter]

        if not available:
            return None

        if self.strategy == "random":
            # Weighted random based on priority
            weights = [k.priority for k in available]
            selected = random.choices(available, weights=weights, k=1)[0]

        elif self.strategy == "round_robin":
            # Simple rotation
            selected = available[self.current_index % len(available)]
            self.current_index += 1

        elif self.strategy == "least_used":
            selected = min(available, key=lambda k: k.request_count)

        elif self.strategy == "quota_aware":
            selected = max(available, key=lambda k: k.quota_percent)

        else:
            selected = available[0]

        selected.record_use()
        self._save_state()
        return selected

    def report_error(self, key: AccountKey, error_type: str = "rate_limit"):
        """Report an error for a key, potentially putting it in cooldown."""
        if error_type == "rate_limit":
            key.set_cooldown(60)  # 1 minute cooldown
        elif error_type == "quota_exhausted":
            key.set_cooldown(3600)  # 1 hour cooldown
            key.quota_percent = 0
        elif error_type == "auth_error":
            key.set_cooldown(86400)  # 24 hour cooldown

        self._save_state()

    def update_quota(self, key: AccountKey, percent: float):
        """Update remaining quota for a key."""
        key.quota_percent = percent
        self._save_state()

    def get_stats(self) -> dict:
        """Get usage statistics for all keys."""
        return {
            "total_keys": len(self.keys),
            "available_keys": len([k for k in self.keys if k.is_available()]),
            "total_requests": sum(k.request_count for k in self.keys),
            "keys": [
                {
                    "name": k.name,
                    "provider": k.provider,
                    "model": k.model,
                    "requests": k.request_count,
                    "errors": k.error_count,
                    "quota_percent": k.quota_percent,
                    "available": k.is_available(),
                    "last_used": k.last_used.isoformat() if k.last_used else None,
                }
                for k in self.keys
            ],
        }

    def _save_state(self):
        """Persist state to disk."""
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        state = {
            "current_index": self.current_index,
            "keys": {
                k.name: {
                    "request_count": k.request_count,
                    "error_count": k.error_count,
                    "quota_percent": k.quota_percent,
                    "cooldown_until": k.cooldown_until.isoformat() if k.cooldown_until else None,
                    "last_used": k.last_used.isoformat() if k.last_used else None,
                }
                for k in self.keys
            },
        }
        self.state_file.write_text(json.dumps(state, indent=2))

    def _load_state(self):
        """Load persisted state."""
        if not self.state_file.exists():
            return

        try:
            state = json.loads(self.state_file.read_text())
            self.current_index = state.get("current_index", 0)

            for key in self.keys:
                if key.name in state.get("keys", {}):
                    ks = state["keys"][key.name]
                    key.request_count = ks.get("request_count", 0)
                    key.error_count = ks.get("error_count", 0)
                    key.quota_percent = ks.get("quota_percent", 100.0)
                    if ks.get("cooldown_until"):
                        key.cooldown_until = datetime.fromisoformat(ks["cooldown_until"])
                    if ks.get("last_used"):
                        key.last_used = datetime.fromisoformat(ks["last_used"])
        except (json.JSONDecodeError, KeyError):
            pass  # Start fresh if corrupted


# ============================================================
# Example Configuration
# ============================================================


def create_default_balancer() -> MultiKeyLoadBalancer:
    """
    Create load balancer with configured accounts.
    Configure your accounts in ~/.antigravity/accounts.json
    """
    config_file = Path.home() / ".antigravity" / "accounts.json"

    if config_file.exists():
        config = json.loads(config_file.read_text())
        keys = [
            AccountKey(
                name=acc["name"],
                api_key=acc["api_key"],
                provider=acc["provider"],
                model=acc["model"],
                priority=acc.get("priority", 1),
                quota_percent=acc.get("quota_percent", 100.0),
            )
            for acc in config.get("accounts", [])
        ]
    else:
        # Default configuration - user should override
        keys = [
            AccountKey(
                "claude-opus-1",
                "key1",
                "claude",
                "claude-opus-4-5-thinking",
                priority=2,
                quota_percent=93,
            ),
            AccountKey(
                "claude-sonnet-1",
                "key2",
                "claude",
                "claude-sonnet-4-5",
                priority=2,
                quota_percent=93,
            ),
            AccountKey(
                "gemini-pro-1", "key3", "gemini", "gemini-3-pro-high", priority=1, quota_percent=67
            ),
            AccountKey(
                "gemini-flash-1", "key4", "gemini", "gemini-3-flash", priority=1, quota_percent=33
            ),
        ]

    return MultiKeyLoadBalancer(
        keys=keys,
        strategy="quota_aware",  # Prefer keys with more quota remaining
    )


if __name__ == "__main__":
    # Demo
    balancer = create_default_balancer()

    print("=== Multi-Key Load Balancer Demo ===")
    print(f"Strategy: {balancer.strategy}")
    print(f"Total keys: {len(balancer.keys)}")

    print("\n--- Simulating 10 requests ---")
    for i in range(10):
        key = balancer.get_next_key()
        if key:
            print(f"Request {i + 1}: Using {key.name} ({key.provider}/{key.model})")

    print("\n--- Stats ---")
    stats = balancer.get_stats()
    for key_stat in stats["keys"]:
        print(
            f"  {key_stat['name']}: {key_stat['requests']} requests, {key_stat['quota_percent']}% quota"
        )
