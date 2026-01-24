#!/usr/bin/env python3
"""
Shim for Solo Revenue Daemon.
Imports logic from antigravity.mcp_servers.solo_revenue_server.handlers
"""
import os
import sys
from pathlib import Path

# Ensure project root is in path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

try:
    from antigravity.mcp_servers.solo_revenue_server.handlers import SoloRevenueHandler
except ImportError as e:
    print(f"Error importing handler: {e}")
    sys.exit(1)

import asyncio
import json


async def main():
    daemon = SoloRevenueHandler()

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "status":
            status = daemon.get_status()
            print(json.dumps(status, indent=2))

        elif command == "run":
            # The handler version is sync/async mixed?
            # In handlers.py: execute_task is async. run_all_tasks is sync wrapper?
            # Let's check handlers.py again.
            # run_all_tasks is sync in the file I read (lines 353).
            # But wait, execute_task is async (line 328). run_all_tasks calls self.execute_task(task_id).
            # This would fail if not awaited.
            # The code I read for handlers.py might have a bug if it calls async from sync without loop.
            # Let's re-read handlers.py specifically around run_all_tasks.
            pass

if __name__ == "__main__":
    # We need to check the async nature of handlers.py first
    pass
