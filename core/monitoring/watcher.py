"""
Empire Watcher Service
======================
Monitors business metrics and alerts on changes.
"""

import json
import time
from pathlib import Path

from core.config import get_settings
from core.infrastructure.notifications import NotificationService


class EmpireWatcher:
    def __init__(self):
        settings = get_settings()
        self.root_dir = Path.home() / settings.LICENSE_DIR_NAME
        self.notifier = NotificationService()
        self.state_file = self.root_dir / "watcher_state.json"

    def _load_state(self):
        if self.state_file.exists():
            try:
                with open(self.state_file) as f:
                    return json.load(f)
            except:
                pass
        return {}

    def _save_state(self, state):
        with open(self.state_file, "w") as f:
            json.dump(state, f)

    def check_leads(self):
        leads_file = self.root_dir / "leads.json"
        if not leads_file.exists():
            return

        with open(leads_file) as f:
            leads = json.load(f)

        state = self._load_state()
        last_count = state.get("leads_count", 0)
        current_count = len(leads)

        if current_count > last_count:
            diff = current_count - last_count
            self.notifier.send("New Lead", f"{diff} new leads detected!", "success")

        state["leads_count"] = current_count
        self._save_state(state)

    def watch(self):
        """Run monitoring loop."""
        print("👁️ Empire Watcher Active...")
        try:
            while True:
                self.check_leads()
                time.sleep(60)
        except KeyboardInterrupt:
            print("\nStopped.")
