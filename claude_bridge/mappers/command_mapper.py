#!/usr/bin/env python3
"""
Command Mapper - CLI commands to agent workflows
"""

import json
from pathlib import Path


class CommandMapper:
    def __init__(self, bridge_dir: Path):
        self.bridge_dir = bridge_dir
        self.mappings_file = bridge_dir / "command_mappings.json"
        self.load_mappings()

    def load_mappings(self):
        """Load command mappings"""
        if self.mappings_file.exists():
            self.mappings = json.loads(self.mappings_file.read_text())
        else:
            self.mappings = {}

    def save_mappings(self):
        """Save command mappings"""
        self.mappings_file.write_text(json.dumps(self.mappings, indent=2))

    def map_command(self, command: str) -> dict:
        """Map CLI command to agent workflow"""
        # Exact match first
        if command in self.mappings:
            return self.mappings[command]

        # Partial match for skills (/skill skill-name)
        if command.startswith("/skill "):
            skill_name = command.replace("/skill ", "").strip()
            return {
                "type": "skill_activation",
                "skill": skill_name,
                "agent": "skill-executor",
                "workflow": "skill-workflow.md",
            }

        # Fuzzy matching for agencyos commands
        if command.startswith("agencyos "):
            parts = command.split()
            if len(parts) >= 2:
                cmd = parts[1]
                for key, mapping in self.mappings.items():
                    if key.startswith(f"agencyos {cmd}"):
                        return mapping

        # Default
        return {"type": "unknown", "agent": "help-system", "workflow": "help-workflow.md"}

    def add_mapping(self, command: str, mapping: dict):
        """Add new command mapping"""
        self.mappings[command] = mapping
        self.save_mappings()
