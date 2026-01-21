#!/usr/bin/env python3
"""
Sync agents from .agent/subagents to .claude/agents.
This script ensures that all specialized agents defined in the subagents directory
are available to Claude Code in .claude/agents.

Strategy:
1. Scan .agent/subagents recursively for .md files.
2. For each agent, check if it exists in .claude/agents.
3. If missing, copy it.
4. If exists, skip (preserve .claude/agents as the "active" configuration).
"""

import os
import shutil
import glob
from pathlib import Path

def sync_agents():
    source_root = Path(".agent/subagents")
    dest_root = Path(".claude/agents")

    if not source_root.exists():
        print(f"Error: Source directory {source_root} does not exist.")
        return

    if not dest_root.exists():
        os.makedirs(dest_root, exist_ok=True)
        print(f"Created directory {dest_root}")

    # Get all markdown files in source, recursively
    source_files = list(source_root.rglob("*.md"))

    print(f"Found {len(source_files)} agents in {source_root}")

    synced_count = 0
    skipped_count = 0

    for src_file in source_files:
        if src_file.name == "README.md":
            continue

        dest_file = dest_root / src_file.name

        if not dest_file.exists():
            print(f"Syncing new agent: {src_file.name}")
            # Read content to check if it has valid frontmatter
            try:
                content = src_file.read_text()
                if not content.startswith("---"):
                    print(f"  Warning: {src_file.name} does not start with frontmatter. Skipping.")
                    continue

                shutil.copy2(src_file, dest_file)
                synced_count += 1
            except Exception as e:
                print(f"  Error syncing {src_file.name}: {e}")
        else:
            # print(f"Skipping existing agent: {src_file.name}")
            skipped_count += 1

    print("-" * 40)
    print(f"Sync Complete.")
    print(f"New agents synced: {synced_count}")
    print(f"Existing agents skipped: {skipped_count}")
    print(f"Total agents in {dest_root}: {len(list(dest_root.glob('*.md')))}")

if __name__ == "__main__":
    sync_agents()
