#!/usr/bin/env python3
"""
⏰ SCHEDULER SETUP - True 1000% Automation via launchd
=======================================================
Sets up macOS launchd to run autopilot automatically.

Usage:
    python3 scripts/setup_scheduler.py install   # Install scheduled jobs
    python3 scripts/setup_scheduler.py uninstall # Remove scheduled jobs
    python3 scripts/setup_scheduler.py status    # Check status
"""

import subprocess
import sys
from pathlib import Path

# Paths
SCRIPTS_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPTS_DIR.parent
LAUNCHD_DIR = Path.home() / "Library/LaunchAgents"
PLIST_NAME = "com.mekong.autopilot.plist"
PLIST_PATH = LAUNCHD_DIR / PLIST_NAME

# Python path
PYTHON = sys.executable

# Job definition
DAILY_PLIST = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{PLIST_NAME.replace(".plist", "")}</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>{PYTHON}</string>
        <string>{SCRIPTS_DIR / "revenue_autopilot.py"}</string>
        <string>daily</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>{PROJECT_DIR}</string>
    
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>8</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    
    <key>StandardOutPath</key>
    <string>{Path.home()}/.mekong/logs/autopilot.log</string>
    
    <key>StandardErrorPath</key>
    <string>{Path.home()}/.mekong/logs/autopilot-error.log</string>
    
    <key>RunAtLoad</key>
    <false/>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
"""


def cmd_install():
    """Install launchd scheduled job."""
    print("\n⏰ INSTALLING SCHEDULED AUTOMATION")
    print("=" * 50)

    # Create logs directory
    logs_dir = Path.home() / ".mekong/logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    print(f"  ✅ Created logs directory: {logs_dir}")

    # Ensure LaunchAgents exists
    LAUNCHD_DIR.mkdir(exist_ok=True)

    # Write plist
    with open(PLIST_PATH, "w") as f:
        f.write(DAILY_PLIST)
    print(f"  ✅ Created plist: {PLIST_PATH}")

    # Load the job
    try:
        subprocess.run(["launchctl", "unload", str(PLIST_PATH)], capture_output=True)
        result = subprocess.run(
            ["launchctl", "load", str(PLIST_PATH)], capture_output=True, text=True
        )

        if result.returncode == 0:
            print("  ✅ Loaded into launchd")
            print("\n📅 SCHEDULE:")
            print("   Daily at 8:00 AM: revenue_autopilot.py daily")
            print("\n💡 Logs: ~/.mekong/logs/autopilot.log")
            print(
                f"\n🧪 To test now: launchctl start {PLIST_NAME.replace('.plist', '')}"
            )
        else:
            print(f"  ❌ Failed to load: {result.stderr}")
    except Exception as e:
        print(f"  ❌ Error: {e}")


def cmd_uninstall():
    """Remove launchd scheduled job."""
    print("\n🗑️  REMOVING SCHEDULED AUTOMATION")
    print("=" * 50)

    if not PLIST_PATH.exists():
        print("  ⚠️  No scheduled job found")
        return

    try:
        subprocess.run(["launchctl", "unload", str(PLIST_PATH)], capture_output=True)
        PLIST_PATH.unlink()
        print(f"  ✅ Removed: {PLIST_PATH}")
    except Exception as e:
        print(f"  ❌ Error: {e}")


def cmd_status():
    """Check scheduler status."""
    print("\n📊 SCHEDULER STATUS")
    print("=" * 50)

    if not PLIST_PATH.exists():
        print("  ❌ No scheduled job installed")
        print("     Run: setup_scheduler.py install")
        return

    print(f"  ✅ Plist exists: {PLIST_PATH}")

    # Check if loaded
    result = subprocess.run(
        ["launchctl", "list", PLIST_NAME.replace(".plist", "")],
        capture_output=True,
        text=True,
    )

    if result.returncode == 0:
        print("  ✅ Job is LOADED in launchd")
        lines = result.stdout.strip().split("\n")
        for line in lines:
            print(f"     {line}")
    else:
        print("  ⚠️  Job not loaded")
        print(f"     Run: launchctl load {PLIST_PATH}")

    # Check logs
    log_path = Path.home() / ".mekong/logs/autopilot.log"
    if log_path.exists():
        print("\n  📋 Last log entries:")
        with open(log_path) as f:
            lines = f.readlines()[-5:]
            for line in lines:
                print(f"     {line.strip()}")
    else:
        print("\n  📋 No logs yet (will appear after first run)")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nCommands:")
        print("  install   - Set up daily automation at 8 AM")
        print("  uninstall - Remove scheduled automation")
        print("  status    - Check scheduler status")
        return

    cmd = sys.argv[1].lower()

    if cmd == "install":
        cmd_install()
    elif cmd == "uninstall":
        cmd_uninstall()
    elif cmd == "status":
        cmd_status()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
