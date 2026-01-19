#!/usr/bin/env python3
"""
Context Manager - Manage shared context between systems
"""

import json
import time
from pathlib import Path
from typing import Any, Dict, Optional


class ContextManager:
    def __init__(self, bridge_dir: Path):
        self.bridge_dir = bridge_dir
        self.context_dir = bridge_dir / "context"
        self.shared_context_file = bridge_dir / "shared_context.json"

        # Ensure directory exists
        self.context_dir.mkdir(parents=True, exist_ok=True)

    def get_shared_context(self) -> Dict[str, Any]:
        """Get shared context"""
        if self.shared_context_file.exists():
            return json.loads(self.shared_context_file.read_text())
        return {}

    def update_shared_context(self, updates: Dict[str, Any]):
        """Update shared context"""
        context = self.get_shared_context()
        context.update(updates)
        context["last_updated"] = time.time()
        self.shared_context_file.write_text(json.dumps(context, indent=2))

    def get_execution_context(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get specific execution context"""
        context_file = self.context_dir / f"{execution_id}.json"
        if context_file.exists():
            return json.loads(context_file.read_text())
        return None

    def save_execution_context(self, execution_id: str, context: Dict[str, Any]):
        """Save execution context"""
        context_file = self.context_dir / f"{execution_id}.json"
        context_file.write_text(json.dumps(context, indent=2))

    def cleanup_old_context(self, max_age_hours: int = 24):
        """Clean up old context files"""
        import time

        current_time = time.time()
        max_age_seconds = max_age_hours * 3600

        for context_file in self.context_dir.glob("*.json"):
            file_age = current_time - context_file.stat().st_mtime
            if file_age > max_age_seconds:
                context_file.unlink()

    def get_active_skills(self) -> list:
        """Get list of currently active skills"""
        shared_context = self.get_shared_context()
        return shared_context.get("active_skills", [])

    def activate_skill(self, skill_name: str):
        """Activate a skill"""
        active_skills = self.get_active_skills()
        if skill_name not in active_skills:
            active_skills.append(skill_name)
            self.update_shared_context({"active_skills": active_skills})

    def deactivate_skill(self, skill_name: str):
        """Deactivate a skill"""
        active_skills = self.get_active_skills()
        if skill_name in active_skills:
            active_skills.remove(skill_name)
            self.update_shared_context({"active_skills": active_skills})
